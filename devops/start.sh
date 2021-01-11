 #!/bin/sh
screen -m -d bash -c "webhook -hooks hooks.json -verbose >> ./logs/autodeploy.log" >> logs/screen.log