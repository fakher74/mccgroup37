var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var models = require('../app/models/models');
var User = models.User;

// use this function for authentication
module.exports = function(passport) {

	// serialize the user for the session
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    // deserialize the user
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });

 	// Signup
	passport.use('local-signup', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) {
		
		// check if the user trying to sign up already exists
        User.findOne({ 'local.username' :  username }, function(err, user) {
			
            if (err){
                return done(err);
			}

            if (user) {
                return done(null, false, req.flash('signupMessage', 'That username is already taken.'));
            } else {

                // create the user
                var newUser            = new User();

                // set the user's local credentials
                newUser.local.username = username;
                newUser.local.password = newUser.generateHash(password); // Hash the password with generatehash

				// save the user
                newUser.save(function(err) {
                    if (err)
                        throw err;
                    return done(null, newUser);
                });
            }

        });

    }));

    // Login
	passport.use('local-login', new LocalStrategy({
        usernameField : 'username',
        passwordField : 'password',
        passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, username, password, done) { 
		
        // checking if the user trying to login exists
        User.findOne({ 'local.username' :  username }, function(err, user) {
			
            if (err)
                return done(err);

            // if no user is found
            if (!user)
                return done(null, false, req.flash('loginMessage', 'No user found.')); // req.flash is the way to set flashdata using connect-flash

            // if the password is wrong
            if (!user.validPassword(password))
                return done(null, false, req.flash('loginMessage', 'Oops! Wrong password.')); // create the loginMessage and save it to session as flashdata

            // If all is ok
            return done(null, user);
        });

    }));

};
