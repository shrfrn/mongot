/*
// First, you need to load the sample data into your cluster:
// Login to your cluster, click the button with the three dots,
// and select Load Sample Dataset. This will prompt you to load 
// a bunch of datasets, including the sample_airbnb dataset.
//
// Some insights about the Mongo Airbnb sample data:
//
// - 5104 hosts
// - 146640 users
// - 5555 stays
//
// - There is no overlapping of host and user ids
// - Each stay contains a single link to an image.
// - I'm currently using robohash to create avatars for users
*/
const packetSize = 100
const dbService = require('./db.service')
const terminal = require( 'terminal-kit' ).terminal ;

const dbOptions = {}

var progressBar

async function getListings() {
    try {
        const projection = require('./map.json')
        console.log(dbOptions.sourceColl, dbOptions.sourceDb);
        const collection = await dbService.getCollection(dbOptions.sourceColl, dbOptions.sourceDb)

        return await collection.find({name: {$regex: /^n/i}}).project(projection).toArray()
    } catch(err) {
        console.log(err)
    }
}
async function insertListings(listings) {

    const initLength = listings.length
    progressBar = terminal.progressBar({
        width: 90 ,
        title: 'Writing listings...  '.padEnd(22),
        eta: true ,
        percent: true,
    })
    
    try {
        const collection = await dbService.getCollection(dbOptions.destStayColl, dbOptions.destDb)
        for(let i = 0; i * packetSize < listings.length; i++){
            const packet = listings.slice(i * packetSize, (i + 1) * packetSize)
            await collection.insertMany(packet, { ordered: false } )
            progressBar.update((i + 1) * packetSize / initLength)
        }
        progressBar.stop()
    } catch (err) {
        console.log('cannot insert listing', err)
        throw err
    }
}
function createUniqueHosts(listings, uniqueUserIds){
    const users = []

    listings.forEach(listing => {

        if(uniqueUserIds.has(listing.host._id)) return
        
        const user = {
            _id: listing.host._id,
            name: listing.host.name,
            imgUrl: `https://robohash.org/${listing.host._id}?set=set2`,
            isAdmin: true,
            // TODO: Make sure usernames are unique
            username: listing.host.name?.split(' ', 1)[0],
            password: listing.host.name?.split(' ', 1)[0],
        }
        uniqueUserIds.add(user._id)
        users.push(user)
    })
    return users
}
function createUniqueUsers(listings, uniqueUserIds){
    const users = []

    listings.forEach(listing => 
        listing.reviews.forEach(review => {

            if(uniqueUserIds.has(review.reviewerId)) return

            const user = {
                _id: review.reviewerId,
                name: review.reviewerName,
                imgUrl: `https://robohash.org/${review.reviewerId}?set=set2`,
                isAdmin: false,
                // TODO: Make sure usernames are unique
                username: review.reviewerName?.split(' ', 1)[0],
                password: review.reviewerName?.split(' ', 1)[0],
            }
            uniqueUserIds.add(user._id)
            users.push(user)
        }))
    return users
}
async function insertUsers(users){

    const initLength = users.length
    progressBar = terminal.progressBar({
        width: 90 ,
        title: 'Writing users...  '.padEnd(22),
        eta: true ,
        percent: true,
    })
    
    try {
        const collection = await dbService.getCollection(dbOptions.destUserColl, dbOptions.destDb)

        for(let i = 0; i * packetSize < users.length; i++){
            const packet = users.slice(i * packetSize, (i + 1) * packetSize)
            await collection.insertMany(packet, { ordered: false } )
            progressBar.update((i + 1) * packetSize / initLength)
        }
        progressBar.stop()
    } catch (err) {
        console.log('cannot insert user', err)
        throw err
    }
}
async function userInput(prompt, defaultVal = ''){
    
    terminal('\n' + prompt + ' ')
    const input = await terminal.green().inputField( { default: defaultVal } ).promise
    return input
}
async function getOptions(){
    dbOptions.sourceDb = await userInput('Please enter source database name:', 'sample_airbnb')
    dbOptions.sourceColl = await userInput('Please enter source collection name:', 'listingsAndReviews')
    dbOptions.destDb = await userInput('Please enter destination database name:', 'Airbnb')
    dbOptions.destStayColl = await userInput('Please enter destination collection name for stays:', 'stay')
    dbOptions.destUserColl = await userInput('Please enter destination collection name for users:', 'user')
}
(async () => {

    const uniqueUserIds = new Set()

    await getOptions()   // Prompt user for source and destination db's and collections

    terminal.clear().moveTo(10,3)
    
    try {
        const spinner = await terminal.spinner()
        terminal( '  Fetching documents from sample_airbnb database ...' ) 

        const listings = await getListings()

        spinner.animate( false )
        terminal.eraseLine()
        terminal.clear().moveTo(10,3)

        await insertListings(listings)

        const hosts = createUniqueHosts(listings, uniqueUserIds)
        const users = createUniqueUsers(listings, uniqueUserIds)
        terminal.moveTo(10,4)

        await insertUsers(hosts.concat(users))

        terminal.clear().moveTo(10,7)
        terminal.green()('success')
    } catch (err) {
        console.log(err);
    } finally {
        terminal.processExit(0)
    }
})()