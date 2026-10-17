import copy
import importlib.util
import sys
import unittest
from pathlib import Path
from shapely.geometry import box, mapping, shape

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
spec=importlib.util.spec_from_file_location('sturgis_review',ROOT/'scripts/review-v029d2-sturgis.py')
module=importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def feature(unit,geom):
    return {'type':'Feature','properties':{'PRECINCTID':unit},'geometry':mapping(geom)}


class SturgisReviewTests(unittest.TestCase):
    def test_sensitivity_removes_only_overlap_without_mutating_baseline(self):
        features=[feature(module.CITY,box(0,0,2,2)),feature(module.TOWNSHIP,box(1,0,3,2))]
        original=copy.deepcopy(features)
        sliver=box(1,0,2,2)
        result=module.exclude_hypothesis(features,module.CITY,sliver)
        self.assertEqual(features,original)
        self.assertEqual(result[1],original[1])
        self.assertTrue(shape(result[0]['geometry']).equals(box(0,0,1,2)))

    def test_hypothesis_cannot_add_area_select_another_unit_or_erase_target(self):
        features=[feature(module.CITY,box(0,0,2,2))]
        for target,sliver in [(module.CITY,box(1,0,3,2)),('another',box(1,0,2,2)),(module.CITY,box(0,0,2,2))]:
            with self.assertRaises(ValueError):
                module.exclude_hypothesis(features,target,sliver)

    def test_missing_or_duplicate_hypothesis_target_fails(self):
        f=feature(module.CITY,box(0,0,2,2))
        for features in [[],[f,f]]:
            with self.assertRaises(ValueError):
                module.exclude_hypothesis(features,module.CITY,box(1,0,2,2))


if __name__=='__main__':
    unittest.main()
