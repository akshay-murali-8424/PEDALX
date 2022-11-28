const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const brandHelper = require("../services/brandService");
const categoryHelper = require("../services/categoryService");
const userHelper = require("../services/userService");


module.exports = {
  userPermission: async (req, res, next) => {
    try {
      if(req.cookies.userjwt){
      const isLoggedIn = await promisify(jwt.verify)(
        req.cookies.userjwt,
        process.env.JWT_SECRET
      );
      if(isLoggedIn){
        const userData=await userHelper.findUserForToken(isLoggedIn.userId);
        if(userData.isBlocked){
          res.cookie('userjwt', 'loggedout', {
            expiresIn: new Date(Date.now()),
            httpOnly: true
          })
          res.redirect('/');
        }
        req.user=userData;
        return next();
      }else{
        res.redirect('/login')
      }
    }else{
      res.redirect('/login');

    }
    } catch (err) {
      res.redirect('/login');
    }
  },

  isUserLoggedIn:async (req,res,next)=>{
    try{
      const [categories,brands] = await Promise.all([
        categoryHelper.findAll(),
        brandHelper.findAll()
      ])
      res.locals.categories=categories;
      res.locals.brands=brands;
      if(req.cookies.userjwt){
        const isLoggedIn = await promisify(jwt.verify)(
          req.cookies.userjwt,
          process.env.JWT_SECRET
        );
        if(isLoggedIn){
          const userData=await userHelper.findUserForToken(isLoggedIn.userId);
          res.locals.userDetail=userData;
          req.user=userData;
          return next();
        }else{
          return next();
        }
      }else{
        return next();
      }
    }catch(err){
      console.log(err);
      next();
    }
  },

  addToCartPermission:asyncHandler(async(req,res,next)=>{
    if(req.cookies.userjwt){
      const isLoggedIn = await promisify(jwt.verify)(
        req.cookies.userjwt,
        process.env.JWT_SECRET
      );
      if(isLoggedIn){
        const userData=await userHelper.findUserForToken(isLoggedIn.userId);
        if(userData.isBlocked){
          res.cookie('userjwt', 'loggedout', {
            expiresIn: new Date(Date.now()),
            httpOnly: true
          })
          res.redirect('/');
        }
        req.user=userData;
        return next();
      }else{
        res.json({
          status:"failure",
          message:"login to add products"
        })
      }
    }else{
      res.json({
        status:"failure",
        message:"login to add products"
      })
    }
  }),
};
