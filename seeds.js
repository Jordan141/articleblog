const Article = require('./models/article'),
      Comment = require('./models/comment'),
      User = require('./models/user')

function seedDB (){
    Article.remove({}, err => {
        if(err) {
            throw err;
        }
        
        // data.forEach(seed => Campground.create(seed, (err, campground) => {
        //     if(err) {
        //         throw err;
        //     }
        //     Comment.create(
        //         {
        //             text: 'This place is great, but I wish there was internet!',
        //             author: 'Homer'
        //         },
        //         (err, comment) => {
        //             if(err){
        //                 throw err;
        //             } else {
        //             campground.comments.push(comment)
        //             campground.save()
        //             }
        //         })
        //     })
        // )
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