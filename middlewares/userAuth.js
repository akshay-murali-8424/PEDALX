const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const userHelper = require("../helpers/userHelper");

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
      if(req.cookies.userjwt){
        const isLoggedIn = await promisify(jwt.verify)(
          req.cookies.userjwt,
          process.env.JWT_SECRET
        );
        if(isLoggedIn){
          const userData=await userHelper.findUserForToken(isLoggedIn.userId);
          res.locals.userDetail=userData;
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
