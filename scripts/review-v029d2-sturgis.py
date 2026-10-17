"""Source comparison and two explicitly unapproved topology sensitivities; no migration."""
import argparse
import copy
import csv
import gzip
import hashlib
import importlib.util
import io
import json
import os
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
os.environ.setdefault('MPLCONFIGDIR',str(ROOT/'work/v029d2/matplotlib-cache'))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import shapely
from osgeo import ogr
from pyproj import Transformer
from shapely.geometry import Point, box, mapping, shape

from lib.michigan_candidate import DiagnosticMap, FIELDS, summarize_records
from lib.michigan_normalization import GRID, normalize_map, polygon_parts, validate_flint_resolution, verify_source_attributes

BASE = ROOT / 'docs/review/v0.29d1-michigan-normalization'
OUTPUT = ROOT / 'docs/review/v0.29d2-sturgis-source-review'
CITY, TOWNSHIP = 'WP-149-76960-00002', 'WP-149-76980-00001'


def read(path):
    return json.loads((ROOT / path).read_text(encoding='utf8'))


def encoded(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False, allow_nan=False) + '\n').encode()


def polygonal(geometry):
    return shapely.union_all(polygon_parts(shapely.make_valid(geometry)))


def exclude_hypothesis(features, loser, sliver):
    """Subtract only the disputed polygon; this is a sensitivity, not a correction policy."""
    if loser not in (CITY, TOWNSHIP) or sliver.is_empty or not sliver.is_valid or sliver.area <= 0:
        raise ValueError('Invalid sensitivity hypothesis')
    result = copy.deepcopy(features)
    chosen = [f for f in result if f['properties']['PRECINCTID'] == loser]
    if len(chosen) != 1:
        raise ValueError('Hypothesis target missing or duplicated')
    geom = shapely.set_precision(shape(chosen[0]['geometry']), GRID)
    if sliver.difference(geom).area > 0:
        raise ValueError('Hypothesis removes geography outside the target')
    corrected = geom.difference(sliver)
    if corrected.is_empty or not corrected.is_valid or corrected.difference(geom).area > 0:
        raise ValueError('Invalid hypothetical subtraction')
    chosen[0]['geometry'] = mapping(corrected)
    return result


def source_comparison(sliver):
    window = box(*sliver.buffer(2).bounds)
    registry = read('data-sources/michigan/v029d2-sturgis-review-sources.json')
    native = [f for p in registry['nativePages'] for f in read(p)['features'] if f['properties']['PRECINCTID'] in (CITY, TOWNSHIP)]
    sources = {f"state_2024_{'city' if f['properties']['PRECINCTID'] == CITY else 'township'}": polygonal(shape(f['geometry'])) for f in native}
    sources.update({f"state_2022_{'city' if f['properties']['PRECINCTID'] == CITY else 'township'}": polygonal(shape(f['geometry'])) for f in read('work/v029d2/state-2022-sturgis.geojson')['features']})
    for key, path, predicate in [
        ('city_published_precinct_2', 'work/v029d2/city-precincts.geojson', lambda f: f['properties']['PREC_NO'] == 2),
        ('city_published_limits', 'work/v029d2/city-limits.geojson', lambda f: True),
    ]:
        sources[key] = shapely.union_all([polygonal(shape(f['geometry'])) for f in read(path)['features'] if predicate(f)])
    comparison = []
    features = [{'type':'Feature', 'properties':{'source':'state_2024_overlap', 'status':'unresolved'}, 'geometry':mapping(sliver)}]
    for key, geom in sorted(sources.items()):
        comparison.append({'source':key, 'overlapCoveredAreaM2':geom.intersection(sliver).area,
            'minimumBoundaryDistanceM':geom.boundary.distance(sliver),
            'vertexBoundaryDistancesM':[geom.boundary.distance(Point(p)) for p in list(sliver.exterior.coords)[:-1]]})
        features.append({'type':'Feature', 'properties':{'source':key}, 'geometry':mapping(geom.boundary.intersection(window))})
    transform = Transformer.from_crs(3078, 4326, always_xy=True)
    vertices = list(sliver.exterior.coords)[:-1]
    max_length = max(np.linalg.norm(np.array(a)-np.array(b)) for a in vertices for b in vertices)
    return {'areaM2':sliver.area, 'longestEdgeM':max_length, 'maximumAltitudeM':2*sliver.area/max_length,
            'verticesEPSG3078':vertices, 'approximateVerticesLonLat':[transform.transform(*p) for p in vertices],
            'approximateCentroidLonLat':transform.transform(sliver.centroid.x,sliver.centroid.y),
            'sources':comparison}, {'type':'FeatureCollection','crs':{'type':'name','properties':{'name':'EPSG:3078'}},'features':features}


def draw_comparison(geojson):
    matplotlib.rcParams['svg.hashsalt'] = 'mi-sturgis-source-review-v1'
    sliver = shape(geojson['features'][0]['geometry'])
    points = sorted(list(sliver.exterior.coords)[:-1])
    origin, end = np.array(points[0]), np.array(points[-1])
    direction = (end-origin)/np.linalg.norm(end-origin)
    normal = np.array([-direction[1],direction[0]])
    def xy(coords):
        q = np.array(coords)-origin
        return q @ direction, q @ normal
    fig, axes = plt.subplots(2,1,figsize=(11,7),layout='constrained')
    colors = {'state_2024_city':'#ae431e','state_2024_township':'#1e6f99','state_2022_city':'#547637',
              'city_published_precinct_2':'#633f9a','city_published_limits':'#c08c18'}
    labels = {'state_2024_city':'2024 state: city','state_2024_township':'2024 state: township',
              'state_2022_city':'2022 state: city','city_published_precinct_2':'City GIS: precinct 2','city_published_limits':'City GIS: limits'}
    def lines(g):
        if g.geom_type == 'LineString':
            return [g]
        return [p for child in getattr(g,'geoms',[]) for p in lines(child)]
    for ax in axes:
        x,y = xy(sliver.exterior.coords)
        ax.fill(x,y,color='#d35231',alpha=.25,label='Unresolved overlap')
        for f in geojson['features'][1:]:
            key=f['properties']['source']
            if key not in colors:
                continue
            for i,line in enumerate(lines(shape(f['geometry']))):
                x,y=xy(line.coords)
                ax.plot(x,y,color=colors[key],linewidth=1.7,label=labels[key] if i==0 else None,
                        linestyle='--' if key.startswith('city_published') else '-')
        ax.set_xlim(-1,134)
        ax.grid(alpha=.2)
        ax.set_xlabel('Distance along the disputed segment (metres)')
        ax.set_ylabel('Offset from straight edge (metres)')
    axes[0].set_ylim(-.006,.032)
    axes[0].set_title('2024 state overlap: 1.23 m²; maximum width 1.87 cm')
    axes[0].legend(loc='upper left',fontsize=8,ncol=3)
    axes[1].set_ylim(-1.5,.10)
    axes[1].set_title('City GIS and state exports disagree by more than the overlap width')
    fig.suptitle('Sturgis boundary source comparison — vertical scale exaggerated',fontsize=14)
    png,svg=io.BytesIO(),io.BytesIO()
    fig.savefig(png,format='png',dpi=140)
    fig.savefig(svg,format='svg',metadata={'Date':None})
    plt.close(fig)
    return png.getvalue(),svg.getvalue()


def partial_review(candidate, records):
    baseline = read('docs/review/v0.29d1-michigan-normalization/comparison.json')
    old = {u['unitId']:u for u in read('docs/review/v0.29d-michigan-comparison/candidate.json')['units']}
    local = {u['unitId']:u for u in baseline['local']}
    touching = {}
    for b in records:
        if b['disposition'] == 'unavailable':
            for unit_id in b['affectedUnitIds']:
                touching.setdefault(unit_id,[]).append(b)
    rows=[]
    for u in candidate['units']:
        if u['status'] != 'partial':
            continue
        blocks=touching.get(u['unitId'],[])
        rows.append({'unitId':u['unitId'],'name':local[u['unitId']]['name'], 'countyFips':u['countyFips'],
            'regressedFromComplete':old[u['unitId']]['status']=='complete',
            'unresolvedBlockCount':len(blocks), 'positiveVapUnresolvedBlockCount':sum(b['sourceProfile'][FIELDS[0]]>0 for b in blocks),
            'touchingUnresolvedVap':sum(b['sourceProfile'][FIELDS[0]] for b in blocks),
            'reasons':dict(sorted(Counter(b['reason'] for b in blocks).items())),
            'allocatedVap':u['profile'][FIELDS[0]], 'admittedVap':(local[u['unitId']]['admittedProfile'] or {}).get(FIELDS[0]),
            'mappedVotes':local[u['unitId']]['mappedVotes']})
    rows.sort(key=lambda r:(-r['touchingUnresolvedVap'],-r['mappedVotes'],r['unitId']))
    return {'schemaVersion':'mi-partial-evidence-review-v1', 'partialUnitCount':len(rows),
            'partialUnitsTouchingPositiveVap':sum(r['positiveVapUnresolvedBlockCount']>0 for r in rows),
            'partialUnitsTouchingOnlyZeroVap':sum(r['positiveVapUnresolvedBlockCount']==0 for r in rows),
            'regressedUnitCount':sum(r['regressedFromComplete'] for r in rows),
            'limitation':'Touching VAP is exposure to unresolved blocks, not population owned by each precinct; shared blocks must not be summed across rows. Zero-VAP blocks do not authorize an automatic status upgrade.',
            'units':rows}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify',action='store_true')
    parser.add_argument('--reverse',action='store_true')
    args=parser.parse_args()
    registry=read('data-sources/michigan/v029d2-sturgis-review-sources.json')
    for path,expected in registry['files'].items():
        with (ROOT/path).open('rb') as f:
            if hashlib.file_digest(f,'sha256').hexdigest()!=expected:
                raise ValueError('Source checksum drift: '+path)
    print('All source and baseline hashes verified.',flush=True)
    baseline=read(BASE/'candidate.json')
    records=json.loads(gzip.decompress((BASE/'block-trace.json.gz').read_bytes()))['blocks']
    audit=read(BASE/'normalization-audit.json')
    sliver=shapely.set_precision(polygonal(shape(next(o['geometry'] for o in audit['overlaps'] if not o['withinBothBoundaryTolerances']))),GRID)
    comparison,geojson=source_comparison(sliver)
    native=[f for p in registry['nativePages'] for f in read(p)['features']]
    verify_source_attributes(native,read('work/mi-2024-source/mi-2024-precincts.geojson')['features'])
    normalized,reproduced=normalize_map(list(reversed(native)) if args.reverse else native,read(registry['layerMetadata']))
    if encoded(reproduced)!=(BASE/'normalization-audit.json').read_bytes():
        raise ValueError('Normalization audit drift')
    overrides=validate_flint_resolution(native,registry['flintEffectiveCycleReview'])
    affected={b['blockGeoid']:b for b in records if b['reason']=='quarantined_map_geometry'}
    if len(affected)!=202 or set(baseline['mapAudit']['quarantinedUnitIds'])!={CITY,TOWNSHIP}:
        raise ValueError('Unreviewed quarantine inventory')
    points={}
    with (ROOT/'work/mi-2024-source/pl94/migeo2020.pl').open(encoding='utf8',newline='') as source:
        for f in csv.reader(source,delimiter='|'):
            if f[2]=='750' and f[9] in affected:
                if f[9] in points:
                    raise ValueError('Duplicate internal point')
                points[f[9]]=(float(f[93]),float(f[92]))
    if set(points)!=set(affected):
        raise ValueError('Missing sensitivity source points')
    transformer=Transformer.from_crs(4269,3078,always_xy=True)
    transformer.transform(-85,43)
    if transformer.get_last_used_operation().to_proj4()!=registry['blockProjectionPipeline']:
        raise ValueError('Projection pipeline drift')
    ogr.UseExceptions()
    dataset=ogr.Open(str(ROOT/'work/v029d/blocks/tl_2020_26_tabblock20.shp'))
    geometries={}
    for f in dataset.GetLayer(0):
        key=f.GetField('GEOID20')
        if key in affected:
            geometries[key]=shapely.transform(shapely.from_wkb(bytes(f.GetGeometryRef().ExportToWkb())),transformer.transform,interleaved=False)
    if set(geometries)!=set(affected):
        raise ValueError('Missing sensitivity block geometries')
    spec=importlib.util.spec_from_file_location('mi_comparison',ROOT/'scripts/compile-v029d-michigan-candidate.py')
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    hypotheses=[]
    for winner,loser in [(CITY,TOWNSHIP),(TOWNSHIP,CITY)]:
        terrain=DiagnosticMap(exclude_hypothesis(normalized,loser,sliver),precision_grid=GRID,vintage_overrides=overrides)
        if terrain.quarantine:
            raise ValueError('Hypothetical map still fails topology')
        replacements={}
        for key in sorted(affected,reverse=args.reverse):
            b=affected[key]
            replacements[key]=terrain.allocate({'blockGeoid':key,'countyFips':b['countyFips'],'profile':b['sourceProfile']},geometries[key],transformer.transform(*points[key]))
        updated=[replacements.get(b['blockGeoid'],b) for b in records]
        candidate=summarize_records(terrain,updated)
        report=module.compare(candidate,read('public/data/mi/2020/precinct-demographics.json'),read('data-sources/michigan/2024-precinct-crosswalk.json'),read('public/data/mi/2024/reporting-units.json'))
        previous={u['unitId']:u for u in baseline['units']}
        hypotheses.append({'hypotheticalOwner':winner, 'subtractedFrom':loser,'approvedCorrection':False,
            'admissionAuthorized':False,'remainingOverlapCount':len(terrain.audit['positiveAreaOverlaps']),
            'allocatedBlockCount':candidate['allocatedBlockCount'],'unavailableBlockCount':candidate['unavailableBlockCount'],
            'allocatedProfile':candidate['modeledProfile'],'unavailableProfile':candidate['unavailableProfile'],
            'statusCounts':report['candidateStatusCounts'],'composition':report['composition'],
            'offMapVotes':report['offMapVotes'],'offMapUnitCount':report['offMapUnitCount'],'mappedVotes':report['mappedVotes'],
            'changedUnits':[u for u in candidate['units'] if u!=previous[u['unitId']]],
            'reallocatedBlocks':[replacements[k] for k in sorted(replacements)]})
        print('Completed hypothetical owner '+winner+': '+str(report['candidateStatusCounts']),flush=True)
    sensitivity={'schemaVersion':'mi-unapproved-boundary-sensitivity-v1','baselineArtifactId':baseline['artifactId'],
        'admissionAuthorized':False,'sourceCorrectionApplied':False,'migrationAuthorized':False,
        'scope':'Only the 202 blocks quarantined by the pair are reallocated. Removing overlap area cannot create new intersections elsewhere. No baseline or production file is rewritten.',
        'identicalBlockAssignmentsUnderEitherOwner':hypotheses[0]['reallocatedBlocks']==hypotheses[1]['reallocatedBlocks'],
        'hypotheses':hypotheses}
    source={'schemaVersion':'mi-sturgis-source-review-v1','verdict':'unresolved_source_disagreement',
        'correctionApplied':False,'migrationAuthorized':False,'geometryComparison':comparison,
        'sourceEditMetadata':{key:read(path).get('editingInfo') for key,path in [('cityPrecincts','work/v029d2/city-precinct-layer.json'),('cityLimits','work/v029d2/city-limits-layer.json')]},
        'limitation':'City web-map coordinates use a different datum/export path and have no documented centimetre accuracy; edit timestamps do not certify 2024 legal validity. Conflicting published sources do not establish ownership of the sliver.',
        'sources':registry['files']}
    png,svg=draw_comparison(geojson)
    outputs={'source-review.json':encoded(source),'source-comparison.geojson':encoded(geojson),
        'hypothetical-comparison.json':encoded(sensitivity),'partial-evidence-review.json':encoded(partial_review(baseline,records)),
        'boundary-comparison.png':png,'boundary-comparison.svg':svg}
    if not args.verify:
        OUTPUT.mkdir(parents=True,exist_ok=True)
    for name,data in outputs.items():
        if args.verify:
            if (OUTPUT/name).read_bytes()!=data:
                raise ValueError('Reproduction differs: '+name)
        else:
            (OUTPUT/name).write_bytes(data)
    print(json.dumps({'verified':args.verify,'sameAssignments':sensitivity['identicalBlockAssignmentsUnderEitherOwner'],
        'partialReview':{k:v for k,v in partial_review(baseline,records).items() if k not in ('units','limitation')},
        'fingerprints':{k:hashlib.sha256(v).hexdigest() for k,v in outputs.items()}},indent=2),flush=True)


if __name__=='__main__':
    main()
