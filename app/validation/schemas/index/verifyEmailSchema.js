const Joi = require('joi')
const TOKEN_LENGTH = 42

module.exports = Joi.object().keys({
    token: Joi.string().trim().length(TOKEN_LENGTH).required()
})