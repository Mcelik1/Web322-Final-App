const mongoose = require('mongoose');
let Schema = mongoose.Schema;

mongoose.Promise = global.Promise;


//user schema to hold usernames and passwords
var userSchema = new Schema({
    "user": {type: String, unique: true},
    "password": String
});


var Comment; 

var URL = "mongodb://mcelik1:password1@ds163806.mlab.com:63806/webapp_a6"

module.exports.initialize = () => {
    console.log("=====MongoDB Auth======");
    console.log("\n")
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(URL);
        db.on('error', (err) => {
            reject(err); 
        });
        db.once('open', () => {
            Comment = db.model("users", userSchema);
            resolve("MondoDB Successfully Initialized");
        });
    });
};

module.exports.registerUser = (userData) => {
    console.log("=====Register User:======");
    console.log("\n")
    return new Promise((resolve, reject) => {
        if (userData.password != userData.password2) {
            reject("Passwords do not match, please enter again!");
        } else {
        let newUser = new Comment(userData);
        newUser.save((err) => {
            console.log("===   Object is saving in the database.  ===");
            console.log(userData);
            console.log("The following ID was added: " + newUser._id);
            resolve();
        }).catch((err) => {
            if (err) {
                if (err.code == 11000) {
                    reject("User Name is already taken!");
                } else {
                    reject("There was an error creating the user: ${user}");
                }
            }
            
        });
    }});
}

module.exports.checkUser = (userData) =>{
    console.log("=====Checking user function!======");
    console.log("\n")
    
    return new Promise((resolve, reject) => {
        Comment.find({user: userData.user}).exec().then((user) => {
        console.log("Success!" + user);
        if (user == null) {
            reject('Unable to find user: ' + userData.user);
        } else if (user[0].password != userData.password) {
            reject('Incorrect Password for user: ' + user[0].user);
        }
        resolve();
        }).catch((err) => {
            console.log(chalk.bgCyan("Error: Unable to find user!"));
            reject("Unable to find user: " + userData.user);
        });
    });
};