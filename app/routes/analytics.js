const express = require('express')
const router = express.Router()


router.post('/fingerprint', (req, res) => {
    const {currentUrl, fingerprint} = req.body
    if(!currentUrl || !fingerprint) return res.sendStatus(422) //Unprocessable Entity aka bad parameters

    console.log(currentUrl, fingerprint)
    return res.sendStatus(200)
})

module.exports = router