const childProcess = require('child_process')
const GIT_COMMIT_HASH = 'GIT_COMMIT_HASH'
const GIT_COMMIT_DATE = 'GIT_COMMIT_DATE'
const path = require('path')
const fs = require('fs')

const commitHash = childProcess.execSync('git rev-parse HEAD', {encoding:'utf-8'}).trim()
const commitDate = childProcess.execSync('git log -1 --format=%ct', {encoding:'utf-8'}).trim()
const envFilePath = path.join(__dirname, '../.env')
const envFile = fs.readFileSync(envFilePath, 'utf-8')
const envOptions = envFile.split('\n')

try {
    fs.accessSync(envFilePath, fs.constants.F_OK)
} catch(err) {
    console.log('Cannot access .env file')
    process.exit(-1)
}

function hasCommitKeys(options) {
    const parsedOptions = options.map(option => option.split('='))
    let hasHash, hasDate
    parsedOptions.forEach(op => {
        if(op[0] === GIT_COMMIT_HASH) hasHash = true
        if(op[0] === GIT_COMMIT_DATE) hasDate = true
    })
    return [hasHash, hasDate]
}

function updateVariable(str) {
    let [key, val] = str.split('=')
    switch(key) {
        case GIT_COMMIT_HASH:
            val = commitHash
            return [key, val].join('=')
        case GIT_COMMIT_DATE:
            val = commitDate
            return [key, val].join('=')
        default:
            return str
    }
}

let newEnvOptions = null
if(hasCommitKeys(envOptions).every(val => val === true)) {
    newEnvOptions = envOptions.map(updateVariable)
} else {
    newEnvOptions = [...envOptions]
    newEnvOptions.push(`${GIT_COMMIT_HASH}=${commitHash}`)
    newEnvOptions.push(`${GIT_COMMIT_DATE}=${commitDate}`)
}

if(Array.isArray(newEnvOptions)) {
    fs.writeFileSync(envFilePath, newEnvOptions.join('\n'))
}
