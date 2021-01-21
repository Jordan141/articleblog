const Joi = require('joi')
const {USERNAME_MAX_LENGTH, USERNAME_MIN_LENGTH} = require('../../../staticdata/minmax.json').USER

module.exports = Joi.object().keys({
    username: Joi.string().trim().min(USERNAME_MIN_LENGTH).max(USERNAME_MAX_LENGTH).alphanum().required()
})