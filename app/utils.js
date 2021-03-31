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

function getIndicesOf(searchStr, str, caseSensitive = false) {
    const searchStrLen = searchStr.length
    if (searchStrLen == 0) return []
    
    let startIndex = 0, index, indices = []
    if (caseSensitive) {
        str = str.toLowerCase()
        searchStr = searchStr.toLowerCase()
    }

    while ((index = str.indexOf(searchStr, startIndex)) > -1) {
        indices.push(index)
        startIndex = index + searchStrLen
    }
    return indices
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

function generateWebpSrcSet(url, checksum, imageSizes) {
    const webpUrl = `${url.split('.')[0]}.webp`
    return imageSizes.flatMap(size => {
        if (size === 0) return []
        return `${webpUrl}?checksum=${checksum}&width=${size} ${size}w`
    }).join(', ')
}

function generateSrcSet(url, checksum, imageSizes) {
    url = url.split('.')[0]
    return imageSizes.flatMap(size => {
      if (size === 0) return []
      return `${url}?checksum=${checksum}&width=${size} ${size}w`
    }).join(', ')
  }

function generateSrcSizes(imageSizes) {
    const SCREEN_SIZES = [650, 1024, 1920, 2048]
    return SCREEN_SIZES.flatMap((screenSize, sizeIndex) => {
      if (imageSizes[sizeIndex] === 0) return []
      return `(max-width: ${screenSize}px) ${imageSizes[sizeIndex]}px`
    }).join(', ')

}

function createResponsiveImage(url, checksum, imageSizes) {
    return `<picture><source srcset="${generateWebpSrcSet(url, checksum, imageSizes)}" sizes="${generateSrcSizes(imageSizes)}" type="image/webp" /><source srcset="${generateSrcSet(url, checksum, imageSizes)}" sizes="${generateSrcSizes(imageSizes)}"/><img class="recommended-article__image center-background img-fit" src="${url}?doesNotSupportPicture&checksum=<%=checksum%>"></picture>`
}

function convertContentImagesToResponsiveImages(article) {
    const CONTENT_IMAGE_SIZES = [650] //TODO: Assign proper content image sizes
    const imgIndices = getIndicesOf("<img", article.body)
    if(!imgIndices) return article
    let {body, checksum} = article
    for(let startIndex of imgIndices) {
        const endIndex = body.indexOf(">", startIndex)
        const imgElement = body.slice(startIndex, endIndex)
        if(!endIndex || !imgElement) continue;

        const imgUrl = imgElement.split('src="')[1].split('"')[0]
        const responsiveImage = createResponsiveImage(imgUrl, checksum, CONTENT_IMAGE_SIZES)
        body = body.substring(0, startIndex) + responsiveImage + body.substring(endIndex + 1, body.length - 1)
    }
    article.body = body
    return article
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
