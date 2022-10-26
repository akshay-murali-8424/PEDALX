const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const colors = require('colors');
const hbs=require('express-handlebars')
const multer=require('multer')


const indexRouter = require('./routes/user');
const adminRouter = require('./routes/admin');
const {initDb} = require('./db');
const helpers=require("handlebars-helpers")();
const Handlebar=require("handlebars")

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.engine('hbs',hbs.engine({extname:'hbs',defaultLayout:'layout',layoutsDir:__dirname+'/views/layout/',partialsDir:__dirname+'/views/partials',helpers:helpers}));
Handlebar.registerHelper("inc",(value)=>{
  return parseInt(value)+1;
})
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);

// mongo connection
initDb((err, db) => {
  if (err) {
    console.log(err);
  } else {
   console.log("\n \n mongo connection successfull \n \n".bold.green);
  }
});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status= err.status || 'error';
  res.status (err.statusCode) .json({
  status: err.status,
  message: err.message
  })
});

module.exports = app;
