var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
var bcrypt = require('bcrypt');
const saltRounds = 10;
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Login failed' });
});

router.get('/login', function(req, res, next) {
    console.log('------In GET Login------');
    res.render('login', { title: 'Login' });
});

router.get('/devicesetup',authenticationMiddleware(), function(req, res, next) {
    res.render('devicesetup', { title: 'DeviceSetup' });
});

router.get('/usersetup',authenticationMiddleware(), function(req, res, next) {
    res.render('usersetup', { title: 'UserSetup' });
});

router.get('/profile', authenticationMiddleware(), function(req, res, next) {
    const errors = req.validationErrors();
    var loggeduserId = JSON.stringify(req.user);
    var loggeduserIdStr = loggeduserId.slice(11, -1);
    var devicelocation;
    var loggedUserName;  
    
    const db = require('../db.js');

    // if (errors) {
    //    //res.render('register', {title:'DB connection issues', errors: errors});
    // }
    //else{
        db.query('SELECT username FROM users WHERE ?',[{user_id:loggeduserIdStr}], function(err, result, fields){
        if (err) throw err;
          loggedUserName = result[0].username;
        });
        db.query('SELECT a.device_id, b.user_id as userid, a.username, a.date_allocated, a.username as instore, a.location as mlocation, a.location as flocation, a.os_version from device_allocation a, users b WHERE b.username = a.username order by device_id', function(err, result, fields){
        if (err) throw err;
        for(i = 0; i< result.length; ++i) {
          if(result[i].userid != loggeduserIdStr){
            result[i].userid = '';
          }
          if(result[i].instore != 'In-Store'){
            result[i].instore = '';
          }
          if(result[i].mlocation == 'Martian'){
            result[i].flocation  = '';
            }else if(result[i].flocation == 'Foxsports'){
            result[i].mlocation  = '';
          }
        }
        //res.render('profile', { title: 'Profile', deviceData: result, location: devicelocation, loggedUser:loggedUserName});
        res.render('profile', { title: 'Profile', deviceData: result, loggedUser:loggedUserName});
    });
   // };
});


router.post('/book_device', authenticationMiddleware(), function(req, res, next) {
    var loggedinUserId = req.user;
    var loggedinUserName;
    var deviceId = JSON.stringify(req.body);
    var deviceIdStr = deviceId.slice(13, -2);
    var dispUserNDevice = deviceIdStr.split("/");
    var dispDeviceId = dispUserNDevice[0];
    var dispUserName = dispUserNDevice[1];
    
    const db = require('../db.js');
    db.query('SELECT username FROM users WHERE ?',[loggedinUserId], function(err, result, fields){
        if (err) {
            throw err;
        }else{
            loggedinUserName = result[0].username;
            if(loggedinUserName == dispUserName){
                db.query('UPDATE  device_allocation SET ? WHERE ? AND ?',[{username:'In-Store'},{username:loggedinUserName},{device_id:dispDeviceId}], function(err, result, fields){
                if (err) throw err;
                });
            };
            if(loggedinUserName != dispUserName && dispUserName === 'In-Store'){
                db.query('UPDATE  device_allocation SET ? WHERE ? AND ?',[{username:loggedinUserName},{username:'In-Store'},{device_id:dispDeviceId}], function(err, result, fields){
                if (err) throw err;
                });
            };
        }     
    });
    res.redirect('/profile');
});
    
router.post('/profile', authenticationMiddleware(), function(req, res, next){

    //const errors = req.validationErrors();
    var user =  JSON.stringify(req.session.passport);
    var device = req.device_id;
    
    const db = require('../db.js');
    if (errors) {
        res.render('profile', {errors: errors});
    }
    res.redirect('/profile');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));


/* Get Reset Password page*/
router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Registration' });
});

/* POST user changed password. */
router.post('/register', function(req, res, next) {

    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('password', 'Password must be between 8-100 characters long.').len(8, 100);
    req.checkBody('confirmpassword', 'Passwords do not match, please try again.').equals(req.body.password);
    
    const errors = req.validationErrors();

    if (errors) {
        console.log(`errors: ${JSON.stringify(errors)}`);
        res.render('register', {title:'Register', errors: errors});
    }
    else{
        const email = req.body.email;
        const password = req.body.password;
        const db = require('../db.js');

    //check if email id is already present?
        db.query('SELECT email FROM users WHERE ?',[email], function(err, result, fields){
        if (err) {
            throw err;
            console.log(`errors: ${JSON.stringify(err)}`);
            res.render('register', {title:'Email not valid', errors: err});
        }
        else{
            bcrypt.hash(password, saltRounds, function(err, hash) {
            db.query('UPDATE users SET ? WHERE ?', [{ password: hash }, { email: email }], function(error, results, fields){
            if (error) throw error;
                res.redirect('/profile');
            });
            });
        }//else
    });
    }
});

//user setup
router.post('/usersetup', function(req, res, next) {

    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('confirmpassword', 'Passwords do not match, please try again.').equals(req.body.password);
    req.checkBody('username', 'Username can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i');

    const errors = req.validationErrors();

    if (errors) {
        console.log(`errors: ${JSON.stringify(errors)}`);
        res.render('usersetup', {errors: errors});
    }
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    const db = require('../db.js');

    //check if email id is already present?
    db.query('SELECT email FROM users WHERE ?',[email], function(err, result, fields){
    if (err) {
        throw err;
        console.log(`errors: ${JSON.stringify(err)}`);
        res.render('register', {title:'Email not valid', errors: err});
    }
    else{
        bcrypt.hash(password, saltRounds, function(err, hash) {
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], function(error, results, fields){
        if (error) throw error;
            res.redirect('/profile');
        });
    });
    }//else
    });
});

//Device setup
router.post('/devicesetup', function(req, res, next) {

    const devicename = req.body.devicename;
    const deviceid = req.body.deviceid;
    const osversion = req.body.osversion;
    const devicelocation = req.body.location;
    const db = require('../db.js');

    //check if email id is already present?
    db.query('SELECT device_id FROM device_allocation WHERE ?',[deviceid], function(err, result, fields){
    if (err) {
        throw err;
        console.log(`----------- In error ----------`);
        console.log(`errors: ${JSON.stringify(err)}`);
        res.render('devicesetup', {title:'devicesetup', errors: err});
    }
    else{
        console.log(`----------- Result ----------`, result.length);
        if(result.length == 0){
         console.log(`----------- In insert ----------`);
        db.query('INSERT INTO device_allocation (device_id, device_name, location, os_version) VALUES (?, ?, ?, ?)', [deviceid, devicename, devicelocation, osversion], function(error, results, fields){
        if (error) throw error;
            res.redirect('/profile');
        });
        }else{
            console.log(`----------- In update ----------`);
        db.query('UPDATE  device_allocation SET ?, ?, ?, ? WHERE ?',[{device_name:devicename}, {location:devicelocation}, {os_version:osversion},{device_id:deviceid}], function(error, result, fields){
          if (error) throw error;
            res.redirect('/devicesetup');
        });      
        }
    }//else
});
});





router.get('/logout', function(req, res, next) {
    req.logout();
    req.session.destroy();
    res.redirect('/login');
});   

    passport.serializeUser(function(user_id, done) {
        done(null, user_id);
    });

    passport.deserializeUser(function(user_id, done) {
        done(null, user_id);
      });

    function authenticationMiddleware() {  
        return (req, res, next) => {
        console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

        if (req.isAuthenticated()){ return next();
        res.redirect('/login');
    }else{
        res.render('login', {title:'Login failed from auth'});
    }
    }
}
   
module.exports = router;
