const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
sharp.cache({files: 0})

const JPEG = 'jpeg', JPEG_OPTIONS = {force: true, chromaSubsampling: '4:4:4'}
const DEFAULT_IMAGE_WIDTH = 256, DEFAULT_IMAGE_HEIGHT = 256
const PROFILE = 'profile', ARTICLE = 'article'

function getImageDirectory(folderName) {
    const URL = path.join(__dirname + '../../content', 'images', folderName)
    if(!fs.existsSync(URL)) {
        fs.mkdirSync(URL, {recursive: true})
    }
    return URL
}

async function hasIOPermissions(path) {
    if(!fs.existsSync(path)) throw new Error('Invalid Path Parameter: Path does not exist.')
    try {
        await fs.access(path, fs.constants.R_OK | fs.constants.W_OK)
        return true
    } catch(err) {
        fs.stat(path, (_, stats) => {
            console.log(
                'Invalid R/W Permissions on path:',
                path + '\n',
                '0' + (stats.mode & parseInt('777', 8)).toString(8)
            )
        })
        return false
    }
}

async function __saveImage(image, imageName, folder) {
    try {
        if(!image) throw new Error('Invalid Parameters on __saveImage: No Image Passed')
        const dirPath = getImageDirectory(folder)
        const hasPermissions = hasIOPermissions(dirPath)
        if(!hasPermissions) throw new Error('Error: __saveImage: Invalid Permissions')
        const filePath = path.join(dirPath, imageName)
        const imageInfo = await sharp(image.data).toFormat(JPEG).jpeg(JPEG_OPTIONS).toFile(filePath)
        return imageInfo
    } catch(err) {
        console.log(err)
        return false
    }
}

async function __getImage(res, imageName, folder, width = DEFAULT_IMAGE_WIDTH, height = DEFAULT_IMAGE_HEIGHT) {
    try {
        if(!imageName || !folder) throw Error('__getImage Error: Invalid parameters: ', image, folder)
        const dirPath = getImageDirectory(folder)
        const hasPermissions = hasIOPermissions(dirPath)

        if(!hasPermissions) throw Error('__getImage Error: Invalid Permission at: ' + dirPath)
        const filePath = path.join(dirPath, imageName)

        if(!fs.existsSync(filePath)) throw Error(`__getImage Error: ${filePath} does not exist`)
        
        const imageBuffer = await fs.promises.readFile(filePath)
        return await sharp(imageBuffer).resize(parseInt(width), parseInt(height)).toFormat(JPEG).jpeg(JPEG_OPTIONS).pipe(res)
    } catch(err) {
        console.log(err)
        return res.sendStatus(500)
    }
}


async function getProfileImage(res, username, width = DEFAULT_IMAGE_WIDTH, height = DEFAULT_IMAGE_HEIGHT) {
    try {
        console.log(width, height)
        if(!username) throw Error('getProfileImage Error: Invalid Username: ', username)
        const imageName = username.includes(JPEG) ? username : username.concat(`.${JPEG}`)
        return __getImage(res, imageName, PROFILE, width, height)
    } catch(err) {
        console.log('getProfileImage Error:', err)
        return res.sendStatus(500)
    }
}

async function setProfileImage(username, image) {
    try {
        if(!username) throw Error('getProfileImage Error: Invalid Username: ', username)
        const imageName = username.includes(JPEG) ? username : username.concat(`.${JPEG}`)
        return await __saveImage(image, imageName, PROFILE)
    } catch(err) {
        console.log('setProfileImage Error:', err)
        return res.sendStatus(500)
    }
}

module.exports = {
    getProfileImage,
    setProfileImage
}
