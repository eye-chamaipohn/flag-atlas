#!/usr/bin/env python3
"""Build Flag Atlas into one self-contained HTML file.

    python3 tools/build.py                   # writes index.html
    python3 tools/build.py --check           # fails if index.html is out of date (used by CI)
    python3 tools/build.py --fragment PATH   # also writes the page without <html>/<head>/<body>,
                                             # the form a Claude Artifact expects

Inputs:
    src/index.html          page markup with <!-- @styles --> and <!-- @scripts --> markers
    src/styles/*.css        concatenated in file-name order
    src/js/*.js             concatenated in file-name order (one shared global scope)
    data/countries/en/*.json  rows: [code, name, continent, subregion, capital, [landmarks], [facts]]
    data/countries/<lang>/*.json  {code: [name, capital, [landmarks], [facts]]} for each other language
    data/i18n/languages.json  the language menu; data/i18n/<lang>.json  interface text
    data/flags/<code>.svg   flag images (flag-icons, MIT)
    data/map.json           pre-projected world map (regenerate with tools/build_map.py)

Only the Python standard library is needed.
"""
import argparse, glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOC_HEAD = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n')


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        return f.read()


def load_json(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def fail(msg):
    sys.exit(f'build: {msg}')


def load_countries():
    rows = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'data/countries/en/*.json'))):
        rows += load_json(f)
    codes = [r[0] for r in rows]
    dupes = sorted({c for c in codes if codes.count(c) > 1})
    if dupes:
        fail(f'duplicate country codes: {dupes}')
    for r in rows:
        if len(r) != 7 or not isinstance(r[5], list) or not isinstance(r[6], list):
            fail(f'bad row for {r[0]!r}: expected [code, name, continent, subregion, capital, [landmarks], [facts]]')
    return rows


def load_languages():
    """Interface text and country text for every language in data/i18n/languages.json that has
    files. Each one must pass tools/check_lang.py; a language without files is skipped."""
    sys.path.insert(0, os.path.join(ROOT, 'tools'))
    from check_lang import check
    langs, i18n, text = [], {}, {}
    for meta in load_json(os.path.join(ROOT, 'data/i18n/languages.json')):
        code = meta['code']
        if not os.path.exists(os.path.join(ROOT, 'data/i18n', f'{code}.json')):
            print(f'build: note: no data/i18n/{code}.json yet; {meta["name"]} is left out', file=sys.stderr)
            continue
        errors, _ = check(code)
        if errors:
            fail(f'{code} has {len(errors)} translation problems, first: {errors[0]}. Run: python3 tools/check_lang.py {code}')
        langs.append(meta)
        i18n[code] = load_json(os.path.join(ROOT, 'data/i18n', f'{code}.json'))
        if code != 'en':
            text[code] = {}
            for f in sorted(glob.glob(os.path.join(ROOT, 'data/countries', code, '*.json'))):
                text[code].update(load_json(f))
    if not langs or langs[0]['code'] != 'en':
        fail('English must be first in data/i18n/languages.json')
    return langs, i18n, text


def load_flags(rows):
    flags = {}
    for r in rows:
        path = os.path.join(ROOT, 'data/flags', f'{r[0]}.svg')
        if not os.path.exists(path):
            fail(f'missing flag image data/flags/{r[0]}.svg')
        s = read(os.path.relpath(path, ROOT))
        s = re.sub(r'<!--.*?-->', '', s, flags=re.S)
        flags[r[0]] = re.sub(r'>\s+<', '><', s).strip()
    return flags


def as_js(value):
    # JSON is valid JavaScript; escaping '</' keeps text like '</kbd>' from ever closing the <script>.
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def build():
    rows = load_countries()
    langs, i18n, text = load_languages()
    flags = load_flags(rows)
    world = read('data/map.json')
    shapes = json.loads(world)['paths']
    no_shape = sorted(r[0] for r in rows if r[0] not in shapes)
    if no_shape:
        fail(f'no map shape for {no_shape}; run tools/build_map.py')

    css = ''.join(read(os.path.relpath(f, ROOT)) for f in sorted(glob.glob(os.path.join(ROOT, 'src/styles/*.css'))))
    js = ''.join(read(os.path.relpath(f, ROOT)) for f in sorted(glob.glob(os.path.join(ROOT, 'src/js/*.js'))))
    page = read('src/index.html')
    for marker in ('<!-- @styles -->\n', '<!-- @scripts -->\n'):
        if page.count(marker) != 1:
            fail(f'src/index.html must contain {marker.strip()} exactly once')
    page = page.replace('<!-- @styles -->\n', '<style>\n' + css + '</style>\n')
    page = page.replace('<!-- @scripts -->\n', '<script>\n' + js + '</script>\n')

    data = {
        '/*FLAGS*/': json.dumps(flags, separators=(',', ':')).replace('</', '<\\/'),
        '/*COUNTRIES*/': as_js(rows),
        '/*COUNTRY_TEXT*/': as_js(text),
        '/*I18N*/': as_js(i18n),
        '/*LANGS*/': as_js(langs),
        '/*MAP*/': world,
    }
    for k, v in data.items():
        if page.count(k) != 1:
            fail(f'expected the placeholder {k} exactly once in src/js')
        page = page.replace(k, v)
    fragment = page

    # Full document: <title>, fonts and <style> go in <head>, everything after in <body>.
    i = page.index('</style>') + len('</style>')
    document = DOC_HEAD + page[:i] + '\n</head>\n<body>\n' + page[i:] + '\n</body>\n</html>\n'
    return document, fragment, len(rows), [l['code'] for l in langs]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--check', action='store_true', help='fail if index.html is not up to date')
    ap.add_argument('--fragment', metavar='PATH', help='also write the Artifact form of the page here')
    args = ap.parse_args()
    document, fragment, n, codes = build()
    out = os.path.join(ROOT, 'index.html')
    if args.check:
        current = open(out, encoding='utf-8').read() if os.path.exists(out) else ''
        if current != document:
            fail('index.html is out of date. Run: python3 tools/build.py')
        print(f'index.html is up to date ({n} countries, languages: {" ".join(codes)})')
        return
    with open(out, 'w', encoding='utf-8') as f:
        f.write(document)
    print(f'wrote index.html ({n} countries, languages: {" ".join(codes)}, {len(document.encode()) / 1e6:.2f} MB)')
    if args.fragment:
        with open(args.fragment, 'w', encoding='utf-8') as f:
            f.write(fragment)
        print(f'wrote {args.fragment}')


if __name__ == '__main__':
    main()
