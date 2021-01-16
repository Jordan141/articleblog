const express = require('express')
const router = express.Router()
const Counter = require('../models/routeCounter')
const crypto = require('crypto')

router.post('/fingerprint', async (req, res) => {
    const {currentUrl, fingerprint} = req.body

    try {
        const hashedFingerprint = hashFingerprint(fingerprint)
        const route = await Counter.findOne({url: currentUrl})
        if(!route) {
            const articleLink = currentUrl.replace('/articles/', '')
            if(!articleLink) return res.sendStatus(500)      
            await Counter.create({ url: currentUrl, viewCount: 1, visitedUsers: [hashedFingerprint], articleLink: articleLink})
            return res.sendStatus(200)
        }

        const hasUserViewedRoute = route.visitedUsers.find(user => hashedFingerprint === user)
        if(hasUserViewedRoute) return res.sendStatus(200)
        
        route.visitedUsers.push(hashedFingerprint)
        route.viewCount++
        route.save({validateBeforeSave: true, validateModifiedOnly: true})
        return res.sendStatus(200)

    } catch(err) {
        req.log('Analytics Error:', err)
        return res.sendStatus(500)
    }
})

function hashFingerprint(fingerprint) {
    const hashedFingerprint = crypto.createHash('sha256').update(fingerprint).digest('hex')
    return hashedFingerprint
}
module.exports = router