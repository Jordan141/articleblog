const Joi = require('joi')
const {EMAIL_MAX_LENGTH, EMAIL_MIN_LENGTH} = require('../../../staticdata/minmax.json').USER

module.exports = Joi.object().keys({
    email: Joi.string().email().trim().min(EMAIL_MIN_LENGTH).max(EMAIL_MAX_LENGTH).required()
})