const Article = require('./models/article')
const User = require('./models/user')
const Counter = require('./models/routeCounter')
const logger = require('./logger')
const {articles, users} = require('./staticdata/dummydata.json')
const entities = require('he')
const SPACES = /\s/g, DASH = '-'
const DUMMY_PASSWORD = 'mattlovestrees23'
const {removeOrphanedImages} = require('./utils')

async function initialLaunchCheck(options) {
    if(!process.env.DEV_MODE) return
    if(options?.clear_db && process.env.DEV_MODE) await dropCollections()
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
        const authors = await User.find({role: 'author'}).exec()
        for(let article of articles) {
            article.link = entities.decode(article.title.replace(SPACES, DASH))
            const randomAuthorIndex = Math.round(Math.random())
            article.author = authors[randomAuthorIndex]._id
            await Article.create({...article})
        }
    } catch(err) {
        logger.info(`SeedArticles Error: ${err}`)
    }
}

async function seedCounters() {
    try {
        for(let article of articles) {
            if(!article.isApproved) continue
            await Counter.create({
                url: `/articles/${article.link}`, 
                articleLink: article.link
            })
        }
    } catch(err) {
        logger.info(`SeedCounters Error: ${err}`)
    }
}

async function seedUsers() {
    try {
       for (let user of users) {
            user.link = encodeURIComponent(user.fullname.replace(/\s/g, '-'))
            await User.register(user, DUMMY_PASSWORD)
        }
    } catch(err) {
        logger.info(`SeedUsers Error: ${err}`)
    }
}

async function dropCollections() {
    await Article.deleteMany({})
    await User.deleteMany({})
    await Counter.deleteMany({})
    await removeOrphanedImages()
}

module.exports = initialLaunchCheck