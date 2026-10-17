import copy
import gzip
import hashlib
import importlib.util
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
spec = importlib.util.spec_from_file_location('evidence_review', ROOT / 'scripts/review-v029d3-evidence.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def profile(vap):
    result = module.empty_profile()
    result['totalVotingAgePopulation'] = result['non_hispanic_white'] = vap
    return result


def fixture():
    units = [
        {'unitId': 'source', 'countyFips': '26001', 'status': 'complete', 'sourceBlockCount': 1,
         'profile': profile(10), 'unresolvedTouchingBlockCount': 0},
        {'unitId': 'foreign', 'countyFips': '26003', 'status': 'unavailable', 'sourceBlockCount': 0,
         'profile': None, 'unresolvedTouchingBlockCount': 1},
    ]
    blocks = [
        {'blockGeoid': '260010001001000', 'countyFips': '26001', 'disposition': 'allocated', 'unitId': 'source',
         'reason': None, 'affectedUnitIds': [], 'sourceProfile': profile(10)},
        {'blockGeoid': '260010001001001', 'countyFips': '26001', 'disposition': 'unavailable', 'unitId': None,
         'reason': 'county_boundary_conflict', 'affectedUnitIds': ['foreign'], 'sourceProfile': profile(2)},
    ]
    return blocks, units


class EvidenceSemanticsTests(unittest.TestCase):
    def test_foreign_only_exposure_flags_source_county_without_allocating_or_relabeling(self):
        blocks, units = fixture()
        before = copy.deepcopy((blocks, units))
        audit, _ = module.inventory(blocks, units)
        county = audit['countiesWithUnlocalizedPositiveVap'][0]
        self.assertEqual(county['countyFips'], '26001')
        self.assertEqual(county['unitIdsRequiringCountyContext'], ['source'])
        self.assertEqual(county['diagnosticStatusCounts'], {'complete': 1})
        self.assertEqual(audit['allocatedProfile'], profile(10))
        self.assertEqual(audit['unavailableProfile'], profile(2))
        self.assertEqual((blocks, units), before)

    def test_shared_exposure_counts_people_once(self):
        blocks, units = fixture()
        blocks[1]['affectedUnitIds'].append('source')
        units[0]['unresolvedTouchingBlockCount'] = 1
        units[0]['status'] = 'partial'
        audit, touching = module.inventory(blocks, units)
        self.assertEqual(audit['unavailableProfile'], profile(2))
        self.assertEqual(sum(b['sourceProfile'][module.VAP] for group in touching.values() for b in group), 4)
        self.assertEqual(audit['countiesWithUnlocalizedPositiveVap'], [])
        self.assertEqual(audit, module.inventory(list(reversed(blocks)), list(reversed(units)))[0])

    def test_zero_vap_is_not_a_positive_gap_and_cannot_hide_nonzero_groups(self):
        blocks, units = fixture()
        blocks[1]['sourceProfile'] = profile(0)
        audit, _ = module.inventory(blocks, units)
        self.assertEqual(audit['positiveUnavailableBlocks'], [])
        self.assertEqual(audit['unavailableReasons']['county_boundary_conflict']['blockCount'], 1)
        blocks[1]['sourceProfile']['non_hispanic_black'] = 1
        with self.assertRaisesRegex(ValueError, 'reconcile'):
            module.inventory(blocks, units)

    def test_duplicate_unknown_cross_county_and_profile_drift_fail(self):
        for mutation in ['duplicate_block', 'unknown_target', 'cross_county', 'profile_drift', 'duplicate_target']:
            with self.subTest(mutation=mutation):
                blocks, units = fixture()
                if mutation == 'duplicate_block':
                    blocks.append(copy.deepcopy(blocks[0]))
                elif mutation == 'unknown_target':
                    blocks[1]['affectedUnitIds'] = ['absent']
                elif mutation == 'cross_county':
                    blocks[0]['unitId'] = 'foreign'
                elif mutation == 'profile_drift':
                    units[0]['profile'] = profile(11)
                else:
                    blocks[1]['affectedUnitIds'].append('foreign')
                with self.assertRaises(ValueError):
                    module.inventory(blocks, units)


class FrozenEvidenceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = json.loads((ROOT / 'docs/review/v0.29d3-evidence-quality/evidence-review.json').read_text())
        cls.blocks = json.loads(gzip.decompress((ROOT / 'docs/review/v0.29d1-michigan-normalization/block-trace.json.gz').read_bytes()))['blocks']
        cls.candidate = json.loads((ROOT / 'docs/review/v0.29d1-michigan-normalization/candidate.json').read_text())

    def test_unique_positive_inventory_conserves_every_group(self):
        positive = [b for b in self.blocks if b['disposition'] == 'unavailable' and b['sourceProfile'][module.VAP] > 0]
        self.assertEqual({b['blockGeoid'] for b in positive}, {b['blockGeoid'] for b in self.report['positiveUnavailableBlocks']})
        self.assertEqual(len(positive), 179)
        non_sturgis = [b for b in positive if b['reason'] != 'quarantined_map_geometry']
        self.assertEqual(len(non_sturgis), 26)
        self.assertEqual(sum(b['sourceProfile'][module.VAP] for b in non_sturgis), 491)
        for field in module.FIELDS:
            self.assertEqual(sum(b['sourceProfile'][field] for b in positive), self.report['unavailableProfile'][field])
            self.assertEqual(self.report['allocatedProfile'][field] + self.report['unavailableProfile'][field], self.report['sourceProfile'][field])

    def test_all_partial_rows_and_regressions_preserved_with_separate_county_context(self):
        rows = self.report['partialUnits']
        self.assertEqual({u['unitId'] for u in rows}, {u['unitId'] for u in self.candidate['units'] if u['status'] == 'partial'})
        self.assertEqual(len(rows), 382)
        self.assertEqual(sum(r['touchingEvidence'] == 'zero_vap_only' for r in rows), 349)
        self.assertTrue(all(r['diagnosticStatus'] == 'partial' and not r['statusUpgradeAuthorized'] for r in rows))
        counties = self.report['countiesWithUnlocalizedPositiveVap']
        self.assertEqual({c['countyFips']: c['unlocalizedProfile'][module.VAP] for c in counties}, {'26017': 47, '26073': 1})
        self.assertEqual(sum(len(c['unitIdsRequiringCountyContext']) for c in counties), 63)
        self.assertEqual(sum(c['diagnosticStatusCounts']['complete'] for c in counties), 52)
        self.assertEqual(sum(r['countyHasUnlocalizedPositiveVap'] and r['touchingEvidence'] == 'zero_vap_only' for r in rows), 7)
        regressions = self.report['regressions']
        self.assertEqual(len(regressions), 14)
        self.assertEqual([(r['unitId'], r['touchingUnresolvedVap']) for r in regressions if r['positiveVapBlockIds']], [('WP-099-68380-00002', 2)])

    def test_flint_block_membership_reconstructs_all_eight_profiles_without_double_counting(self):
        blocks = {b['blockGeoid']: b for b in self.blocks}
        rows = self.report['flintTownship']['units']
        self.assertEqual(len(rows), 8)
        seen = set()
        for row in rows:
            combined = module.empty_profile()
            for source in row['sourceVtdContributions']:
                expected = module.empty_profile()
                for block_id in source['blockIds']:
                    self.assertNotIn(block_id, seen)
                    seen.add(block_id)
                    self.assertEqual(blocks[block_id]['unitId'], row['unitId'])
                    module.add_profile(expected, blocks[block_id]['sourceProfile'])
                self.assertEqual(expected, source['allocatedProfile'])
                module.add_profile(combined, expected)
            self.assertEqual(combined, row['candidateProfile'])
            self.assertFalse(row['boundaryValidationPassed'])
        self.assertEqual(seen, {b['blockGeoid'] for b in self.blocks if (b['unitId'] or '').startswith(module.FLINT)})
        precinct2 = next(r for r in rows if r['unitId'].endswith('00002'))
        self.assertEqual(precinct2['admittedCensusVtdGeoid'], '26049049117')
        self.assertEqual({s['censusVtdGeoid']: s['allocatedProfile'][module.VAP] for s in precinct2['sourceVtdContributions']},
                         {'26049049116': 1331, '26049049117': 1900, '26049049119': 2528})

    def test_frozen_inputs_and_three_state_runtime_hashes_match_retention_decisions(self):
        registry = json.loads(module.REGISTRY.read_text())
        self.assertEqual(registry['files'], self.report['fingerprints'])
        for path, expected in registry['files'].items():
            with (ROOT / path).open('rb') as source:
                self.assertEqual(hashlib.file_digest(source, 'sha256').hexdigest(), expected, path)
        self.assertFalse(self.report['admissionAuthorized'])
        self.assertFalse(self.report['migrationAuthorized'])
        self.assertEqual([r['state'] for r in self.report['retentionDecisions']], ['PA', 'MI', 'WI'])
        for decision in self.report['retentionDecisions']:
            self.assertEqual(decision['decision'], 'retain_existing')
            self.assertFalse(decision['replacementAdmitted'])
            self.assertIn(decision['artifact'], registry['files'])


if __name__ == '__main__':
    unittest.main()
