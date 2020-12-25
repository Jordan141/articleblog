 #!/bin/sh
docker-compose down
git stash save "redeploy stash"
git fetch
git checkout origin/master
docker-compose rm web
docker-compose build web
docker-compose up
