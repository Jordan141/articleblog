#!/bin/sh
exec 3>&1 4>&2
trap 'exec 2>&4 1>&3' 0 1 2 3
exec 1>logs/clean-mongodb.out 2>&1
REPO_DIR=$(git rev-parse --show-toplevel)
cd "${REPO_DIR}/"
npm run down >&3
rm -rf ./db >&3
npm run up >&3