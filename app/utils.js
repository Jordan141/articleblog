const CATEGORIES_LIST = require('./staticdata/categories.json')
const Article = require('./models/article')
const Counter = require('./models/routeCounter')
const Newsletter = require('./models/newsletter')
const mailer = require('./mailer')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const PAGE_SIZE = 5
const TOP_STORIES_COUNT = 3

async function generateCategoriesChecksum() {
    try {
        const categoryImagesDir = path.join(__dirname, 'public', 'assets', 'categories')
        const categoryStaticDataFilepath = path.join(__dirname, 'staticdata', 'categories.json')
        for(let category of CATEGORIES_LIST) {
            const filePath = path.join(categoryImagesDir, `${category.key}.jpg`)
            const categoryImageBuffer = await fs.promises.readFile(filePath)
            category.checksum = __generateChecksum(categoryImageBuffer)
        }
        await fs.promises.writeFile(categoryStaticDataFilepath, JSON.stringify(CATEGORIES_LIST, null, 2))
    } catch(err) {
        logger.info(`generateCategoriesChecksum Error: ${err}`)
    }
}

function __generateChecksum(str, algorithm, encoding) {
    return crypto
        .createHash(algorithm || 'sha1')
        .update(str, 'utf-8')
        .digest(encoding || 'hex')
}

async function findTopStories() {
    try {
        const findTopRoutesQuery = Counter.find({}).sort('-viewCount').limit(TOP_STORIES_COUNT)
        const topRoutes = await findTopRoutesQuery.exec()
        if(!topRoutes) return
        const articleLinks = topRoutes.map(route => route.articleLink)
        const topArticles = await Article.find().where('link').in(articleLinks).exec()
        return topArticles
    } catch(err) {
        logger.info('findTopStories:', err)
        return
    }
}

async function findCommonCategories() {
    try {
        const articles = await Article.find({}).exec()
        return CATEGORIES_LIST.map(category => {
            const articlesInCategory = articles.filter(article => article.categories.includes(category.key))
            const articleCount = articlesInCategory.length
            return {...category, amount: articleCount}
        }).sort(sortCategories)
    } catch(err) {
        logger.info('findCommonCategories: ' + err)
    }
}

function sortCategories(a, b) {
    if(a.amount < b.amount) return 1
    else if(a.amount > b.amount) return -1
    return 0
}


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function buildArticleSearchQuery(params, pageNumber) {
    const mongoQuery = {isApproved: true}
    if(!params) return Article.find(mongoQuery).sort('-createdAt').skip((PAGE_SIZE * pageNumber) - PAGE_SIZE).limit(PAGE_SIZE)
    if(params.category) {
        const isValidCategory = CATEGORIES_LIST.find(category => category.key === params.category)
        if(isValidCategory) mongoQuery.categories = params.category
    }
    if(params.query) return Article.fuzzySearch(escapeRegex(params.query)).where(mongoQuery).skip((PAGE_SIZE * pageNumber) - PAGE_SIZE).limit(PAGE_SIZE)
    return Article.find(mongoQuery).sort('-createdAt').skip((PAGE_SIZE * pageNumber) - PAGE_SIZE).limit(PAGE_SIZE)
}

async function findAuthorCategories(authorId) {
    try {
        const articles = await Article.find({author: authorId}).exec() || []
        const categories = new Map()
       
        for(let article of articles) {
            for(let category of article.categories) {
                categories.set(category, (categories.get(category) || 0) + 1)
            }
        }
        
        return Array.from(categories.entries()).reduce((main, [key, value]) => ({...main, [key]: value}), {})

    } catch(err) {
        logger.info(`findAuthorCategories Error: ${err}`)
        return []
    }
}

async function sendNewsletters(article) {
    const subscribers = await Newsletter.find({}).exec()
    const transporter = await mailer.init()
    subscribers.forEach(async subscriber => {
        const infoId = await mailer.sendMail(transporter, subscriber.email, `PoC - Newsletter: ${article.title}`, article.description)
        if(convertToBoolean(process.env.DEV_MODE)) logger.info(mailer.viewTestResponse(infoId))
    })
}

function convertToBoolean(input) {
    if(typeof input === 'string') return input.toLowerCase() === 'true'
    if(typeof input === 'boolean') return input
}

function convertContentImagesToResponsiveImages(body) {
    const startIndex = body.search("<img")
    const endIndex = body.indexOf(">", startIndex)
    const imgElement = body.slice(startIndex, endIndex)
    if(!startIndex || !endIndex || !imgElement) return body
    const imgUrl = imgElement.split('src="')[1].split('"')[0]
    let responsiveImage = `<%- include('../ssrUtils/responsiveImage', {
        url: /articles/image/${imgUrl},
        checksum: article.checksum,
        imageSizes: [650, 1024, 1920, 2048],
        classList: 'article__image center-background img-fit',
        data: article.link,
        id: null
      }) %>`

    const parsedBody = body.substring(0, startIndex) + responsiveImage + body.substring(endIndex, body.length - 1)
    return parsedBody
}


module.exports = {
    findCommonCategories,
    findTopStories,
    buildArticleSearchQuery,
    sendNewsletters,
    convertToBoolean,
    findAuthorCategories,
    generateCategoriesChecksum,
    convertContentImagesToResponsiveImages
}
