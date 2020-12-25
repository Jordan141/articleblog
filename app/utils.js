const Article = require('./models/article')
const Counter = require('./models/routeCounter')
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const logger = require('./logger')
sharp.cache({files: 0})

const JPEG = 'jpeg', JPEG_OPTIONS = {force: true, chromaSubsampling: '4:4:4'}
const DEFAULT_IMAGE_WIDTH = 256, DEFAULT_IMAGE_HEIGHT = 256
const PROFILE = 'profile', ARTICLE = 'article'
const TOP_STORIES_COUNT = 3

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
        if(!imageName || !folder) throw new Error('__getImage Error: Invalid parameters: ', image, folder)
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

async function setArticleHeaderImage(headerData, headerName) {
    try {
        if(!headerData) throw new Error('setContentImage: Invalid Parameters', headerData)
        const hasBeenSaved = await __saveImage(headerData, headerName, ARTICLE)
        return hasBeenSaved
    } catch(err) {
        return logger.info(`SetArticleHeaderImage: ${err}`)
    }
}


async function getProfileImage(res, imageName, width = DEFAULT_IMAGE_WIDTH, height = DEFAULT_IMAGE_HEIGHT) {
    try {
        if(!imageName) throw new Error('getProfileImage Error: Invalid imageName: ', imageName)
        return __getImage(res, imageName, PROFILE, width, height)
    } catch(err) {
        logger.info('getProfileImage Error:' + err)
        return res.sendStatus(500)
    }
}

async function setProfileImage(username, image) {
    try {
        if(!username) throw new Error('getProfileImage Error: Invalid Username: ', username)
        const imageName = username.includes(JPEG) ? username : username.concat(`.${JPEG}`)
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
        const articleIds = topRoutes.map(route => route.articleId)
        const topArticles = await Article.find().where('_id').in(articleIds).exec()
        return topArticles
    } catch(err) {
        console.log('findTopStories:', err)
        return
    }
}

module.exports = {
    getProfileImage,
    setProfileImage,
    getArticleImage,
    setArticleContentImage,
    setArticleHeaderImage,
    findTopStories
}
