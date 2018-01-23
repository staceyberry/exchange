#!/bin/bash

set -e

manage='python /code/manage.py'
setup='python /code/setup.py'

# let the db intialize
sleep 15
until $manage migrate account --noinput; do
  >&2 echo "db is unavailable - sleeping"
  sleep 5
done
$setup build_sphinx
$manage migrate --noinput
$manage collectstatic --noinput
$manage loaddata default_users
$manage loaddata base_resources
if [[ $DEV == True ]]; then
  $manage importservice http://data-test.boundlessgeo.io/geoserver/wms bcs-hosted-data WMS I
fi
$manage loaddata /code/docker/exchange/docker_oauth_apps.json
$manage rebuild_index
pip freeze
# app integration
plugins=()
# anywhere integration
if [[ -f /code/vendor/exchange-mobile-extension/setup.py ]]; then
   pip install /code/vendor/exchange-mobile-extension
   $manage loaddata /code/docker/exchange/anywhere.json
   plugins=("${plugins[@]}" "geonode_anywhere")
fi
if [[ -f /code/vendor/services/setup.py ]]; then
  pip install /code/vendor/services
  plugins=("${plugins[@]}" "worm")
fi
if [ "$plugins" ]; then
  ADDITIONAL_APPS=$(IFS=,; echo "${plugins[*]}")
fi
echo "Dev is set to $DEV"
supervisord -c /code/docker/exchange/supervisor.conf