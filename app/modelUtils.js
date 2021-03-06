const logger = require('./logger')
const Link = require('./models/link')

async function getLink(link, docType, docId, n = 1) {
    try {
        const newLink = n === 1 ? link : `${link}-${n}`
        const doc = await Link.findOne({link: newLink}).exec()
        if(!doc) {
            Link.create({link: newLink, docType, doc_id: docId})
            return link
        }
        return await getLink(link, docType, docId, n + 1)
    } catch(err) {
        logger.info(`getLink Error: ${err}`)
    }
}

module.exports = {
    getLink
}