#!/bin/sh
exec 3>&1 4>&2
trap 'exec 2>&4 1>&3' 0 1 2 3
exec 1>clean-mongodb.out 2>&1
docker-compose down >&3
rm -rf ./db >&3
docker-compose up >&3