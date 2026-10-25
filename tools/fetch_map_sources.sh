#!/bin/sh
# Download the source data for tools/build_map.py into .cache/ (not committed).
set -e
cd "$(dirname "$0")/.."
mkdir -p .cache
curl -fsSL -o .cache/ne_50m_admin_0_countries.geojson \
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
curl -fsSL -o .cache/countries.json \
  https://raw.githubusercontent.com/mledoze/countries/master/countries.json
echo "Downloaded map sources to .cache/"
