#!/bin/sh

DB_HOST=localhost
DB_USER=reader
DN_NAME=reader

CW_ACCESS=YOUR_CLOUDWATCh_ACCESS_KEY
CW_SECRET=YOUR_CLOUDWATCh_ACCESS_SECRET
CW_REGION="us-west-2"

DATFMT=$(date +'%Y-%m-%dT%H:%M:%S.000%z')
NB=$(echo "select count(1) from article where (now() - fetch_date) < interval '1 hour' " | psql -h $DB_HOST -U $DB_USER  -A -t  $DB_NAME)

/opt/aws/bin/mon-put-data --metric-name NbFetch1H --namespace Izmet --value $NB --timestamp $DATFMT -u Count -I $CW_ACCESS -S $CW_SECRET --region $CW_REGION


