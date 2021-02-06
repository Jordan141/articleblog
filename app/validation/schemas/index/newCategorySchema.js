const Joi = require('joi')
const CATEGORIES = require('../../../staticdata/categories.json')

function categoryAlreadyExists(value, helpers) {
    const dupeKeyCheck = CATEGORIES.filter(category => category.key === value).length > 0
    const dupeDisplayCheck = CATEGORIES.filter(category => category.displayValue === value).length > 0

    if(dupeKeyCheck) return helpers.message('Category key already exists!')
    if(dupeDisplayCheck) return helpers.message('Category display value already exists!')
    return value
}

module.exports = Joi.object().keys({
    key: Joi.string().trim().min(2).alphanum().custom(categoryAlreadyExists).required(),
    displayValue: Joi.string().trim().min(2).custom(categoryAlreadyExists).required()
})