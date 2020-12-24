const express = require('express')
const router = express.Router()
const Counter = require('../models/routeCounter')
const crypto = require('crypto')

router.post('/fingerprint', async (req, res) => {
    const {currentUrl, fingerprint} = req.body
    if(!currentUrl || !fingerprint || !isBase64(fingerprint)) return res.sendStatus(422) //Unprocessable Entity aka bad parameters
   
    try {
        const hashedFingerprint = hashFingerprint(fingerprint)
        const route = await Counter.findOne({url: currentUrl})
        if(!route) {
            await Counter.create({ url: currentUrl, viewCount: 1, visitedUsers: [hashedFingerprint]})
            return res.sendStatus(200)
        }

        const hasUserViewedRoute = route.visitedUsers.find(user => hashedFingerprint === user)
        if(hasUserViewedRoute) return res.sendStatus(200)
        
        route.visitedUsers.push(hashedFingerprint)
        route.viewCount++
        route.save({validateBeforeSave: true, validateModifiedOnly: true})
        return res.sendStatus(200)

    } catch(err) {
        console.log('Analytics Error:', err)
        return res.sendStatus(500)
    }
})

function isBase64(str) {
    //Base64 Length is always divisble by 4
    return str.length % 4 == 0 && /^[A-Za-z0-9+/]+[=]{0,3}$/.test(str)
}

function hashFingerprint(fingerprint) {
    const hashedFingerprint = crypto.createHash('sha256').update(fingerprint).digest('hex')
    return hashedFingerprint
}
module.exports = router