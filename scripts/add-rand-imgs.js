(async () => {
    const stays = require('../json/stay2.json')
    const images = require('./json/images2.json')

    stays.forEach(stay => stay.imgUrls = [ ... getRandomImages(images, 5) ])

    try {
        const fs = require('fs')
        const stayStr = JSON.stringify(stays, null, '\t')
        fs.writeFileSync('./json/stay.json', stayStr, 'utf8')

    } catch (err) {
        console.log(err);
    }
    process.exit(0)
})()

function getRandomImages(images, count) {
    const imgNums = []
    const randomImages = []

    while(imgNums.length < count){
        idx = getRandomInt(images.length)
        if(imgNums.includes(idx)) continue
        imgNums.push(idx)
    }
    while(imgNums.length){
        randomImages.push(images[imgNums[0]].imgUrl)
        imgNums.shift()
    }
    return randomImages
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}
