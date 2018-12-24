const mongoose = require('mongoose');
let Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

var Comment;

//create a place holder for the URL 
var URL= "mongodb://mcelik1:password1@ds163806.mlab.com:63806/webapp_a6";


var contentSchema = new Schema({
    "authorName": String,
    "authorEmail": String,
    "subject": String,
    "postedDate": Date,
    "commentText": String,
     "replies": {
         "_id": String,
        "comment_id": String,
        "authorName": String,
        "authorEmail": String,
        "commentText": String,
        "repliedDate": Date
     }
});

module.exports.initialize = () => {
    
console.log("===   Initializing Database!     ===");
console.log("\n")

    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(URL);
        db.on('error', (err) => {
            reject(err); 
        });
        db.once('open', () => {
            Comment = db.model("contentSchema", contentSchema);
            resolve("Database Initialized");
        });
    });
};

module.exports.addComment = (data) => {
  
    data.postedDate = Date.now();
    return new Promise((resolve, reject) => {
        var newComment = new Comment(data);
        newComment.save((err) => {
            if(err) {
                reject("There was an error saving the comment: ${err}");
            } else {
                resolve(newComment._id);
            }
        });
    });
};
module.exports.getAllComments = () => {
    
    return new Promise((resolve, reject) => {
        Comment.find().sort({postedDate:1}).exec().then((data) => {
            resolve(data);
        }).catch((err) => {
            console.log('There was an error: ${err}');
        });
    });
};

module.exports.addReply = (data) => {
   
    data.repliedDate = Date.now();
    
    return new Promise((resolve, reject) => {
        if (data._id == data.comment_id) {
            Comment.update({ _id: data.comment_id},
            { $addToSet: { replies: data}},{ multi: false }).exec();
            resolve(data);
        }
    }).catch((err) => {
        reject("Error!");
    });
};
