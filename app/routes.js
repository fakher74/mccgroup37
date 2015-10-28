var models = require('../app/models/models');
var Event = models.Event;
var User = models.User;
var checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");

module.exports = function(app, passport) {


	// =====================================
	// LOGIN ===============================
	// =====================================
	// show the login form
	app.get('/login', function(req, res) {
		res.render('login.ejs', { message: req.flash('loginMessage') });
	});

	// process the login form
	app.post('/login', passport.authenticate('local-login', {
		successRedirect : '/home', // redirect to /
		failureRedirect : '/login', // redirect back to the login if there is an error
		failureFlash : true // allow flash messages
	}));
	
	app.get('/test', function(req, res) {
		res.sendfile('calendar_template.html');
	});

	// =====================================
	// SIGNUP ==============================
	// =====================================
	// show the signup form
	app.get('/signup', function(req, res) {
		res.render('signup.ejs', { message: req.flash('signupMessage') });
	});

	// process the signup form
	app.post('/signup', passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to /
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	
	// =====================================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
        
        app.get('/home',isLoggedIn, function(req,res){
               
                 var static_dir = './static/';
       		res.sendfile(static_dir + '/base.html');
        }); 
	
	// =====================================
	// REST ================================
	// =====================================
	
	// Query events that belong to the user
	app.get('/', isLoggedIn, function(req, res) {
		
		// get username
		var username = getUsername(req);
    	
		// read query string (if it exists) and create queries
		var name = req.query.name;
		var begin = req.query.begin;
		var end = req.query.end;
		var location = req.query.location;
		var namequery, beginquery, endquery, locationquery;
		
		if (typeof name == 'undefined')
			namequery = {};
		else
			namequery = {name: name};
		if (typeof end == 'undefined')
			beginquery = {};
		else
			beginquery = {begin: { "$lt": new Date(end) }};
		if (typeof begin == 'undefined')
			endquery = {end: { "$gt": new Date() }};
		else
			endquery = {end: { "$gt": new Date(begin) }};
		if (typeof location == 'undefined')
			locationquery = {};
		else
			locationquery = {location: location};
		
		// query events
		Event.find({owner: username}).find(locationquery).find(namequery).find(beginquery).find(endquery, function(err, results){
			if (err) res.send(err);
			res.json(results);
		});
	});
	
	// create event
	app.post('/', isLoggedIn, function(req, res){
		
		// get username
		var username = getUsername(req);
		
		// check if required fields are specified
		if (typeof req.headers.name == 'undefined' || typeof req.headers.begin == 'undefined' || typeof req.headers.end == 'undefined') {
			res.json({ message: 'Required field(s) not specified' });
			return;
		}
		
		// check if date format is correct
		var begin_test = new Date(req.headers.begin);
		var end_test = new Date(req.headers.end);
		if (begin_test == "Invalid Date" || end_test == "Invalid Date") {
			res.json({ message: "Invalid date format" });
			return;
		}
		
		// check if end and begin time are in the correct order
		else if(req.headers.end <= req.headers.begin){
			res.json({ message: "Begin time shouldn't be after end time" });
			return;
		}
		
		// create new event
		var event = new Event();
		event.name = req.headers.name;
		event.begin = req.headers.begin;
		event.end = req.headers.end;
		event.location = req.headers.location;
		event.description = req.headers.description;
		event.owner = username;
		
		// save changes
		event.save(function(err) {
			if (err) res.send(err);
			res.json({message: "event created"});
		});
		
	});
	
	// get event with id specified in URL 
	app.get('/:event_id', isLoggedIn, function(req, res){
		
		// get username
		var username = getUsername(req);
		
		// check if event id in correct format
		if (!checkForHexRegExp.test(req.params.event_id)){
			res.json({ message: 'event not found' });
			return;
		}
		
		// find event
		Event.findById(req.params.event_id, function(err, event) {
			if (err) 
				res.send(err);
			else if (!event) // check if event with the id exists
				res.json({message: "event not found"});
			else if (event.owner != username) // check if user has the right to view
				res.json({message: 'not authorized'});
			else
				res.json(event);
		});
	});
	
	// delete an event
	app.delete('/:event_id', isLoggedIn, function(req, res){
		
		// get username
		var username = getUsername(req);
		
		// check if event id is in correct format
		if (!checkForHexRegExp.test(req.params.event_id)){
			res.json({ message: 'event not found' });
			return;
		}
		
		// find event
		Event.findById(req.params.event_id, function(err, event) {
			if (err) 
				res.send(err);
			else if (!event) // check if event exists
				res.json({message: 'event not found'});
			else if (event.owner != username) // check if user has the right to delete
				res.json({message: 'not authorized'});
			else {
				// remove the event
				Event.remove({_id: req.params.event_id}, function(err) {
					if (err) res.send(err);
					res.json({message: 'event removed'});
				});
			}	
		});
	});
	
	// modify event with id specified in the url
    app.put('/:event_id', isLoggedIn, function(req, res){
		
		// get username
		var username = getUsername(req);
		
		// check if event id is in correct format
		if (!checkForHexRegExp.test(req.params.event_id)){
			res.json({ message: 'event not found' });
			return;
		} 
		
		// find the event
		Event.findById(req.params.event_id, function(err, event) {
			if (err)  
				res.send(err);
			else if (!event) // check if event exists
				res.json({message: 'event not found'});
			else if (event.owner != username) // check if user has the right to modify
				res.json({message: 'not authorized'});
			else {
				
				var name = req.headers.name;
				var begin = req.headers.begin;
				var end = req.headers.end;
				var description = req.headers.description;
				var location = req.headers.location;
				
				// check date format
				var begin_test = new Date(req.headers.begin);
				var end_test = new Date(req.headers.end);
				if ((typeof begin != 'undefined' && begin_test == "Invalid Date") || (typeof end != 'undefined' && end_test == "Invalid Date")) {
					res.json({ message: "Invalid date format" });
					return;
				}
				
				// assign new values
				if (typeof name != 'undefined')
					event.name = name;
				if (typeof begin != 'undefined')
					event.begin = begin;
				if (typeof end != 'undefined')
					event.end = end;
				if (typeof description != 'undefined')
					event.description = description;
				if (typeof location != 'undefined')
					event.location = location;
				
				// check if end is before begin
				if (event.end <= event.begin) {
					res.json({ message: "Begin time shouldn't be after end time" });
					return;
				}
				
				// save changes
				event.save(function(err) {
					if (err) res.send(err);
					res.json({message: 'event updated'});
				});
			}
		});
	}); // app.put(/:event_id, ...)
	
}; // module.exports( ...


function getUsername(req) {
	var username = req.user.local.username;
	if (!username) { username = req.user.username; }
	
	return username;
}

// route middleware to make sure
function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the home page
	res.redirect('/login');
}
