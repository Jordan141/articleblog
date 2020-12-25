 #!/bin/sh
screen -m bash -c "webhook -hooks hooks.json -verbose >> ./autodeploy.log" >> screen.log