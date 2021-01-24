const { execFile, exec } = require("child_process")
const { promisify } = require('util')
var http = require('http')
const execFilePromisified = promisify(execFile)
const execPromisified = promisify(exec)
const path = require('path')
describe('Application', () => {
  afterEach(async () => {
    const CLEANUP_COMMAND = 'docker-compose down'
    return await execPromisified(CLEANUP_COMMAND, { shell: true })
  })
  it('comes online within 2 minutes after running devops deployment script', async () => {
    // given
    const DEVOPS_START_SCRIPT_PATH = path.resolve(__dirname + '/../../devops/up.sh')
    const HEALTH_URL = 'localhost:8000/health'

    // when
    execFilePromisified(DEVOPS_START_SCRIPT_PATH, { shell: true })

    // then
    let interval
    return new Promise((resolve) => {
      interval = setInterval(() => {
        const PROBING_HEALTH_ENDPOINT_COMMAND = `curl ${HEALTH_URL}`
        execPromisified(PROBING_HEALTH_ENDPOINT_COMMAND)
          .then(() => resolve())
          .catch(() => {})
      }, 1000)
    }).then(() => {
      clearInterval(interval)
    })
  }, 120000)
})