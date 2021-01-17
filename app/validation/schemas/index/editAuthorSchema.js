const joi = require('joi')
const {
    USERNAME_MAX_LENGTH,
    USERNAME_MIN_LENGTH,
    PASSWORD_MIN_LENGTH,
    PASSWORD_MAX_LENGTH,
    EMAIL_MIN_LENGTH,
    EMAIL_MAX_LENGTH
} = require('../../../staticdata/minmax.json').USER

module.exports = joi.object().keys({
    
})