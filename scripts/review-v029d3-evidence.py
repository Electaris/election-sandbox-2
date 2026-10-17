"""Review frozen Michigan evidence; never change allocation, completeness, or runtime."""
import argparse
import csv
import gzip
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

from lib.michigan_candidate import FIELDS, add_profile, empty_profile, validate_profile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs/review/v0.29d3-evidence-quality'
REGISTRY = ROOT / 'data-sources/michigan/v029d3-evidence-review-sources.json'
VAP = FIELDS[0]
FLINT = 'WP-049-29020-'


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False) + '\n').encode()


def unique(rows, key):
    result = {r[key]: r for r in rows}
    if len(result) != len(rows):
        raise ValueError('Duplicate ' + key)
    return result


def inventory(blocks, units):
    """Count people once by block, keeping touching exposure separate from ownership."""
    by_unit = unique(units, 'unitId')
    unique(blocks, 'blockGeoid')
    touching = defaultdict(list)
    unlocalized = defaultdict(list)
    categories = {}
    positive = []
    source, allocated, unavailable = empty_profile(), empty_profile(), empty_profile()
    allocated_units = defaultdict(empty_profile)
    allocated_counts = Counter()
    for b in sorted(blocks, key=lambda b: b['blockGeoid']):
        validate_profile(b['sourceProfile'])
        if b['blockGeoid'][:5] != b['countyFips']:
            raise ValueError('Source county mismatch')
        add_profile(source, b['sourceProfile'])
        if b['disposition'] == 'allocated':
            if b['unitId'] not in by_unit or by_unit[b['unitId']]['countyFips'] != b['countyFips']:
                raise ValueError('Unknown or cross-county allocation')
            if b['affectedUnitIds'] or b['reason'] is not None:
                raise ValueError('Allocated block has unresolved evidence')
            add_profile(allocated, b['sourceProfile'])
            add_profile(allocated_units[b['unitId']], b['sourceProfile'])
            allocated_counts[b['unitId']] += 1
            continue
        if b['disposition'] != 'unavailable' or b['unitId'] is not None or not b['reason']:
            raise ValueError('Invalid unavailable disposition')
        ids = b['affectedUnitIds']
        if len(set(ids)) != len(ids) or any(i not in by_unit for i in ids):
            raise ValueError('Unknown or duplicate affected target')
        add_profile(unavailable, b['sourceProfile'])
        same = sorted(i for i in ids if by_unit[i]['countyFips'] == b['countyFips'])
        foreign = sorted(set(ids) - set(same))
        for i in ids:
            touching[i].append(b)
        if not same:
            unlocalized[b['countyFips']].append(b)
        category = categories.setdefault(b['reason'], {'blockCount': 0, 'positiveVapBlockCount': 0, 'profile': empty_profile()})
        category['blockCount'] += 1
        category['positiveVapBlockCount'] += b['sourceProfile'][VAP] > 0
        add_profile(category['profile'], b['sourceProfile'])
        if b['sourceProfile'][VAP] > 0:
            positive.append({**b, 'affectedUnitIds': sorted(ids), 'sameCountyAffectedUnitIds': same,
                             'foreignCountyAffectedUnitIds': foreign, 'unlocalizedInSourceCounty': not same})
    # Independent full trace reconstruction before interpreting its partial labels.
    for u in units:
        i = u['unitId']
        expected = allocated_units[i] if allocated_counts[i] else None
        if expected != u['profile'] or allocated_counts[i] != u['sourceBlockCount']:
            raise ValueError('Candidate allocation drift: ' + i)
        if len(touching[i]) != u['unresolvedTouchingBlockCount']:
            raise ValueError('Candidate touching inventory drift: ' + i)
    county_rows = []
    for county, evidence in sorted(unlocalized.items()):
        positive_blocks = [b for b in evidence if b['sourceProfile'][VAP] > 0]
        if not positive_blocks:
            continue
        profile = empty_profile()
        for b in positive_blocks:
            add_profile(profile, b['sourceProfile'])
        county_units = sorted([u for u in units if u['countyFips'] == county], key=lambda u: u['unitId'])
        county_rows.append({'countyFips': county, 'positiveBlockIds': [b['blockGeoid'] for b in positive_blocks],
                           'unlocalizedProfile': profile, 'unitIdsRequiringCountyContext': [u['unitId'] for u in county_units],
                           'diagnosticStatusCounts': dict(sorted(Counter(u['status'] for u in county_units).items()))})
    return {'sourceProfile': source, 'allocatedProfile': allocated, 'unavailableProfile': unavailable,
            'unavailableReasons': categories, 'positiveUnavailableBlocks': positive,
            'countiesWithUnlocalizedPositiveVap': county_rows}, touching


def completeness_review(units, old_units, local, touching, counties):
    old, names = unique(old_units, 'unitId'), unique(local, 'unitId')
    if set(old) != set(names) or set(old) != {u['unitId'] for u in units}:
        raise ValueError('Review target universe drift')
    exposed = {c['countyFips']: c for c in counties}
    rows = []
    for u in sorted(units, key=lambda u: u['unitId']):
        if u['status'] != 'partial':
            continue
        evidence = touching[u['unitId']]
        positive = [b for b in evidence if b['sourceProfile'][VAP] > 0]
        rows.append({'unitId': u['unitId'], 'countyFips': u['countyFips'], 'name': names[u['unitId']]['name'],
                     'diagnosticStatus': u['status'], 'regressedFromComplete': old[u['unitId']]['status'] == 'complete',
                     'touchingEvidence': 'positive_vap' if positive else 'zero_vap_only',
                     'unresolvedBlockIds': [b['blockGeoid'] for b in evidence],
                     'positiveVapBlockIds': [b['blockGeoid'] for b in positive],
                     'touchingUnresolvedVap': sum(b['sourceProfile'][VAP] for b in positive),
                     'countyHasUnlocalizedPositiveVap': u['countyFips'] in exposed,
                     'allocatedVap': u['profile'][VAP], 'mappedVotes': names[u['unitId']]['mappedVotes'],
                     'statusUpgradeAuthorized': False})
    return rows


def block_vtds(path, blocks):
    expected = {b['blockGeoid'] for b in blocks}
    result = {}
    with path.open(encoding='utf8', newline='') as source:
        for f in csv.reader(source, delimiter='|'):
            if f[2] != '750':
                continue
            geoid = f[9]
            if geoid not in expected or geoid in result or geoid != f[12] + f[14] + f[32] + f[34]:
                raise ValueError('Census block universe drift')
            vtd = f[12] + f[14] + f[77]
            if len(vtd) != 11:
                raise ValueError('Missing Census block VTD')
            result[geoid] = vtd
    if set(result) != expected:
        raise ValueError('Missing Census block geography')
    return result


def flint_review(blocks, vtds, foundation, local):
    foundation_rows = [dict(zip(foundation['precinctFields'], r)) for r in foundation['precinctRows']]
    admitted = unique(foundation_rows, 'geometryId')
    chosen = sorted([r for r in local if r['unitId'].startswith(FLINT)], key=lambda r: r['unitId'])
    groups, totals = defaultdict(list), defaultdict(empty_profile)
    for b in sorted(blocks, key=lambda b: b['blockGeoid']):
        vtd = vtds[b['blockGeoid']]
        add_profile(totals[vtd], b['sourceProfile'])
        if b['disposition'] == 'allocated' and b['unitId'].startswith(FLINT):
            groups[b['unitId'], vtd].append(b)
    rows = []
    for row in chosen:
        sources, profile = [], empty_profile()
        for (unit, vtd), evidence in sorted(groups.items()):
            if unit != row['unitId']:
                continue
            part = empty_profile()
            for b in evidence:
                add_profile(part, b['sourceProfile'])
            add_profile(profile, part)
            sources.append({'censusVtdGeoid': vtd, 'allocatedProfile': part, 'entireSourceVtdProfile': totals[vtd],
                            'blockIds': [b['blockGeoid'] for b in evidence]})
        if profile != row['candidateProfile']:
            raise ValueError('Flint provenance reconstruction drift')
        rows.append({**row, 'admittedCensusVtdGeoid': admitted[row['unitId']]['censusVtdGeoid'], 'sourceVtdContributions': sources,
                     'boundaryValidationPassed': False})
    return {'scope': 'All eight Flint Township precincts; City of Flint is outside this local audit',
            'admittedVap': sum(r['admittedProfile'][VAP] for r in rows),
            'candidateVap': sum(r['candidateProfile'][VAP] for r in rows), 'units': rows,
            'conclusion': 'Source-VTD provenance explains the arithmetic, not the validity of the 2024 boundary or its allocation.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', action='store_true')
    parser.add_argument('--reverse', action='store_true')
    args = parser.parse_args()
    registry = json.loads(REGISTRY.read_text(encoding='utf8'))
    for path, expected in registry['files'].items():
        with (ROOT / path).open('rb') as source:
            if hashlib.file_digest(source, 'sha256').hexdigest() != expected:
                raise ValueError('Source checksum drift: ' + path)
    def read(key):
        return json.loads((ROOT / registry['inputs'][key]).read_text(encoding='utf8'))
    candidate, old, comparison = read('candidate'), read('originalCandidate'), read('comparison')
    blocks = json.loads(gzip.decompress((ROOT / registry['inputs']['trace']).read_bytes()))['blocks']
    if args.reverse:
        blocks.reverse()
        candidate['units'].reverse()
        old['units'].reverse()
        comparison['local'].reverse()
    audit, touching = inventory(blocks, candidate['units'])
    if audit['sourceProfile'] != candidate['sourceProfile'] or audit['unavailableProfile'] != candidate['unavailableProfile']:
        raise ValueError('Statewide accounting drift')
    partials = completeness_review(candidate['units'], old['units'], comparison['local'], touching, audit['countiesWithUnlocalizedPositiveVap'])
    report = {'schemaVersion': 'mi-evidence-quality-review-v1', 'admissionAuthorized': False, 'migrationAuthorized': False,
              'fingerprints': registry['files'], 'sourceBlockCount': len(blocks), **audit,
              'partialUnits': partials, 'regressions': [r for r in partials if r['regressedFromComplete']],
              'flintTownship': flint_review(blocks, block_vtds(ROOT / registry['inputs']['geography'], blocks), read('foundation'), comparison['local']),
              'retentionDecisions': registry['retentionDecisions'],
              'semantics': {
                  'diagnosticComplete': 'Allocated evidence with no recorded unresolved touching blocks or missing source-county geometry; not a guarantee of geographic completeness.',
                  'artifactAvailable': 'Allocated profile availability in the v0.29A contract; not equivalent to diagnostic complete or candidate admission.',
                  'zeroVap': 'All five P4 group counts are zero. This does not establish zero residents, valid boundaries, or an automatic status upgrade.',
                  'countyContext': 'Unlocalized positive blocks require source-county context for every precinct there. No population is assigned to these precincts by this flag.',
                  'touchingExposure': 'Shared exposure is not precinct-owned population. Sum source blocks once, never touching-unit rows.'}}
    positive = report['positiveUnavailableBlocks']
    non_sturgis = [b for b in positive if b['reason'] != 'quarantined_map_geometry']
    regressions = report['regressions']
    lines = ['# v0.29D.3 evidence-quality review', '',
             '**Decision: retain the current PA, MI, and WI demographic foundations for the bounded three-state v1. No candidate migration.**', '',
             'This completes the evidence triage. Michigan replacement admission remains held; this is not a source-boundary resolution or approval for public delivery.', '',
             '## Unique unavailable evidence', '', '| Reason | All blocks | Positive-VAP blocks | Unavailable VAP |', '|---|---:|---:|---:|']
    for reason, r in sorted(audit['unavailableReasons'].items()):
        lines.append(f"| {reason} | {r['blockCount']} | {r['positiveVapBlockCount']} | {r['profile'][VAP]:,} |")
    lines += ['', f"There are {len(positive)} positive-VAP unavailable blocks in total. Outside Sturgis quarantine, {len(non_sturgis)} unique blocks contain {sum(b['sourceProfile'][VAP] for b in non_sturgis):,} VAP. The full six-cell profiles, source county, same-county and foreign touching IDs are retained in the JSON inventory. Touching exposure must not be summed across precincts.", '',
              '## Completeness findings', '',
              f"Of {len(partials)} partial precincts, {sum(r['touchingEvidence'] == 'positive_vap' for r in partials)} touch positive VAP and {sum(r['touchingEvidence'] == 'zero_vap_only' for r in partials)} touch only zero VAP. All retain their original status. Of {len(regressions)} complete-to-partial regressions, {sum(r['touchingEvidence'] == 'positive_vap' for r in regressions)} touches positive VAP: City of Richmond Precinct 2 (2 VAP, county conflict).", '',
              '| Source county | Unlocalized positive blocks | VAP | Precincts needing county context | Existing diagnostic statuses |', '|---|---:|---:|---:|---|']
    for c in audit['countiesWithUnlocalizedPositiveVap']:
        lines.append(f"| {c['countyFips']} | {', '.join(c['positiveBlockIds'])} | {c['unlocalizedProfile'][VAP]} | {len(c['unitIdsRequiringCountyContext'])} | {json.dumps(c['diagnosticStatusCounts'], sort_keys=True)} |")
    lines += ['', 'These blocks touch no compatible same-county target. A precinct can therefore have a diagnostic complete label while its source county contains unlocalized positive evidence. The county flag records uncertainty; it neither identifies an owner nor distributes population. Even absence of this flag is not boundary certification.', '',
              'The v0.29A artifact uses available/unavailable profile status; the Michigan diagnostic uses complete/partial/unavailable. They answer different questions. Keep profile availability, observed touching uncertainty, county localization, topology, and source-vintage admission separate. Zero VAP proves zero in the five P4 age-18+ groups only; it does not prove zero residents. No status is upgraded.', '',
              '## Flint Township provenance', '', '| Precinct | Existing VAP | Candidate VAP | Candidate contributions by 2020 Census VTD |', '|---|---:|---:|---|']
    for r in report['flintTownship']['units']:
        parts = ', '.join(f"{s['censusVtdGeoid']}: {s['allocatedProfile'][VAP]:,}" for s in r['sourceVtdContributions'])
        lines.append(f"| {r['name']} | {r['admittedProfile'][VAP]:,} | {r['candidateProfile'][VAP]:,} | {parts} |")
    lines += ['', f"Township totals change from {report['flintTownship']['admittedVap']:,} to {report['flintTownship']['candidateVap']:,} VAP. Precinct 2 combines 1,900 from VTD 26049049117, 2,528 from 26049049119, and 1,331 from 26049049116. Its existing bridge uses only 26049049117. The JSON records each contributing block, all six counts, and the full source VTD profile. This explains the arithmetic and identifies a limitation in the existing bridge; it does not independently establish the correct 2024 boundary. The earlier resolution review establishes an effective cycle, not spatial certification.", '',
              '## Retention and finite follow-up', '',
              '- Pennsylvania: retain the Census VTD foundation. The Adams pilot matches exactly; statewide replacement quality remains unproven.',
              '- Michigan: retain the existing approximate VTD bridge, including its disclosed weighted splits and unavailable evidence. The candidate is not admitted. Retention does not declare the bridge more accurate.',
              '- Wisconsin: retain the LTSB ward denominator and its existing source/vintage disclosures. No Wisconsin replacement comparison was conducted in this phase.', '',
              'For a future Michigan replacement: resolve Sturgis with effective-cycle source evidence; review the 26 other positive-VAP blocks by source county; address unlocalized county evidence and approve explicit completeness semantics; independently validate material local changes such as Flint; then recompile and compare before admission. These are replacement prerequisites, not a requirement to replace working foundations for v1.', '',
              'Next: v0.29E should package reproducible admission **or retention** checks for the three states, then run integrated model/replay/frontend verification. Deferred human testing and the recorded delivery gates remain separate outstanding release work. The Sturgis clarification draft remains unsent.', '',
              'Machine-readable evidence: [evidence-review.json](evidence-review.json). See [reproduction](REPRODUCE.md), [verification](VERIFICATION.md), and [decision 0062](../../decisions/0062-demographic-completeness-and-retention.md).', '']
    outputs = {'evidence-review.json': encoded(report), 'REVIEW.md': '\n'.join(lines).encode()}
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, contents in outputs.items():
        path = OUTPUT / name
        if args.verify:
            if path.read_bytes() != contents:
                raise ValueError('Output drift: ' + name)
        else:
            path.write_bytes(contents)
        print(('Verified ' if args.verify else 'Wrote ') + name)


if __name__ == '__main__':
    main()
