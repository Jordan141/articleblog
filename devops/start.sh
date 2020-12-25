 #!/bin/sh
screen -A -m -d bash -c "webhook -hooks hooks.json -verbose >> ./autodeploy.log"
