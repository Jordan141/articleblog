#!/bin/sh
exec 3>&1 4>&2
trap 'exec 2>&4 1>&3' 0 1 2 3
exec 1>clean-mongodb.out 2>&1
REPO_DIR=$(git rev-parse --show-toplevel)
cd "${REPO_DIR}/"
docker-compose down >&3
docker volume rm articleblog_db-data >&3
./devops/up.sh >&3