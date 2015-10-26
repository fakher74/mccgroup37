var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var Schema   = mongoose.Schema;

// User model
var UserSchema = new Schema({

    local            : {
        username     : String,
        password     : String
    }

});

// generating a hash
UserSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
UserSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

var User = mongoose.model('User', UserSchema);

// Event model
var EventSchema   = new Schema({
    name: String,
    begin: Date,
    end: Date,
    location: String,
    description: String,
    owner: {type: String, ref : 'User'}
});

var Event = mongoose.model('Event', EventSchema);

// Export
module.exports = {
    Event: Event,
    User: User,
};
