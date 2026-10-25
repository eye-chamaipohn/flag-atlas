#!/usr/bin/env python3
"""Check a language's translation files against English.

    python3 tools/check_lang.py es        # check one language, strictly
    python3 tools/check_lang.py --all     # check every language in data/i18n/languages.json

It checks data/i18n/<lang>.json (interface text) and data/countries/<lang>/*.json (country
text). A file passes when it has every key English has, keeps the same {0}/{1} placeholders and
the same <kbd>/<strong> tags in each text, has an "other" form in every plural, and has an
entry for all countries with as many landmarks and facts as English.
"""
import collections, glob, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLURAL_FORMS = {'zero', 'one', 'two', 'few', 'many', 'other'}


def load(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def english_rows():
    rows = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'data/countries/en/*.json'))):
        rows += load(f)
    return rows


def placeholders(s):
    return sorted(set(re.findall(r'\{\d\}', s)))


def tags(s):
    return collections.Counter(re.findall(r'</?(?:kbd|strong)>', s))


def compare_text(key, en, other, errors):
    if placeholders(en) != placeholders(other):
        errors.append(f'{key}: placeholders {placeholders(other)} should be {placeholders(en)}')
    if tags(en) != tags(other):
        errors.append(f'{key}: tags {dict(tags(other))} should be {dict(tags(en))}')


def check_ui(code, errors, warnings):
    path = os.path.join(ROOT, 'data/i18n', f'{code}.json')
    if not os.path.exists(path):
        errors.append(f'missing data/i18n/{code}.json')
        return
    en, ui = load(os.path.join(ROOT, 'data/i18n/en.json')), load(path)
    subregions = sorted({r[3] for r in english_rows()})
    for key in sorted(set(ui) - set(en)):
        errors.append(f'{key}: not an English key (typo?)')
    for key, ev in en.items():
        if key not in ui:
            errors.append(f'{key}: missing')
            continue
        v = ui[key]
        if isinstance(ev, str):
            if not isinstance(v, str):
                errors.append(f'{key}: should be text')
            else:
                compare_text(key, ev, v, errors)
        elif isinstance(ev, list):
            if not isinstance(v, list) or len(v) != len(ev):
                errors.append(f'{key}: should be a list of {len(ev)} texts')
            else:
                for i, (a, b) in enumerate(zip(ev, v)):
                    compare_text(f'{key}[{i}]', a, b, errors)
        elif 'other' in ev:  # plural forms
            if not isinstance(v, dict) or 'other' not in v:
                errors.append(f'{key}: should be plural forms with at least "other"')
            else:
                for form, text in v.items():
                    if form not in PLURAL_FORMS:
                        errors.append(f'{key}: "{form}" is not a CLDR plural form {sorted(PLURAL_FORMS)}')
                    elif form in ('zero', 'one', 'two'):
                        # Languages often say these without the number ("one flag", Arabic dual),
                        # so the placeholder may be dropped, but no new one may appear.
                        if not set(placeholders(text)) <= set(placeholders(ev['other'])):
                            errors.append(f'{key}.{form}: placeholders {placeholders(text)} not in {placeholders(ev["other"])}')
                        if tags(text) != tags(ev['other']):
                            errors.append(f'{key}.{form}: tags {dict(tags(text))} should be {dict(tags(ev["other"]))}')
                    else:
                        compare_text(f'{key}.{form}', ev['other'], text, errors)
        elif key == 'sub':  # English shows its own subregion names, so en.sub is empty
            if not isinstance(v, dict):
                errors.append('sub: should map English subregion names to translations')
            else:
                for k in sorted(set(v) - set(subregions)):
                    errors.append(f'sub: "{k}" is not a subregion used in the data')
                missing = [s for s in subregions if s not in v]
                if missing and code != 'en':
                    errors.append(f'sub: missing {missing}')
        else:  # e.g. cont: fixed keys
            if not isinstance(v, dict) or sorted(v) != sorted(ev):
                errors.append(f'{key}: should have exactly the keys {sorted(ev)}')


def check_countries(code, errors, warnings):
    folder = os.path.join(ROOT, 'data/countries', code)
    files = sorted(glob.glob(os.path.join(folder, '*.json')))
    if not files:
        errors.append(f'missing data/countries/{code}/*.json')
        return
    src = {r[0]: r for r in english_rows()}
    text = {}
    for f in files:
        for c, v in load(f).items():
            if c in text:
                errors.append(f'{c}: appears twice')
            text[c] = v
    for c in sorted(set(text) - set(src)):
        errors.append(f'{c}: not a country code in data/countries/en')
    for c in sorted(set(src) - set(text)):
        errors.append(f'{c}: missing country')
    for c, v in text.items():
        if c not in src:
            continue
        r = src[c]
        ok = (isinstance(v, list) and len(v) == 4 and all(isinstance(x, str) and x.strip() for x in v[:2])
              and isinstance(v[2], list) and isinstance(v[3], list)
              and len(v[2]) == len(r[5]) and len(v[3]) == len(r[6])
              and all(isinstance(x, str) and x.strip() for x in v[2] + v[3]))
        if not ok:
            errors.append(f'{c}: must be [name, capital, [{len(r[5])} landmarks], [{len(r[6])} facts]] with no empty text')


def check(code):
    errors, warnings = [], []
    check_ui(code, errors, warnings)
    if code != 'en':
        check_countries(code, errors, warnings)
    return errors, warnings


def main():
    args = sys.argv[1:]
    if not args:
        sys.exit(__doc__)
    codes = [l['code'] for l in load(os.path.join(ROOT, 'data/i18n/languages.json'))] if args == ['--all'] else args
    failed = False
    for code in codes:
        if args == ['--all'] and not os.path.exists(os.path.join(ROOT, 'data/i18n', f'{code}.json')):
            print(f'{code}: not started (no data/i18n/{code}.json); the build leaves it out')
            continue
        errors, warnings = check(code)
        for w in warnings:
            print(f'{code}: warning: {w}')
        for e in errors:
            print(f'{code}: {e}')
        print(f'{code}: {"FAIL" if errors else "ok"} ({len(errors)} problems)')
        failed |= bool(errors)
    sys.exit(1 if failed else 0)


if __name__ == '__main__':
    main()
