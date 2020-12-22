const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
sharp.cache({files: 0})

const JPEG = 'jpeg', JPEG_OPTIONS = {force: true, chromaSubsampling: '4:4:4'}

function getImageDirectory(folderName) {
    const URL = path.join(__dirname + '../../content', 'images', folderName)
    if(!fs.existsSync(URL)) {
        fs.mkdirSync(URL, {recursive: true})
    }
    return URL
}

async function hasIOPermissions(path) {
    if(!fs.existsSync(path)) throw Error('Invalid Path Parameter: Path does not exist.')
    try {
        await fs.access(path, fs.constants.R_OK | fs.constants.W_OK)
        return true
    } catch(err) {
        fs.stat(path, (_, stats) => {
            console.log(
                'Invalid RW Permissions on path:',
                path + '\n',
                '0' + (stats.mode & parseInt('777', 8)).toString(8)
            )
        })
        return false
    }
}

async function __saveImage(image, imageName, folder) {
    try {
        if(!image) throw Error('Invalid Parameters on __saveImage: No Image Passed')
        const dirPath = getImageDirectory(folder)
        const hasPermissions = hasIOPermissions(dirPath)
        if(!hasPermissions) throw Error('Error: __saveImage: Invalid Permissions')
        const filePath = path.join(dirPath, imageName)
        const imageInfo = await sharp(image.data).toFormat(JPEG).jpeg(JPEG_OPTIONS).toFile(filePath)
        return imageInfo
    } catch(err) {
        console.log(err)
        return false
    }
}

function __getImage() {

}

