const Joi = require('joi')

module.exports = Joi.object().keys({
    fingerprint: Joi.string().base64().required(),
    currentUrl: Joi.string().uri({allowRelative: true, relativeOnly: true}).required()
})