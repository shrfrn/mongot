const commandLineArgs = require('command-line-args')

module.exports = {
    getCmdOptions,
    showHelp,
}

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
        { name: 'log', alias: 'l', type: String, defaultValue: 'mongot.log' },
        { name: 'help', alias: 'h', type: Boolean },
    ]  
    return commandLineArgs(optionDefinitions, { camelCase: true })
}
function showHelp(){
    
    const commandLineUsage = require('command-line-usage')
    const optionDefinitions = [
        {
            name: 'help',
            description: 'Display this usage guide.',
            alias: 'h',
            type: Boolean,
            group: 'main',
        },
        {
            name: 'log',
            description: 'Write execution log files.',
            alias: 'l',
            type: Boolean,
            group: 'main',
        },
        {
            name: 'defFile',
            description: 'Definition files (defFiles) are JSON’s containing definitions for the transformations to be executed (transDefs). One or several defFiles may be passed on the command line.',
            alias: 'f',
            type: String,
            multiple: true,
            defaultOption: true,
            typeLabel: '{underline file(s)}...',
            group: 'main',
        },
        {
            name: 'connection-str',
            description: 'Valid MongoDB connection string for both input & output',
            alias: 's',
            type: String,
            typeLabel: '{underline uri}',
            group: 'connection'
        },
        {
            name: 'source-connection-str',
            description: 'Valid MongoDB connection string for input',
            alias: 'i',
            type: String,
            typeLabel: '{underline uri}',
            group: 'connection'
        },
        {
            name: 'dest-connection-str',
            description: 'Valid MongoDB connection string for output',
            alias: 'o',
            type: String,
            typeLabel: '{underline uri}',
            group: 'connection'
        },
        {
            name: 'source-db',
            description: 'MongoDB source database name',
            alias: 'D',
            type: String,
            typeLabel: '{underline db}',
            group: 'db'
        },
        {
            name: 'source-collection',
            description: 'MongoDB source collection name',
            alias: 'T',
            type: String,
            typeLabel: '{underline collection}',
            group: 'db'
        },
        {
            name: 'dest-db',
            description: 'MongoDB destination database name',
            alias: 'd',
            type: String,
            typeLabel: '{underline db}',
            group: 'db'
        },
        {
            name: 'dest-collection',
            description: 'MongoDB destination collection name',
            alias: 't',
            type: String,
            typeLabel: '{underline collection}',
            group: 'db'
        },
        {
            name: 'no-write',
            description: 'Suppress output to database',
            alias: 'N',
            type: Boolean,
            group: 'db'
        },
        {
            name: 'csv-path',
            description: 'CSV output full path',
            alias: 'c',
            type: String,
            typeLabel: '{underline file}',
            group: 'csv'
        },
        {
            name: 'no-csv',
            description: 'suppress CSV output',
            alias: 'C',
            type: Boolean,
            group: 'csv'
        },
        {
            name: 'no-csv-headings',
            description: 'suppress CSV column headings',
            alias: 'H',
            type: Boolean,
            group: 'csv'
        },
    ]
    
    const sections = [
      {
        header: 'Mongo Trasform ver 0.9 (mongot)',
        content: 'Mongo Transform is a command line utility for performing transformations on MongoDB collections using the MongoDB aggregation framework.'
      },
      {
        header: 'Synopsis',
        content: [
          '$ node mongot {underline defFile(s)}... ',
          '$ node mongot {bold --help}',
        ]
      },
      {
        header: 'Basic Options',
        optionList: optionDefinitions,
        group: [ 'main' ]
      },
      {
        header: 'Connection',
        optionList: optionDefinitions,
        group: [ 'connection' ]
      },
      {
        header: 'Database',
        optionList: optionDefinitions,
        group: [ 'db' ]
      },
      {
        header: 'CSV',
        optionList: optionDefinitions,
        group: [ 'csv' ]
      },
      {
        header: 'Examples',
        content: [
          {
            desc: '1. Specify a defFile ',
            example: '$ node mongot {underline fullpath}'
          },
          {
            desc: '2. Specify connection string for output database',
            example: '$ node mongot {bold -o} {underline dbURL: mongodb://localhost:27017}',
          },
          {
            desc: '2. Suppress database output',
            example: '$ node mongot {bold -N}',
          },
          {
            desc: '2. Specify CSV output path',
            example: '$ node mongot {bold -c} {underline fullpath}',
          },
          {
            desc: '2. Suppress CSV output',
            example: '$ node mongot {bold -C}',
          },
        ]
      },
      {
        content: 'Project home: {underline https://github.com/shrfrn/mongot}'
      }
    ]
    
    console.log(commandLineUsage(sections))
}
