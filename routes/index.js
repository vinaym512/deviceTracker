var express = require('express');
var router = express.Router();
var expressValidator = require('express-validator');
var bcrypt = require('bcrypt');
const saltRounds = 10;
var passport = require('passport');
 
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', { title: 'Login' });
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
    var devicelocation;
    var mAuditDate;
    var fAuditDate;
    var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
    var loggedinUserName, loggedinUserEmail, isAdmin, isAuditor;
    
    const db = require('../db.js');
    db.query('SELECT users.username, users.email FROM users WHERE users.user_id = ?',[loggedinUserId], function(err, result, fields){
        if (err) throw err;
        if(result.length != 0){
            loggedinUserName    = result[0].username;
            loggedinUserEmail   = result[0].email;
        } 
    db.query('SELECT access_level FROM user_permissions WHERE username = ?',[loggedinUserName], function(err, result, fields){
        if (err) throw err;
        if(result.length != 0){
            if(result[0].access_level.toLowerCase()=='admin' || 'auditor' ) 
                isAuditor = true;
            if(result[0].access_level.toLowerCase()=='admin') 
                isAdmin = true;
    
        }
    db.query('SELECT DATE_FORMAT(max(audit_date), "%D %b %Y-%T") as audit_date FROM audit WHERE ?',[{location:'Martian'}], function(err, result, fields){
        if (err) throw err;
        else{
            if(result.length != 0) mAuditDate = result[0].audit_date;
        }
    db.query('SELECT DATE_FORMAT(max(audit_date), "%D %b %Y-%T") as audit_date FROM audit WHERE ?',[{location:'Foxsports'}], function(err, result, fields){
    if (err) throw err;
    else{
        if(result.length != 0) fAuditDate = result[0].audit_date;
        }
    db.query('SELECT a.device_id, b.user_id as userid, a.username, DATE_FORMAT(a.date_allocated, "%D %b %Y-%T") as date_allocated, a.username as instore, a.location as mlocation, a.location as flocation, a.os_version from device_allocation a, users b WHERE b.username = a.username order by device_id', function(err, result, fields){
        if (err) throw err;
        for(i = 0; i< result.length; ++i) {
            if(result[i].userid != loggedinUserId){
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
        console.log('-----------1-------------',loggedinUserName, isAdmin, isAuditor, mAuditDate, fAuditDate)
        res.render('profile', { title: 'Profile', deviceData: result, loggedUser:loggedinUserName, isAdmin, isAuditor, mAuditDate, fAuditDate});
    }); 
    });
    });
    }); 
    });  
});  
 



// router.get('/profile', authenticationMiddleware(), function(req, res, next) {
//     const errors = req.validationErrors();
//     var loggeduserId = JSON.stringify(req.user);
//     loggedinUserId = loggeduserId.slice(11, -1);
//     var devicelocation;
//     var loggedUserName;  
//     var mAuditDate;
//     var fAuditDate;
    
//     const db = require('../db.js');
//     db.query('SELECT username, email FROM users WHERE ?',[{user_id:loggedinUserId}], function(err, result, fields){
//         if (err) throw err;
//         loggedinUserName = result[0].username;
//         loggedinUserEmail = result[0].email;
//         console.log('----------------loggedinUserId2-----------',loggedinUserId)
//         console.log('----------------loggedinUserName2----------',loggedinUserName)
//         console.log('----------------loggedinUserEmail2---------',loggedinUserEmail)
        

//         db.query('SELECT access_level FROM user_permissions WHERE ?',[{username:loggedinUserName}], function(err, result, fields){
//                 if (err) throw err;
//                 else{
//                     if(result.length != 0){
//                         if(result[0].access_level.toLowerCase()=='admin' || 'auditor' ) isAuditor = true;
//                         if(result[0].access_level.toLowerCase()=='admin') isAdmin = true;
//                     }
//                 }
//                 console.log('----------------isAdmin-------------------',isAdmin)
//                 db.query('SELECT DATE_FORMAT(max(audit_date), "%D %b %Y-%T") as audit_date FROM audit WHERE ?',[{location:'Martian'}], function(err, result, fields){
//                 if (err) throw err;
//                 else{
//                     if(result.length != 0){
//                         mAuditDate = result[0].audit_date;
//                     }
//                 }
//             });
//                 db.query('SELECT DATE_FORMAT(max(audit_date), "%D %b %Y-%T") as audit_date FROM audit WHERE ?',[{location:'Foxsports'}], function(err, result, fields){
//                 if (err) throw err;
//                 else{
//                     if(result.length != 0) fAuditDate = result[0].audit_date;
//                 }
//             });
//         db.query('SELECT a.device_id, b.user_id as userid, a.username, DATE_FORMAT(a.date_allocated, "%D %b %Y-%T") as date_allocated, a.username as instore, a.location as mlocation, a.location as flocation, a.os_version from device_allocation a, users b WHERE b.username = a.username order by device_id', function(err, result, fields){
//             if (err) throw err;
//             for(i = 0; i< result.length; ++i) {
//               if(result[i].userid != loggedinUserId){
//                 result[i].userid = '';
//             }
//             if(result[i].instore != 'In-Store'){
//                 result[i].instore = '';
//             }
//             if(result[i].mlocation == 'Martian'){
//                 result[i].flocation  = '';
//             }else if(result[i].flocation == 'Foxsports'){
//                 result[i].mlocation  = '';
//             }
//         }
//         res.render('profile', { title: 'Profile', deviceData: result, loggedUser:loggedinUserName, isAdmin, isAuditor, mAuditDate, fAuditDate});
//     });  
//     });  
// });
//});


router.post('/book_device', authenticationMiddleware(), function(req, res, next) {
    
    var deviceIdStr= (JSON.stringify(req.body)).slice(13, -2);
    var dispUserNDevice = deviceIdStr.split("/");
    var dispDeviceId = dispUserNDevice[0];
    var dispUserName = dispUserNDevice[1];
    var status;
    var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
    var loggedinUserName, loggedinUserEmail, isAdmin1, isAuditor;
    const db = require('../db.js');
    
    db.query('SELECT users.username, users.email FROM users WHERE users.user_id = ?',[loggedinUserId], function(err, result, fields){
        if (err) throw err;
        console.log('-------------result-------------',result)
        if(result.length != 0){
            loggedinUserName    = result[0].username;
            loggedinUserEmail   = result[0].email;
        }
        if(loggedinUserName == dispUserName){
            db.query('UPDATE  device_allocation SET ? WHERE ? AND ?',[{username:'In-Store'},{username:loggedinUserName},{device_id:dispDeviceId}], function(err, result, fields){
                if (err) throw err;});
            status="RELEASED";
        }else{
            if(loggedinUserName != dispUserName && dispUserName === 'In-Store'){
                db.query('UPDATE  device_allocation SET ? WHERE ? AND ?',[{username:loggedinUserName},{username:'In-Store'},{device_id:dispDeviceId}], function(err, result, fields){
                    if (err) throw err; });
                status="AQUIRED";
            }
        }
        db.query('INSERT INTO device_transactions (device_id, username, status) VALUES (?, ?, ?)', [dispDeviceId, loggedinUserName, status], function(error, results, fields){
            if (error) throw error;
        });

        res.redirect('/profile');
    });
});


// router.post('/book_device', authenticationMiddleware(), function(req, res, next) {
    
//     var deviceIdStr= (JSON.stringify(req.body)).slice(13, -2);
//     var dispUserNDevice = deviceIdStr.split("/");
//     var dispDeviceId = dispUserNDevice[0];
//     var dispUserName = dispUserNDevice[1];
//     var status;
//     var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
//     var loggedinUserName, loggedinUserEmail, isAdmin1, isAuditor;
//     const db = require('../db.js');
//     db.query('SELECT users.username, users.email, user_permissions.access_level FROM users, user_permissions WHERE users.username = user_permissions.username AND ?',[{user_id:loggedinUserId}], function(err, result, fields){
//         if (err) throw err;
//         if(result.length != 0){
//             loggedinUserName = result[0].username;
//             loggedinUserEmail = result[0].email;
//             if(result[0].access_level.toLowerCase()=='admin' || 'auditor' ) 
//                 isAuditor = true;
//             if(result[0].access_level.toLowerCase()=='admin') 
//                 isAdmin1 = true;
//         //}
//         console.log('-------------loggedinUserId-------------',loggedinUserId)
//         console.log('-------------loggedinUserName-------------',loggedinUserName)
//         console.log('-------------loggedinUserEmail-------------',loggedinUserEmail)
//         console.log('-------------dispDeviceId-------------',dispDeviceId)
//         if(loggedinUserName == dispUserName){
//             db.query('UPDATE  device_allocation SET ? WHERE ? AND ?',[{username:'In-Store'},{username:loggedinUserName},{device_id:dispDeviceId}], function(err, result, fields){
//                 if (err) throw err;});
//             status="RELEASED";
//         }else{
//             if(loggedinUserName != dispUserName && dispUserName === 'In-Store'){
//                 db.query('UPDATE  device_allocation SET ? WHERE ? AND ?',[{username:loggedinUserName},{username:'In-Store'},{device_id:dispDeviceId}], function(err, result, fields){
//                     if (err) throw err; });
//                 status="AQUIRED";
//             }
//         }
//         db.query('INSERT INTO device_transactions (device_id, username, status) VALUES (?, ?, ?)', [dispDeviceId, loggedinUserName, status], function(error, results, fields){
//             if (error) throw error;
//         });

//         res.redirect('/profile');
//     }
// });
// });

/*update Audit status Martian*/    
router.post('/auditMartian', authenticationMiddleware(), function(req, res, next){
    var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
    const db = require('../db.js');
    db.query('INSERT INTO audit (username, status, location) VALUES ((SELECT username FROM users WHERE ?), ?, ?)', [{user_id:loggedinUserId}, 'COMPLETE', 'Martian'], function(error, results, fields){ 
        if (error) throw error;
    });
    res.redirect('/profile');
});

/*update Audit status Foxsports*/  
router.post('/auditFoxsports', authenticationMiddleware(), function(req, res, next){
    var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
    const db = require('../db.js');
    db.query('INSERT INTO audit (username, status, location) VALUES ((SELECT username FROM users WHERE ?), ?, ?)', [{user_id:loggedinUserId}, 'COMPLETE', 'Foxsports'], function(error, results, fields){ 
        if (error) throw error;
    });
    res.redirect('/profile');
});

router.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));

/* Get Reset Password page*/
router.get('/passwordreset', function(req, res, next) {
    var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
    var loggedinUserName, loggedinUserEmail, isAdmin1, isAuditor;
    const db = require('../db.js');
    db.query('SELECT users.username, users.email, user_permissions.access_level FROM users, user_permissions WHERE users.username = user_permissions.username AND ?',[{user_id:loggedinUserId}], function(err, result, fields){
        if (err) throw err;
        if(result.length != 0){
            loggedinUserName = result[0].username;
            loggedinUserEmail = result[0].email;
            if(result[0].access_level.toLowerCase()=='admin' || 'auditor' ) 
                isAuditor = true;
            if(result[0].access_level.toLowerCase()=='admin') 
                isAdmin1 = true;
        }
        res.render('passwordreset', { title: 'Password Reset', loggedinUserEmail});
    });
});

/* POST user changed password. */
router.post('/passwordreset', authenticationMiddleware(), function(req, res, next) {
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
});

//user setup
router.post('/usersetup', authenticationMiddleware(), function(req, res, next) {

    req.checkBody('username', 'Username field cannot be empty.').notEmpty();
    req.checkBody('username', 'Username must be between 4-15 characters long.').len(4, 15);
    req.checkBody('email', 'The email you entered is invalid, please try again.').isEmail();
    req.checkBody('email', 'Email address must be between 4-100 characters long, please try again.').len(4, 100);
    req.checkBody('confirmpassword', 'Passwords do not match, please try again.').equals(req.body.password);
    req.checkBody('username', 'Username can only contain letters, numbers, or underscores.').matches(/^[A-Za-z0-9_-]+$/, 'i');

    const errors = req.validationErrors();

    if (errors) {
        res.render('usersetup', {errors: errors});
    }
    const username = req.body.username;
    const email = req.body.email;
    const password = req.body.password;
    
    var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
    var loggedinUserName, loggedinUserEmail, isAdmin1, isAuditor;
    const db = require('../db.js');
    db.query('SELECT users.username, users.email, user_permissions.access_level FROM users, user_permissions WHERE users.username = user_permissions.username AND ?',[{user_id:loggedinUserId}], function(err, result, fields){
        if (err) throw err;
        if(result.length != 0){
            loggedinUserName = result[0].username;
            loggedinUserEmail = result[0].email;
            if(result[0].access_level.toLowerCase()=='admin' || 'auditor' ) 
                isAuditor = true;
            if(result[0].access_level.toLowerCase()=='admin') 
                isAdmin1 = true;
        }
    });

    //check if email id is already present?
    console.log('---------------isAdmin-----------',isAdmin)
    if(isAdmin1){
    db.query('SELECT email FROM users WHERE email = ?',[email], function(err, result, fields){
    if (err) {
        throw err;
        res.render('usersetup', {title:'Email not valid', errors: err});
    }
    else{
        if(result.length != 0){
            console.log('------------- User Already Exist------------------')
            res.render('usersetup', {title:'Email already Exist'});
        }else{
        bcrypt.hash(password, saltRounds, function(err, hash) {
        db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hash], function(error, results, fields){
        if (error) throw error;
            //res.redirect('/usersetup');
            res.render('usersetup', {title:'User SetUp... SUCCESS'});
        });
        });
        }
    }//else
    });
}else{
    res.render('usersetup', {title: 'User SetUp...FAILED - No admin rigths'});
}
});

//Device setup
router.post('/devicesetup', function(req, res, next) {

    const devicename = req.body.devicename;
    const deviceid = req.body.deviceid;
    const osversion = req.body.osversion;
    const devicelocation = req.body.location;
    
    var loggedinUserId = (JSON.stringify(req.user)).slice(11, -1);
    var loggedinUserName, loggedinUserEmail, isAdmin1, isAuditor;
    const db = require('../db.js');
    db.query('SELECT users.username, users.email, user_permissions.access_level FROM users, user_permissions WHERE users.username = user_permissions.username AND ?',[{user_id:loggedinUserId}], function(err, result, fields){
        if (err) throw err;
        if(result.length != 0){
            loggedinUserName = result[0].username;
            loggedinUserEmail = result[0].email;
            if(result[0].access_level.toLowerCase()=='admin' || 'auditor' ) 
                isAuditor = true;
            if(result[0].access_level.toLowerCase()=='admin') 
                isAdmin1 = true;
        }
    });

    //check if email id is already present?
    if(isAdmin1){
    db.query('SELECT device_id FROM device_allocation WHERE device_id = ?',[deviceid], function(err, result, fields){
    if (err) {
        throw err;
        res.render('devicesetup', {title:'devicesetup', errors: err});
    }
    else{
        if(result.length == 0){
        db.query('INSERT INTO device_allocation (device_id, device_name, location, os_version) VALUES (?, ?, ?, ?)', [deviceid, devicename, devicelocation, osversion], function(error, results, fields){
        if (error) throw error;
            res.redirect('/devicesetup');
        });
        }else{
            db.query('UPDATE  device_allocation SET ?, ?, ?, ? WHERE ?',[{device_name:devicename}, {location:devicelocation}, {os_version:osversion},{device_id:deviceid}], function(error, result, fields){
            if (error) throw error;
                res.redirect('/devicesetup');
        });      
        }
    }//else
});
}else{
    res.render('devicesetup', {title:'Device SetUp...FAILED - No admin rigths'});
}
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
        res.render('login', {title:'You are not logged-in'});
    }
    }


}
   
module.exports = router;
