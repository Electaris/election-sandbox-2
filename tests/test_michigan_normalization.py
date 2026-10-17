import copy
import hashlib
import json
import sys
import unittest
from pathlib import Path

from shapely.geometry import Polygon, box, mapping, shape

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from lib.michigan_candidate import DiagnosticMap
from lib.michigan_normalization import FLINT, GRID, normalize_map, validate_flint_resolution, verify_source_attributes

META = {"sourceSpatialReference": {"latestWkid": 3078, "xyTolerance": 0.001, "xyUnits": 10000}}


def feature(unit, geometry):
    return {"type": "Feature", "properties": {"PRECINCTID": unit, "COUNTYFIPS": "001", "ELECTIONYE": 2024}, "geometry": mapping(geometry)}


class MichiganNormalizationTests(unittest.TestCase):
    def test_self_touch_is_normalized_without_changing_polygon_area(self):
        original = Polygon([(0, 0), (4, 0), (4, 4), (2, 4), (2, 2), (2, 4), (0, 4), (0, 0)])
        self.assertFalse(original.is_valid)
        result, audit = normalize_map([feature("A", original)], META)
        self.assertEqual(audit["invalidSourcesNormalized"], 1)
        self.assertTrue(shape(result[0]["geometry"]).equals(box(0, 0, 4, 4)))
        self.assertEqual(result[0]["properties"], feature("A", original)["properties"])

    def test_material_repair_and_collapsed_targets_fail_closed(self):
        bowtie = Polygon([(0, 0), (2, 2), (0, 2), (2, 0), (0, 0)])
        for geom in [bowtie, box(0, 0, 0.00001, 1)]:
            with self.assertRaises(ValueError):
                normalize_map([feature("A", geom)], META)

    def test_ambiguous_tolerance_strip_is_excluded_from_both(self):
        features = [feature("A", box(0, 0, 1, 1)), feature("B", box(0.9995, 0, 2, 1))]
        result, audit = normalize_map(features, META)
        a, b = [shape(f["geometry"]) for f in result]
        shared = box(0.9995, 0, 1, 1)
        self.assertAlmostEqual(a.intersection(shared).area, 0)
        self.assertAlmostEqual(b.intersection(shared).area, 0)
        self.assertEqual(audit["boundedOverlapsExcluded"], 1)
        self.assertEqual(audit["unresolvedOverlaps"], 0)
        self.assertFalse(DiagnosticMap(result, precision_grid=GRID).quarantine)
        self.assertEqual((result, audit), normalize_map(list(reversed(features)), META))

    def test_substantive_overlap_stays_and_quarantines_both_targets(self):
        result, audit = normalize_map([feature("A", box(0, 0, 1, 1)), feature("B", box(0.99, 0, 2, 1))], META)
        self.assertEqual(audit["boundedOverlapsExcluded"], 0)
        self.assertEqual(audit["unresolvedOverlaps"], 1)
        self.assertEqual(DiagnosticMap(result, precision_grid=GRID).audit["quarantinedUnitIds"], ["A", "B"])

    def test_source_precision_and_identity_drift_fail(self):
        a = feature("A", box(0, 0, 1, 1))
        for field, value in [("latestWkid", 4326), ("xyTolerance", 0.01), ("xyUnits", 1000)]:
            changed = copy.deepcopy(META)
            changed["sourceSpatialReference"][field] = value
            with self.assertRaises(ValueError):
                normalize_map([a], changed)
        with self.assertRaises(ValueError):
            normalize_map([a, a], META)

    def test_native_attributes_allow_only_documented_field_aliases(self):
        old = feature("A", box(0, 0, 1, 1))
        old["properties"]["ShapeSTArea"] = 1
        native = copy.deepcopy(old)
        native["properties"]["Shape.STArea()"] = native["properties"].pop("ShapeSTArea")
        verify_source_attributes([native], [old])
        native["properties"]["ELECTIONYE"] = 2023
        with self.assertRaises(ValueError):
            verify_source_attributes([native], [old])
        with self.assertRaises(ValueError):
            verify_source_attributes([native, native], [old])

    def test_flint_review_is_bound_to_exact_source_properties(self):
        f = feature(FLINT, box(0, 0, 1, 1))
        f["properties"].update(ELECTIONYE=2023, COUNTYFIPS="049", MCDFIPS="29020", PRECINCT="002")
        policy = {"unitId": FLINT, "effectiveElectionYear": 2024,
                  "sourcePropertiesSha256": hashlib.sha256(json.dumps(f["properties"], sort_keys=True, separators=(",", ":")).encode()).hexdigest()}
        override = validate_flint_resolution([f], policy)
        terrain = DiagnosticMap([f], vintage_overrides=override)
        self.assertEqual(terrain.audit["vintageExceptions"], [])
        self.assertEqual(f["properties"]["ELECTIONYE"], 2023)
        f["properties"]["PRECINCT"] = "003"
        with self.assertRaises(ValueError):
            validate_flint_resolution([f], policy)
        with self.assertRaises(ValueError):
            DiagnosticMap([f], vintage_overrides={"unknown": 2024})


if __name__ == "__main__":
    unittest.main()
