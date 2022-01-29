(async () => {
    const users = require('../json/user.json')
    const stays = require('../json/stay1.json')

    const idMap = {}
    users.forEach(user => { idMap[user.id] = user._id} )
    stays.forEach(stay => {
        
        stay.host.id = stay.host._id
        stay.host._id = idMap[stay.host._id]

        stay.reviews.forEach(review => {
            review.by.id = review.by._id
            review.by._id = idMap[review.by.id]
        })
    })
    try {
        const fs = require('fs')
        const stayStr = JSON.stringify(stays, null, '\t')
        fs.writeFileSync('./json/stay2.json', stayStr, 'utf8')
    } catch (err) {
        console.log(err, res);
    }
    process.exit(0)
})()