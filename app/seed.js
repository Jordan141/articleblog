const Article = require('./models/article')
const User = require('./models/user')
const Link = require('./models/link')
const fs = require('fs')
const path = require('path')
const Counter = require('./models/routeCounter')
const logger = require('./logger')
const {articles, users} = require('./staticdata/dummydata.json')
const DUMMY_PASSWORD = 'mattlovestrees23'
const {convertToBoolean} = require('./utils')
const {removeOrphanedImages, setArticleHeaderImage, setProfileImage} = require('./imageUtils')
const dummyImageFilePath = path.join(__dirname, 'content', 'images', 'article', 'dummy.jpeg')
const dummyProfileImageFilePath = path.join(__dirname, 'content', 'images', 'profile', 'dummy.jpeg')
const dummyImage = {data: fs.readFileSync(dummyImageFilePath)}
const dummyProfileImage = {data: fs.readFileSync(dummyProfileImageFilePath)}

async function initialLaunchCheck(options) {
    const DEV_MODE = convertToBoolean(process.env.DEV_MODE)
    if(!DEV_MODE) return
    if(options?.clear_db && DEV_MODE) await dropCollections()
    try {
        const articleCount = await Article.estimatedDocumentCount()
        const userCount = await User.estimatedDocumentCount()
        if(userCount === 0) await seedUsers()
        if(articleCount === 0) { 
            await seedArticles()
            await seedCounters()
        }

    } catch(err) {
        logger.info(`SeedDB Error: ${err}`)
    }
}

async function seedArticles() {
    try {
        logger.info('Seeding Articles...')
        const authors = await User.find({role: 'author'}).exec()
        for(let article of articles) {
            const randomAuthorIndex = Math.round(Math.random())
            article.author = authors[randomAuthorIndex]._id
            const createdArticle = await Article.create({...article})
            await setArticleHeaderImage(dummyImage, createdArticle.link)
        }
        logger.info('Finished seeding articles...')
    } catch(err) {
        logger.info(`SeedArticles Error: ${err}`)
    }
}

async function seedCounters() {
    try {
        logger.info('Seeding Counters...')
        for(let article of articles) {
            if(!article.isApproved) continue
            await Counter.create({
                url: `/articles/${article.link}`, 
                articleLink: article.link
            })
        }
        logger.info('Finished seeding counters...')
    } catch(err) {
        logger.info(`SeedCounters Error: ${err}`)
    }
}

async function seedUsers() {
    try {
        logger.info('Seeding Users...')
       for (let user of users) {
            const createdUser = await User.register(user, DUMMY_PASSWORD)
            await setProfileImage(createdUser.link, dummyProfileImage)
        }
        logger.info('Finished seeding users...')
    } catch(err) {
        logger.info(`SeedUsers Error: ${err}`)
    }
}

async function dropCollections() {
    logger.info(`Dropping Collections...`)
    await Article.deleteMany({})
    await User.deleteMany({})
    await Counter.deleteMany({})
    await Link.deleteMany({})
    await removeOrphanedImages()
    logger.info('Finished dropping.')
}

module.exports = initialLaunchCheck