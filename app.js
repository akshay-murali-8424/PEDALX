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

// handlebar helpers
Handlebar.registerHelper("inc",(value)=>{
  return parseInt(value)+1;
})
Handlebar.registerHelper("sub", (value1,value2)=>
{
    return parseInt(value1) - parseInt(value2);
});
Handlebar.registerHelper( "when",function(operand_1, operator, operand_2, options) {
  var operators = {
   'eq': function(l,r) { return l == r; },
   'noteq': function(l,r) { return l != r; },
   'gt': function(l,r) { return Number(l) > Number(r); },
   'or': function(l,r) { return l || r; },
   'and': function(l,r) { return l && r; },
   '%': function(l,r) { return (l % r) === 0; }
  }
  , result = operators[operator](operand_1,operand_2);

  if (result) return options.fn(this);
  else  return options.inverse(this);
});

Handlebar.registerHelper('toLocaleString', function(number) {
  try{

    return number?.toLocaleString()
  }catch(err){
    
  }
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
