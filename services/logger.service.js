const fs = require('fs')

var gLogFile = ''

const echoOn = false
const logsDir = './logs'

if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir)
}

function setLogFile(fileName){
    gLogFile = fileName
}

function getTime() {
    let now = new Date()
    return now.toLocaleString()
}

function isError(e) {
    return e && e.stack && e.message;
}

function doLog(level, ...args) {

    const strs = args.map(arg =>
        (typeof arg === 'string' || isError(arg)) ? arg : JSON.stringify(arg)
    )

    var line = strs.join(' | ')
    line = `${getTime()} - ${level} - ${line}\n`
    if(echoOn) console.log(line)
    fs.appendFileSync(gLogFile ? `${logsDir}/${gLogFile}` : './logs/backend.log', line)
}

module.exports = {
    setLogFile,
    debug(...args) {
        // if (process.env.NODE_NEV === 'production') return
        doLog('DEBUG', ...args)
    },
    info(...args) {
        doLog('INFO', ...args)
    },
    warn(...args) {
        doLog('WARN', ...args)
    },
    error(...args) {
        doLog('ERROR', ...args)
    },
}