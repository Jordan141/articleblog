const Joi = require('joi')
const CATEGORIES_LIST = require('../../../staticdata/categories.json')

function categoryValidation(value, helpers) {
    const isValid = CATEGORIES_LIST.find(category => category.key === value)
    if(!isValid) return helpers.error('any.invalid')
    return value
}

module.exports = Joi.object().keys({
    category: Joi.string().custom(categoryValidation, "custom validation"),
    query: Joi.string().trim().lowercase(),
    page: Joi.number().integer().positive()
})