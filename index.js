const express = require('express');
const hbs = require('hbs');
const router = express.Router();
const session = require('express-session');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

//Parsing middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

//creating session
app.use(session({
  secret: '04lmqy5df8./*A',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

//Templating engine
app.set('view engine', 'hbs');

// Register Handlebars helpers
hbs.registerHelper('split', function (str, separator) {
  if (typeof str === 'string') {
    return str.split(separator);
  }
  return [];
});

hbs.registerHelper('trim', function (str) {
  if (typeof str === 'string') {
    return str.trim();
  }
  return str;
});

hbs.registerHelper('json', function (context) {
  return JSON.stringify(context || []);
});

//Cloudinary 
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});


//routers
app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/signup', require('./routes/signup'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/course', require('./routes/course'));
app.use('/admin', require('./routes/admin'));
app.use('/quiz', require('./routes/quiz'));


// API endpoint to check if session is vali
app.get('/api/check-session', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ valid: true, user: req.session.user });
  } else {
    res.status(401).json({ valid: false, message: 'No active session' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.clearCookie('connect.sid');
    // Prevent caching of logout redirect
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.redirect('/login');
  });
});
app.get('/logout/ar', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.clearCookie('connect.sid');
    // Prevent caching of logout redirect
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.redirect('/login/ar');
  });
});

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:;"
  );
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


module.exports = app;



