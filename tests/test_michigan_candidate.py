import copy
import importlib.util
import json
import sys
import unittest
from pathlib import Path

from shapely.geometry import Polygon, box, mapping

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from lib.michigan_candidate import DiagnosticMap, empty_profile, summarize_records


def feature(unit, geometry, county="001", year=2024):
    return {"type": "Feature", "properties": {"PRECINCTID": unit, "COUNTYFIPS": county, "ELECTIONYE": year}, "geometry": mapping(geometry)}


def block(geoid="260010001001001", count=11):
    profile = empty_profile()
    profile.update(totalVotingAgePopulation=count, non_hispanic_white=count)
    return {"blockGeoid": geoid, "countyFips": geoid[:5], "profile": profile}


class MichiganDiagnosticTests(unittest.TestCase):
    def test_containment_conserves_every_cell(self):
        terrain = DiagnosticMap([feature("A", box(0, 0, 5, 5))])
        record = terrain.allocate(block(), box(1, 1, 2, 2), (1.5, 1.5))
        self.assertEqual(record["method"], "whole_block_containment")
        result = summarize_records(terrain, [record])
        self.assertEqual(result["sourceProfile"], result["modeledProfile"])
        self.assertEqual(result["units"][0]["status"], "complete")

    def test_internal_point_handles_boundary_block_without_area_weighting(self):
        terrain = DiagnosticMap([feature("A", box(0, 0, 2, 3)), feature("B", box(2, 0, 4, 3))])
        record = terrain.allocate(block(), box(1, 1, 3, 2), (2.5, 1.5))
        self.assertEqual((record["unitId"], record["method"]), ("B", "census_internal_point"))
        unavailable = terrain.allocate(block(), box(1, 1, 3, 2), None)
        self.assertEqual(unavailable["reason"], "zero_information_split")

    def test_any_positive_overlap_quarantines_both_units(self):
        terrain = DiagnosticMap([feature("A", box(0, 0, 2, 2)), feature("B", box(2 - 1e-10, 0, 3, 2))])
        self.assertEqual(terrain.audit["quarantinedUnitIds"], ["A", "B"])
        record = terrain.allocate(block(), box(0.1, 0.1, 0.2, 0.2), (0.15, 0.15))
        self.assertEqual(record["reason"], "quarantined_map_geometry")
        self.assertIsNone(record["unitId"])

    def test_self_intersecting_target_is_never_repaired_for_allocation(self):
        terrain = DiagnosticMap([feature("A", Polygon([(0, 0), (3, 3), (0, 3), (3, 0), (0, 0)]))])
        self.assertEqual(len(terrain.audit["invalidUnits"]), 1)
        record = terrain.allocate(block(), box(1, 0.1, 1.5, 0.3), (1.2, 0.2))
        self.assertEqual(record["reason"], "quarantined_map_geometry")

    def test_stale_election_year_is_quarantined(self):
        terrain = DiagnosticMap([feature("A", box(0, 0, 3, 3), year=2023)])
        self.assertEqual(terrain.audit["vintageExceptions"], [{"unitId": "A", "sourceElectionYear": 2023}])
        self.assertEqual(terrain.allocate(block(), box(1, 1, 2, 2), (1.5, 1.5))["reason"], "quarantined_map_geometry")

    def test_shared_boundary_is_not_an_overlap_but_ambiguous_point_is_unavailable(self):
        terrain = DiagnosticMap([feature("A", box(0, 0, 2, 3)), feature("B", box(2, 0, 4, 3))])
        self.assertEqual(terrain.audit["positiveAreaOverlaps"], [])
        record = terrain.allocate(block(), box(1, 1, 3, 2), (2, 1.5))
        self.assertEqual(record["reason"], "ambiguous_map_assignment")

    def test_cross_county_and_out_of_block_points_never_allocate(self):
        terrain = DiagnosticMap([feature("A", box(0, 0, 3, 3), county="003")])
        record = terrain.allocate(block(), box(1, 1, 2, 2), (1.5, 1.5))
        self.assertEqual(record["reason"], "county_boundary_conflict")
        self.assertEqual(terrain.allocate(block(), box(1, 1, 2, 2), (2.5, 2.5))["reason"], "internal_point_outside_source")

    def test_missing_or_invalid_sources_preserve_population_and_mark_incomplete_units(self):
        terrain = DiagnosticMap([feature("A", box(0, 0, 3, 3))])
        direct = terrain.allocate(block(), box(1, 1, 2, 2), (1.5, 1.5))
        missing = terrain.allocate(block("260010001001002", 7), None, None)
        invalid = terrain.allocate(block("260010001001003", 5), Polygon([(0, 0), (2, 2), (0, 2), (2, 0), (0, 0)]), None)
        result = summarize_records(terrain, [direct, missing, invalid])
        self.assertEqual(result["sourceProfile"]["totalVotingAgePopulation"], 23)
        self.assertEqual(result["unavailableProfile"]["totalVotingAgePopulation"], 12)
        self.assertEqual(result["units"][0]["status"], "partial")

    def test_duplicates_invalid_profiles_and_foreign_targets_fail(self):
        with self.assertRaises(ValueError):
            DiagnosticMap([feature("A", box(0, 0, 1, 1)), feature("A", box(2, 0, 3, 1))])
        terrain = DiagnosticMap([feature("A", box(0, 0, 3, 3))])
        bad = block()
        bad["profile"]["totalVotingAgePopulation"] += 1
        with self.assertRaises(ValueError):
            terrain.allocate(bad, box(1, 1, 2, 2), (1.5, 1.5))
        record = terrain.allocate(block(), box(1, 1, 2, 2), (1.5, 1.5))
        with self.assertRaises(ValueError):
            summarize_records(terrain, [record, record])

    def test_input_order_does_not_change_spatial_assignments(self):
        features = [feature("A", box(0, 0, 2, 3)), feature("B", box(2, 0, 4, 3))]
        first, second = DiagnosticMap(features), DiagnosticMap(list(reversed(features)))
        self.assertEqual(first.audit, second.audit)
        self.assertEqual(first.allocate(block(), box(1, 1, 3, 2), (2.5, 1.5)), second.allocate(block(), box(1, 1, 3, 2), (2.5, 1.5)))

    def test_actual_comparison_rejects_election_and_off_map_tampering(self):
        spec = importlib.util.spec_from_file_location("mi_build", ROOT / "scripts/compile-v029d-michigan-candidate.py")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        read = lambda path: json.loads((ROOT / path).read_text(encoding="utf8"))
        candidate = read("docs/review/v0.29d-michigan-comparison/candidate.json")
        foundation = read("public/data/mi/2020/precinct-demographics.json")
        crosswalk = read("data-sources/michigan/2024-precinct-crosswalk.json")
        results = read("public/data/mi/2024/reporting-units.json")
        expected = module.compare(candidate, foundation, crosswalk, results)
        changed = copy.deepcopy(results)
        linked_id = crosswalk["matchedGeometry"][0]["reportingUnits"][0]["reportingUnitId"]
        next(u for u in changed["reportingUnits"] if u["id"] == linked_id)["harrisVotes"] += 1
        with self.assertRaisesRegex(ValueError, "votes drift"):
            module.compare(candidate, foundation, crosswalk, changed)
        changed = copy.deepcopy(results)
        residual_id = foundation["residualUnits"][0]["id"]
        next(u for u in changed["reportingUnits"] if u["id"] == residual_id)["trumpVotes"] += 1
        with self.assertRaisesRegex(ValueError, "Off-map candidate totals drift"):
            module.compare(candidate, foundation, crosswalk, changed)
        results["reportingUnits"].reverse()
        crosswalk["matchedGeometry"].reverse()
        foundation["precinctRows"].reverse()
        self.assertEqual(module.compare(candidate, foundation, crosswalk, results), expected)


if __name__ == "__main__":
    unittest.main(verbosity=2)
