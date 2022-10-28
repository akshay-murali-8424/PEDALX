const jwt = require("jsonwebtoken");
const { promisify } = require("util");

module.exports = {
  userAuthentication: async (req, res, next) => {
    try {
      if(req.cookies.userjwt){
      const isLoggedIn = await promisify(jwt.verify)(
        req.cookies.userjwt,
        process.env.JWT_SECRET
      );
      if(isLoggedIn){
        next();
      }else{
        res.redirect('/login')
      }
    }else{
        res.redirect('/login');
    }
    } catch (err) {
      console.log(err);
    }
  },
};
