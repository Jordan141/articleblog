#!/bin/sh
REPO_DIR=$(git rev-parse --show-toplevel)
cd "${REPO_DIR}/"
COMMIT_HASH=$(git rev-list -1 HEAD) docker-compose up --build