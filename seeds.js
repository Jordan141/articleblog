const Article = require('./models/article'),
      Comment = require('./models/comment'),
      User = require('./models/user')

function seedDB (){
    Article.remove({}, err => {
        if(err) {
            throw err;
        }
    })
    User.remove({}, err => {
        if(err) {
            throw err;
        }
    })
    Comment.remove({}, err => {
        if(err) {
            throw err;
        }
    })
}

module.exports = seedDB;