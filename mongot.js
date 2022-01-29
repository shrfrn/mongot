const packetSize = 100

const terminal = require( 'terminal-kit' ).terminal

const dbService = require('./services/db.service')
const cmdLineService = require('./services/command-line.service')
const logger = require('./services/logger.service')

var gCmdOptions = {}
var gDefs = []
var gProgressBar
var gSpinner

function setup(){

    gCmdOptions = cmdLineService.getCmdOptions()

    if(gCmdOptions.help) {
        cmdLineService.showHelp()
        return
    }

    logger.setLogFile(gCmdOptions.log ? gCmdOptions.log : 'mongot.log')
    logger.info(`Starting... \n ${JSON.stringify(gCmdOptions, null, '\t')}`)
    
    gCmdOptions.defFile.forEach(defFile => {
        if(defFile.indexOf('.') === -1) defFile.concat('.json')
        require(defFile).forEach(def => gDefs.push(def))
    })
    logger.info(`defFiles... \n ${JSON.stringify(gDefs, null, '\t')}`)
    
    gDefs.forEach(def => {
        
        for (const key in gCmdOptions) {
            def[key] = gCmdOptions[key]
        }
        if(!def.stages) throw 'Aggregation definition missing.'
        
        if(!def.sourceConnectionStr && def.connectionStr) def.sourceConnectionStr = def.connectionStr
        if(!def.sourceConnectionStr) throw 'Source connection string missing.'
        
        if(!def.noWrite){
            if(!def.destConnectionStr && def.connectionStr) def.destConnectionStr = def.connectionStr
            if(!def.destConnectionStr) throw 'Destinaion connection string missing.'
        }
        if(def.csvPath && def.csvDef) def.csvDef.path = def.csvPath
        if(def.jsonPath && def.jsonDef) def.jsonDef.path = def.jsonPath

        logger.info(`${JSON.stringify(def), null, '\t'}\n`)
    })
}
function initProgressBar(title){
    gProgressBar = terminal.progressBar({
        width: 120 ,
        title,
        eta: true ,
        percent: true,
    })
}
async function showSpinner(msg){
    terminal('\n')
    terminal.column(10)
    gSpinner = await terminal.spinner()
    terminal(msg) 
}
async function showMsg(msg){
    terminal('\n\n')
    terminal(msg) 
    terminal('\n')
}
function hideSpinner(){
    gSpinner.animate(false)
    terminal.eraseLine().column(10)
}
async function writeDocs(docs, def) {

    const title = `Writing ${docs.length.toLocaleString()} documents to ${def.destDb}.${def.destCollection} ...  `
    
    try {
        const collection = await dbService.getCollection(def.destCollection, def.destDb, def.destConnectionStr)

        initProgressBar(title)

        for(let i = 0; i <= docs.length; i += packetSize){
            const packet = docs.slice(i, i + packetSize)
            logger.info(`About to insert packet ${i / packetSize + 1} (packet size ${packetSize} documents)\n`)
            await collection.insertMany(packet)
            gProgressBar.update((i + packetSize) / docs.length)
        }
        gProgressBar.stop()
    } catch (err) {
        logger.error(`Failed to insert packet`)
        console.log('cannot insert listing', err)
        throw err
    }
}
async function writeCSV(docs, def){

    const fs = require('fs')
    
    const seperator = ','
    const recordDef = []

    const { projection, path } = def.csvDef
    let docsStr = ''
    let docCount = 0

    for (const key in projection) {
        recordDef.push(key)
    }
    const title = `Writing ${docs.length.toLocaleString()} rows to ${def.csvDef.path} ...  `
    initProgressBar(title)

    if(!def.noCsvHeadings) docsStr = recordDef.join(seperator) + '\n'
    docs.forEach(doc => {
        recordDef.forEach(key => {

            nestedKeys = key.split('.')
            let currField = doc
            
            nestedKeys.forEach(nestedKey => currField = currField[nestedKey])
            docsStr += `${currField}${seperator}`
        })
        docsStr = docsStr.slice(0, -1)
        docsStr += "\n"
        
        if(! (docCount++ % packetSize)){
            fs.appendFileSync(path, docsStr, 'utf8')
            logger.info(`About to write packet # ${parseInt(docCount / packetSize) + 1} to ${path}`)
            gProgressBar.update(docCount / docs.length)
            docsStr = ''
        }
    })
    
    logger.info(`Writing last packet to ${path}`)
    fs.appendFileSync(path, docsStr, 'utf8')

    gProgressBar.update(docCount / docs.length)
    gProgressBar.stop()
}
function writeJSON(docs, def){
    const path = def.jsonDef.path
    const docsStr = JSON.stringify(docs, null, '\t')
    
    const fs = require('fs')
    fs.writeFileSync(path, docsStr, 'utf8')
}
////////////////////////////////////////////

(async () => {

    setup()
    if(gCmdOptions.help) process.exit(0)

    terminal('\n\n\n')
    
    try {
        for (let i = 0; i < gDefs.length; i++) {
            
            const def = gDefs[i]
    
            await showMsg(`Running ${def.stages.length} aggregation stage(s)... ${def.msg ? def.msg : ''} `) 
            logger.info(`Begining aggregation with ${def.stages.length} stages`)

            const collection = await dbService.getCollection(def.sourceCollection, def.sourceDb, def.sourceConnectionStr)
            const docs = await collection.aggregate(def.stages).toArray()
            
            logger.info(`Ended aggregation`)

            if(!def.noWrite) await writeDocs(docs, def)
            if(!def.noCsv && def.csvDef) writeCSV(docs, def)
            if(!def.noJson && def.jsonDef) writeJSON(docs, def)
        }
    } catch (err) {
        console.log('error', err);
    }
    terminal('\n\n\n')
    terminal.column(1).processExit(0)
})()