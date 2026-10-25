#!/usr/bin/env python3
"""Regenerate data/map.json, the pre-projected world map used by Discover and Map Quiz.

    sh tools/fetch_map_sources.sh   # downloads the two source files into .cache/
    python3 tools/build_map.py
    python3 tools/build.py

Sources:
    Natural Earth 1:50m admin-0 countries (public domain) for the shapes
    mledoze/countries (ODbL) for each country's centre point

Shapes are projected with Equal Earth to a 1000-unit-wide SVG and thinned to points at
least 0.5 units apart. Far-Pacific islands are drawn a second time past the 180° line so
the Oceania view can show Samoa and Tonga next to Fiji. Only the standard library is used.
"""
import json, math, glob, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, '.cache')
for f in ('ne_50m_admin_0_countries.geojson', 'countries.json'):
    if not os.path.exists(os.path.join(CACHE, f)):
        sys.exit(f'build_map: missing .cache/{f}. Run: sh tools/fetch_map_sources.sh')
rows = []
for f in sorted(glob.glob(os.path.join(ROOT, 'data/countries/en/*.json'))): rows += json.load(open(f, encoding='utf-8'))
codes = {r[0].upper() for r in rows}
ne = json.load(open(os.path.join(CACHE, 'ne_50m_admin_0_countries.geojson'), encoding='utf-8'))
mc = {c['cca2']: c for c in json.load(open(os.path.join(CACHE, 'countries.json'), encoding='utf-8'))}

# Equal Earth projection
A1, A2, A3, A4 = 1.340264, -0.081106, 0.000893, 0.003796
M = math.sqrt(3) / 2
def proj(lon, lat):
    l, p = math.radians(lon), math.radians(lat)
    th = math.asin(M * math.sin(p)); t2 = th * th; t6 = t2 * t2 * t2
    x = l * math.cos(th) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)))
    y = th * (A1 + A2 * t2 + t6 * (A3 + A4 * t2))
    return x, y
X0, _ = proj(-180, 0); X1, _ = proj(180, 0); _, YT = proj(0, 84); _, YB = proj(0, -58)
W = 1000.0; S = W / (X1 - X0); H = (YT - YB) * S
def px(lon, lat):
    x, y = proj(lon, max(-58, min(84, lat)))
    return ((x - X0) * S, (YT - y) * S)

def ring_d(ring, tol, shift=0):
    pts = [px(pt[0] + shift, pt[1]) for pt in ring]
    out = [pts[0]]
    for p in pts[1:]:
        if math.hypot(p[0] - out[-1][0], p[1] - out[-1][1]) >= tol: out.append(p)
    if len(out) < 3: return None, 0
    area = abs(sum(out[i][0] * out[i - 1][1] - out[i - 1][0] * out[i][1] for i in range(len(out)))) / 2
    d = 'M' + 'L'.join(f'{x:.1f},{y:.1f}' for x, y in out) + 'Z'
    return d, area

def geom_rings(g):
    if g['type'] == 'Polygon': return [g['coordinates']]
    return g['coordinates']

paths, other, main_box = {}, [], {}
for f in ne['features']:
    pr = f['properties']
    if pr.get('ADMIN') == 'Antarctica': continue
    code = pr.get('ISO_A2_EH') or pr.get('ISO_A2')
    if code == '-99' or code not in codes: code = None
    parts, best = [], (0, None)
    for poly in geom_rings(f['geometry']):
        for i, ring in enumerate(poly):
            d, area = ring_d(ring, 0.5)
            if not d: continue
            if area < 0.4 and code is None: continue
            parts.append(d)
            if max(pt[0] for pt in ring) < -125:
                dw, _ = ring_d(ring, 0.5, 360)
                if dw: parts.append(dw)
            if i == 0 and area > best[0]:
                xs = [px(*p[:2])[0] for p in ring]; ys = [px(*p[:2])[1] for p in ring]
                best = (area, (min(xs), min(ys), max(xs), max(ys)))
    if code: paths[code] = paths.get(code, '') + ''.join(parts); main_box.setdefault(code, best[1])
    else: other.append(''.join(parts))

pins = {}
for r in rows:
    c = r[0].upper(); info = mc.get(c)
    lat, lon = info['latlng'] if info else (0, 0)
    if r[2] == 'Oceania' and lon < 0: lon += 360
    x, y = px(lon, lat)
    box = main_box.get(c)
    span = max(box[2] - box[0], box[3] - box[1]) if box else 0
    pins[r[0]] = [round(x, 1), round(y, 1), round(span, 1), round(lat, 2), round(lon, 2)]
missing_shape = sorted(c for c in codes if c not in paths)
missing_pin = sorted(r[0] for r in rows if r[0].upper() not in mc)
# Region views as lon/lat boxes, projected by sampling the box edges.
REG = {'Africa': (-20, -36, 55, 38), 'Asia': (25, -12, 150, 56), 'Europe': (-25, 34, 45, 71),
       'North America': (-170, 6, -52, 72), 'South America': (-82, -56, -34, 13), 'Oceania': (110, -48, 192, 22)}
regions = {}
for k, (lo0, la0, lo1, la1) in REG.items():
    pts = [px(lo0 + (lo1 - lo0) * i / 20, la) for i in range(21) for la in (la0, la1)] + \
          [px(lo, la0 + (la1 - la0) * i / 20) for i in range(21) for lo in (lo0, lo1)]
    xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
    regions[k] = [round(min(xs), 1), round(min(ys), 1), round(max(xs) - min(xs), 1), round(max(ys) - min(ys), 1)]
xmax = px(235, 0)[0]
out = {'w': W, 'xmax': round(xmax, 1), 'regions': regions, 'h': round(H, 1), 'paths': {k.lower(): v for k, v in paths.items()}, 'other': ''.join(other), 'pins': pins}
s = json.dumps(out, separators=(',', ':'))
open(os.path.join(ROOT, 'data/map.json'), 'w').write(s)
print('wrote data/map.json: shapes', len(paths), 'size KB', len(s) // 1024, 'no shape:', missing_shape, 'no pin:', missing_pin, 'H', round(H))
