#!/bin/sh
exec 3>&1 4>&2
trap 'exec 2>&4 1>&3' 0 1 2 3
exec 1>redeploy.out 2>&1
docker-compose down >&3
git stash save "redeploy stash" >&3
git fetch >&3
git checkout origin/master >&3
docker-compose rm web >&3
docker-compose build web >&3
docker-compose up >&3
