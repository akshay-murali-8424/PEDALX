const jwt = require("jsonwebtoken");
const { promisify } = require("util");

module.exports = {
  adminAuthentication: async (req, res, next) => {
    try {
      // console.log(req.cookies.jwt);
      if(req.cookies.adminjwt){
      const isLoggedIn = await promisify(jwt.verify)(
        req.cookies.adminjwt,
        process.env.JWT_SECRET
      );
      console.log(isLoggedIn);
      if(isLoggedIn){
        next();
      }else{
        res.redirect('/admin/login')
      }
    }else{
        res.redirect('/admin/login');
    }
    } catch (err) {
      console.log(err);
    }
  },
};
