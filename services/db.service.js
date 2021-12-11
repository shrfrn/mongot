const MongoClient = require('mongodb').MongoClient

module.exports = {
    getCollection,
}

async function getCollection(collectionName, dbName, connectionStr) {

    try {
        const db = await connect(dbName, connectionStr)
        const collection = await db.collection(collectionName)
        return collection
    } catch (err) {
        console.log('Failed to get Mongo collection', err)
        throw err
    }
}

async function connect(dbName, connectionStr) {
    try {
        
        const client = await MongoClient.connect(connectionStr, { useNewUrlParser: true, useUnifiedTopology: true })
        const db = client.db(dbName)
        return db
    } catch (err) {
        console.log('Cannot Connect to DB', err)
        throw err
    }
}