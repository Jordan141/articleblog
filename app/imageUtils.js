const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const crypto = require('crypto')
const User = require('./models/user')
const logger = require('./logger')
const Article = require('./models/article')

const THREAD_COUNT = require('os').cpus().length
const PROFILE = 'profile', ARTICLE = 'article'
const USER_PROFILE_IMAGENAME_LENGTH = 12
const ARTICLE_HEADER_IMAGENAME_LENGTH = 16, ARTICLE_HEADER_ID = 37, ARTICLE_BODY_ID = 14
const HEADER_IMAGE_SIZES = ["400", "650", "864", "1024", "1920", "2048"]
const CONTENT_IMAGE_SIZES = ["650", "400"]
const PROFILE_IMAGE_SIZES = ["112", "400", "600", "650"]
const WEBP_MIMETYPE = 'image/webp', JPEG_MIMETYPE = 'image/jpeg'
const JPEG = 'jpeg', JPEG_OPTIONS = {chromaSubsampling: '4:4:4'}
const WEBP = 'webp', WEBP_OPTIONS = {}
sharp.cache({files: 0})
sharp.concurrency(THREAD_COUNT)
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

function createRandomString(length) {
    if(length <= 0 || !parseInt(length)) return
    return crypto.randomBytes(parseInt(length)).toString('hex')
}

async function __saveImage(image, imageName, folder, imageWidths) {
    try {
        if(!image) throw new Error('Invalid Parameters on __saveImage: No Image Passed')
        const webpImages = await createImages(image, imageName, imageWidths, folder, WEBP)
        const jpegImages = await createImages(image, imageName, imageWidths, folder, JPEG)
        const allImagesSaved = [...webpImages, ...jpegImages].every(result => !!result)
        return allImagesSaved
    } catch(err) {
        logger.info(`Save Image: ${err}`)
    }
}

async function createImages(image, imageName, imageWidths, folder, format) {
    const responses = []
    for(let width of imageWidths) {
        const dirPath = getImageDirectory(path.join(folder, width))
        const hasPermissions = await hasIOPermissions(dirPath)
        if(!hasPermissions) throw new Error(`Error: Invalid Permissions at ${dirPath}`)
        responses.push(await __saveImageToFile(image, `${imageName}.${format}`, dirPath, parseInt(width), format))
    }
    return responses
}
async function __saveImageToFile(image, imageName, dirPath, width, format) {
    const filePath = path.join(dirPath, imageName)
    if(format === WEBP) return await sharp(image.data).resize({width}).webp(WEBP_OPTIONS).toFile(filePath)
    return await sharp(image.data).resize({width}).jpeg(JPEG_OPTIONS).toFile(filePath)
}
async function __getImage(res, imageName, folder, webpFormat, width) {
    try {
        if(!imageName || !folder) throw new Error('Error: Invalid parameters: ', imageName, folder)
        const imageFormat = webpFormat ? WEBP : JPEG
        const mimeType = webpFormat ? WEBP_MIMETYPE : JPEG_MIMETYPE

        const dirPath = getImageDirectory(path.join(folder, width))
        const hasPerms = await hasIOPermissions(dirPath)
        if(!hasPerms) throw new Error(`Invalid R/W Permissions at ${dirPath}`)
        
        const filePath = path.join(dirPath, `${imageName}.${imageFormat}`)
        if(!fs.existsSync(filePath)) throw new Error(`Error: ${filePath} does not exist`)
        const imageBuffer = await fs.promises.readFile(filePath)
        res.set('Content-Type', mimeType)
        return res.send(imageBuffer)
    } catch(err) {
        logger.info(`__getImage: ${err}`)
        return res.sendStatus(400)
    }
}

async function getArticleImage(res, imageName, webpFormat, width) {
    try {
        if(!imageName) throw new Error('GetArticleImages: Invalid Parameters', imageName)
        return await __getImage(res, imageName, ARTICLE, webpFormat, width)
    } catch(err) {
        logger.info(`GetArticleImage ${err}`)
        return res.sendStatus(500)
    }
}

async function setArticleContentImage(imageData) {
    try {
        if(!imageData) throw new Error('setContentImage: Invalid Parameters', imageData)
        const imageName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10).concat(`.${JPEG}`)
        const hasBeenSaved = await __saveImage(imageData, imageName, ARTICLE, CONTENT_IMAGE_SIZES)
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
        article.headerUrl = createRandomString(ARTICLE_HEADER_IMAGENAME_LENGTH)
        article.save()
        return await __saveImage(headerData, article.headerUrl, ARTICLE, HEADER_IMAGE_SIZES)
    } catch(err) {
        return logger.info(`SetArticleHeaderImage: ${err}`)
    }
}

async function getProfileImage(res, imageName, format, width) {
    try {
        if(!imageName) throw new Error('getProfileImage Error: Invalid imageName: ', imageName)
        const user = await User.findOne({link: imageName}).exec()
        return __getImage(res, user.avatar, PROFILE, format, width)
    } catch(err) {
        logger.info('getProfileImage Error:' + err)
        return res.sendStatus(500)
    }
}

async function setProfileImage(link, image) {
    try {
        if(!link) throw new Error('getProfileImage Error: Invalid Param: ', link)
        const imageName = createRandomString(USER_PROFILE_IMAGENAME_LENGTH)
        const user = await User.findOne({link}).exec()
        user.avatar = imageName
        user.save()
        return await __saveImage(image, imageName, PROFILE, PROFILE_IMAGE_SIZES)
    } catch(err) {
        logger.info('setProfileImage Error:' + err)
        return res.sendStatus(500)
    }
}

async function removeOrphanedArticleImages() {
    try {
        const dir = getImageDirectory(ARTICLE)
        const ls = await fs.promises.readdir(dir)
        const dirNames = ls.filter(name => parseInt(name))
        for(let currentDir of dirNames) {
            const currentPath = path.join(dir, currentDir)
            const images = await fs.promises.readdir(currentPath)
            for(let currentImage of images) {
                let query = null
                if(currentImage.length === ARTICLE_HEADER_ID) query = {headerUrl: currentImage}
                else if(currentImage.length === ARTICLE_BODY_ID) query = {body: { $regex: currentImage, $options: 'i'}}
                if(!query) continue
                const article = await Article.findOne(query).exec()
                if(!article) await fs.promises.unlink(path.join(currentPath, currentImage))
            }
        }
    } catch(err) {
        logger.info(`RemoveOrphanedImages Error: ${err}`)
    }
}


async function removeOrphanedProfileImages() {
    try {
        const dir = getImageDirectory(PROFILE)
        const ls = await fs.promises.readdir(dir)
        const dirNames = ls.filter(name => parseInt(name))
        for(let currentDir of dirNames) {
            const currentPath = path.join(dir, currentDir)
            const images = await fs.promises.readdir(currentPath)
            for(let currentImage of images) {
                const currentImageName = currentImage.split('.')[0]
                const user = await User.findOne({avatar: currentImageName}).exec()
                if(user) continue
                await fs.promises.unlink(path.join(currentPath, currentImage))
            }
        }
    } catch(err) {
        logger.info(`RemoveOrphanedImages Error: ${err}`)
    }
}

async function removeOrphanedImages() {
    await removeOrphanedArticleImages()
    await removeOrphanedProfileImages()
}
module.exports = {
    removeOrphanedImages,
    getArticleImage,
    getProfileImage,
    setArticleHeaderImage,
    setArticleContentImage,
    setProfileImage
}