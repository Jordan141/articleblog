const Article = require('./models/article'),
      Comment = require('./models/comment'),
      User = require('./models/user')
const lorem = '';
const data = [
    {
        name: 'Cloud\'s Rest',
        image: 'https://farm8.staticflickr.com/7252/7626464792_3e68c2a6a5.jpg',
        description: lorem
    },
    {
        name: 'Mountain Creek',
        image: 'https://farm6.staticflickr.com/5181/5641024448_04fefbb64d.jpg',
        description: lorem
    },
    {
        name: 'Granite Hill',
        image: 'https://farm5.staticflickr.com/4137/4812576807_8ba9255f38.jpg',
        description: lorem
    },
    {
        name: 'Eagle Rock',
        image: 'https://farm5.staticflickr.com/4153/4835814837_feef6f969b.jpg',
        description: lorem
    },
    {
        name: 'Steele Valley',
        image: 'https://farm4.staticflickr.com/3270/2617191414_c5d8a25a94.jpg',
        description: lorem
    }
]
function seedDB (){
    Campground.remove({}, err => {
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