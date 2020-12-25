 #!/bin/sh
screen -m -d bash -c "webhook -hooks hooks.json -verbose >> ./autodeploy.log" >> screen.log