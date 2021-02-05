const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const {generateCategoriesChecksum} = require('./utils')
const CHANGE_EVENTTYPE = 'change'

module.exports = () => {
    const categoryImagesDir = path.join(__dirname, 'app', 'public', 'assets', 'categories')
    fs.watch(categoryImagesDir, (eventType, filename) => {
        if(eventType !== CHANGE_EVENTTYPE) return
        logger.info(`Category image ${filename} has been changed.`)
        generateCategoriesChecksum()
    })
}