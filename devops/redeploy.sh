#!/bin/sh
exec 3>&1 4>&2
trap 'exec 2>&4 1>&3' 0 1 2 3
exec 1>redeploy.out 2>&1
docker-compose down
git stash save "redeploy stash"
git fetch
git checkout origin/master
docker-compose rm web
docker-compose build web
docker-compose up
