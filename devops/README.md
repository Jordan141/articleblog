This is autodeploy script. Whenever the master is getting updated, it's being pushed on the test server automatically.
WARNING:
It doesn't know whether schemas in mongo changed, so if there are any changes that involve modifying current mongo models,
db has to be cleared by hitting server instance on `http://serverIP:9000/hooks/clear-mongodb` with a `GET` request.