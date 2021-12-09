const packetSize = 100

const commandLineArgs = require('command-line-args')
const terminal = require( 'terminal-kit' ).terminal

const dbService = require('./db.service')
const logger = require('./logger.service')
/*
// Todos:
// Add help screen
// log
*/
var gCmdOptions = {}
var gDefs = []
var gProgressBar
var gSpinner

function getCmdOptions(){

    const optionDefinitions = [
        { name: 'def-file', alias: 'f', type: String, multiple: true, defaultOption: true, defaultValue: 'transform.json' },
        { name: 'csv-path', alias: 'c', type: String },
        { name: 'no-csv', alias: 'C', type: Boolean },
        { name: 'no-csv-headings', alias: 'H', type: Boolean },
        { name: 'no-write', alias: 'N', type: Boolean },
        { name: 'connection-str', alias: 's', type: String },
        { name: 'source-connection-str', alias: 'i', type: String },
        { name: 'source-collecion', alias: 'T', type: String },
        { name: 'source-db', alias: 'D', type: String },
        { name: 'dest-connection-str', alias: 'o', type: String },
        { name: 'dest-collecion', alias: 't', type: String },
        { name: 'dest-db', alias: 'd', type: String },
        { name: 'log', alias: 'l', type: Boolean },
        { name: 'help', alias: 'h', type: Boolean },
        { name: 'show-version', alias: 'v', type: Boolean },
    ]  
    return commandLineArgs(optionDefinitions, { camelCase: true })
}
function setup(){

    gCmdOptions = getCmdOptions()

    gCmdOptions.defFile.forEach(defFile => {
        if(defFile.indexOf('.') === -1) defFile.concat('.json')
        require(defFile).forEach(def => gDefs.push(def))
    })
    
    gDefs.forEach(def => {

        for (const key in gCmdOptions) {
            def[key] = gCmdOptions[key]
        }
        if(!def.sourceConnectionStr && def.connectionStr) def.sourceConnectionStr = def.connectionStr
        if(!def.sourceConnectionStr) throw 'Source connection string missing.'

        if(!def.noWrite){
            if(!def.destConnectionStr && def.connectionStr) def.destConnectionStr = def.connectionStr
            if(!def.destConnectionStr) throw 'Destinaion connection string missing.'
        }
        if(def.csvPath && def.csvDef) def.csvDef.path = def.csvPath
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
    terminal(msg ) 
}
function hideSpinner(){
    gSpinner.animate(false)
    terminal.eraseLine().column(10)
}
async function writeDocs(docs, def) {

    const title = def.msg ? def.msg : `Writing ${docs.length.toLocaleString()} documents to ${def.destDb}.${def.destCollection} ...  `
    
    try {
        const collection = await dbService.getCollection(def.destCollection, def.destDb, def.destConnectionStr)

        initProgressBar(title)

        for(let i = 0; i <= docs.length; i += packetSize){
            const packet = docs.slice(i, i + packetSize)
            await collection.insertMany(packet)
            gProgressBar.update((i + packetSize) / docs.length)
        }
        gProgressBar.stop()
    } catch (err) {
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
        recordDef.forEach(key => docsStr += `${doc[key]}${seperator}`)
        docsStr = docsStr.slice(0, -1)
        docsStr += "\n"
        
        if(! (docCount++ % packetSize)){
            fs.appendFileSync(path, docsStr, 'utf8')
            gProgressBar.update(docCount / docs.length)
            docsStr = ''
        }
    })
    
    fs.appendFileSync(path, docsStr, 'utf8')
    gProgressBar.update(docCount / docs.length)
    gProgressBar.stop()
}

////////////////////////////////////////////

(async () => {

    setup()
    terminal('\n\n\n')
    
    try {
        for (let i = 0; i < gDefs.length; i++) {
            
            const def = gDefs[i]
    
            await showSpinner( '  Running aggregation stages...' ) 
            const collection = await dbService.getCollection(def.sourceCollection, def.sourceDb, def.sourceConnectionStr)
            const docs = await collection.aggregate(def.stages).toArray()
            hideSpinner()
            
            if(!def.noWrite) await writeDocs(docs, def)
            if(!def.noCsv && def.csvDef) writeCSV(docs, def)
        }
    } catch (err) {
        console.log('error', err);
    }
    terminal('\n\n\n')
    terminal.column(1).processExit(0)
})()