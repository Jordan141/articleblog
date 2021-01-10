const CATEGORIES_LIST = require('./staticdata/categories.json')
const Article = require('./models/article')
const Counter = require('./models/routeCounter')
const User = require('./models/user')
const Newsletter = require('./models/newsletter')
const mailer = require('./mailer')
const fs = require('fs')
const crypto = require('crypto')
const path = require('path')
const sharp = require('sharp')
const logger = require('./logger')
sharp.cache({files: 0})

const JPEG = 'jpeg', JPEG_OPTIONS = {force: true, chromaSubsampling: '4:4:4'}
const DEFAULT_IMAGE_WIDTH = 256, DEFAULT_IMAGE_HEIGHT = 256
const PROFILE = 'profile', ARTICLE = 'article'
const PAGE_SIZE = 5
const TOP_STORIES_COUNT = 3, ARTICLE_HEADER_ID = 37, ARTICLE_BODY_ID = 14
const PAGE_SIZE = 1
const USER_PROFILE_IMAGENAME_LENGTH = 12
const ARTICLE_HEADER_IMAGENAME_LENGTH = 16

function getImageDirectory(folderName) {
    const URL = path.join(__dirname, 'content', 'images', folderName)
    if(!fs.existsSync(URL)) {
        fs.mkdirSync(URL, {recursive: true})
    }
    return URL
}

async function hasIOPermissions(path) {
    if(!fs.existsSync(path)) throw new Error('Invalid Path Parameter: Path does not exist.')
    try {
        await fs.promises.access(path, fs.constants.R_OK | fs.constants.W_OK)
        return true
    } catch(err) {
        fs.stat(path, (_, stats) => {
            logger.info(`Invalid R/W Permissions on path:${path + '\n'} ${'0' + (stats.mode & parseInt('777', 8)).toString(8)}`)
        })
        return false
    }
}

async function __saveImage(image, imageName, folder) {
    try {
        if(!image) throw new Error('Invalid Parameters on __saveImage: No Image Passed')
        const dirPath = getImageDirectory(folder)
        const hasPermissions = await hasIOPermissions(dirPath)
        if(!hasPermissions) throw new Error('Error: __saveImage: Invalid Permissions')
        const filePath = path.join(dirPath, imageName)
        const imageInfo = await sharp(image.data).toFormat(JPEG).jpeg(JPEG_OPTIONS).toFile(filePath)
        return imageInfo
    } catch(err) {
        logger.info(`Save Image: ${err}`)
        return false
    }
}

async function __getImage(res, imageName, folder, width, height) {
    try {
        if(!imageName || !folder) throw new Error('__getImage Error: Invalid parameters: ', imageName, folder)
        const dirPath = getImageDirectory(folder)
        const hasPermissions = await hasIOPermissions(dirPath)
        if(!hasPermissions) throw new Error('__getImage Error: Invalid Permission at: ' + dirPath)
        imageName = imageName.includes(JPEG) ? imageName : imageName.concat(`.${JPEG}`)
        const filePath = path.join(dirPath, imageName)
        if(!fs.existsSync(filePath)) throw new Error(`__getImage Error: ${filePath} does not exist`)
        const imageBuffer = await fs.promises.readFile(filePath)
        res.set('Content-Type', 'image/jpeg')
        
        if(width && height) return await sharp(imageBuffer).resize(parseInt(width), parseInt(height)).toFormat(JPEG).jpeg(JPEG_OPTIONS).pipe(res)
        return await sharp(imageBuffer).toFormat(JPEG).jpeg(JPEG_OPTIONS).pipe(res)
    } catch(err) {
        logger.info(`__getImage: ${err}`)
        return res.sendStatus(500)
    }
}

async function getArticleImage(res, imageName, width, height) {
    try {
        if(!imageName) throw new Error('GetArticleImages: Invalid Parameters', imageName)
        if(width && height) return await __getImage(res, imageName, ARTICLE, width, height)
        return await __getImage(res, imageName, ARTICLE)
    } catch(err) {
        logger.info(`GetArticleImage ${err}`)
        return res.sendStatus(500)
    }
}

async function setArticleContentImage(imageData) {
    try {
        if(!imageData) throw new Error('setContentImage: Invalid Parameters', imageData)
        const imageName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10).concat(`.${JPEG}`)
        const hasBeenSaved = await __saveImage(imageData, imageName, ARTICLE)
        if(hasBeenSaved) return imageName
        throw new Error('SetArticleContentImage: Couldn\'t Save Image')
    } catch(err) {
        return logger.info(`SetArticleContentImage: ${err}`)
    }
}

async function setArticleHeaderImage(headerData, linkId) {
    try {
        if(!headerData) throw new Error('setContentImage: Invalid Parameters', headerData)
        const article = await Article.findOne({link: linkId}).exec()
        article.headerUrl = createRandomString(ARTICLE_HEADER_IMAGENAME_LENGTH).concat(`.${JPEG}`)
        article.save()

        const hasBeenSaved = await __saveImage(headerData, article.headerUrl, ARTICLE)
        return hasBeenSaved
    } catch(err) {
        return logger.info(`SetArticleHeaderImage: ${err}`)
    }
}


async function getProfileImage(res, imageName, width = DEFAULT_IMAGE_WIDTH, height = DEFAULT_IMAGE_HEIGHT) {
    try {
        if(!imageName) throw new Error('getProfileImage Error: Invalid imageName: ', imageName)
        const user = await User.findOne({link: imageName}).exec()
        return __getImage(res, user.avatar, PROFILE, width, height)
    } catch(err) {
        logger.info('getProfileImage Error:' + err)
        return res.sendStatus(500)
    }
}

async function setProfileImage(link, image) {
    try {
        if(!link) throw new Error('getProfileImage Error: Invalid Param: ', link)
        const imageName = createRandomString(USER_PROFILE_IMAGENAME_LENGTH).concat(`.${JPEG}`)
        const user = await User.findOne({link}).exec()
        user.avatar = imageName
        user.save()

        return await __saveImage(image, imageName, PROFILE)
    } catch(err) {
        logger.info('setProfileImage Error:' + err)
        return res.sendStatus(500)
    }
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
            const articlesInCategory = articles.filter(article => article.category === category.key)
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

function createRandomString(length) {
    if(length <= 0 || !parseInt(length)) return
    return crypto.randomBytes(parseInt(length)).toString('hex')
}

async function removeOrphanedImages() {
    const dir = getImageDirectory(ARTICLE)
    const ls = await fs.promises.readdir(dir)
    const fileNames = ls.filter(file => file.includes(JPEG))
    fileNames.forEach(async filename => {
        try {
            let query = null
            if(filename.length === ARTICLE_HEADER_ID) query = {headerUrl: filename}
            else if(filename.length === ARTICLE_BODY_ID) query = {body: { $regex: filename, $options: 'i'}}
            if(!query) return
            const article = await Article.findOne(query).exec()
            if(!article) return await fs.promises.unlink(path.join(dir, filename))
        } catch(err) {
            logger.info(`RemoveOrphanedImages File Error: ${err}`)
        }
    })
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

function buildArticleSearchQuery(params, pageNumber) {
    const mongoQuery = {isApproved: true}
    if(!params) return Article.find(mongoQuery).sort('-createdAt').skip((PAGE_SIZE * pageNumber) - PAGE_SIZE).limit(PAGE_SIZE)
    if(params.category) {
        const isValidCategory = CATEGORIES_LIST.find(category => category.key === params.category)
        if(isValidCategory) mongoQuery.category = params.category
    }
    if(params.query) return Article.fuzzySearch(escapeRegex(params.query)).where(mongoQuery).skip((PAGE_SIZE * pageNumber) - PAGE_SIZE).limit(PAGE_SIZE)
    return Article.find(mongoQuery).sort('-createdAt').skip((PAGE_SIZE * pageNumber) - PAGE_SIZE).limit(PAGE_SIZE)
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
    if(typeof input === 'string') return input === 'true'
    if(typeof input === 'boolean') return input
}

module.exports = {
    getProfileImage,
    setProfileImage,
    getArticleImage,
    setArticleContentImage,
    setArticleHeaderImage,
    findCommonCategories,
    removeOrphanedImages,
    findTopStories,
    buildArticleSearchQuery,
    sendNewsletters,
    convertToBoolean
}
