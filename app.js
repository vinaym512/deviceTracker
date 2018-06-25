var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var expressValidator = require('express-validator');
var bcrypt = require('bcrypt');


//authentication package
var session = require('express-session');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;



var index = require('./routes/index');
var users = require('./routes/users');
var register = require('./routes/index');

var app = express();

require('dotenv').config();

var MySQLStore = require('express-mysql-session')(session);
const db = require('./db.js');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(expressValidator());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var options = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database : process.env.DB_NAME,
    socketPath : '/Applications/MAMP/tmp/mysql/mysql.sock'
};

var sessionStore = new MySQLStore(options);

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  //cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(function(req, res, next){
  //var isAdmin = false;
  res.locals.isAuthenticated = req.isAuthenticated();
  next();
});


app.use('/', index);
//app.use('/register', register);
app.use('/users', users);

passport.use(new LocalStrategy(
  function(username, password, done) {  
    console.log(`------- In Passport auth---------`);
    console.log(username);
    console.log(password);

    //const db = require('./db');
      db.query('SELECT user_id, password from users where email = ?', [username], function(err, result, fields){
      if(err) { done(err)};
      if(result.length == 0){
        done(null, false);
      }else{
        console.log('@@@@@@@@@@@@@Pasport user@@@@@@@@@',result[0]);
        const hash = result[0].password.toString();
        
        bcrypt.compare(password, hash, function(err, response){
          if(response == true){
            return done(null, {user_id:result[0].user_id});
          }
          else{
            return done(null, false);
          }
        })
      }

    })
  }
));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


// Handlebars default config
const hbs = require('hbs');
const fs = require('fs');

const partialsDir = __dirname + '/views/partials';

const filenames = fs.readdirSync(partialsDir);

filenames.forEach(function (filename) {
  const matches = /^([^.]+).hbs$/.exec(filename);
  if (!matches) {
    return;
  }
  const name = matches[1];
  const template = fs.readFileSync(partialsDir + '/' + filename, 'utf8');
  hbs.registerPartial(name, template);
});

hbs.registerHelper('json', function(context) {
    return JSON.stringify(context, null, 2);
});





module.exports = app;
