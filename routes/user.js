var express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const userAuth = require('../middlewares/userAuth');
var router = express.Router();

/* GET home page. */
router.get('/',userController.renderHomePage);

// @desc render user login page
router.route('/login')
.get(userController.renderLoginPage)
.post(authController.verifyUserLogin)

router.route('/login-with-otp')
.get(userController.renderLoginWithOtp)
.post(authController.sendOtp)

router.post('/submit-otp',authController.submitOtp);

router.route('/register')
// @desc render user register page
.get(userController.renderRegisterPage)
//register new user
.post(authController.userRegister)

// GET allcycles page 
router.get('/cycles',userController.renderCyclePage)


// GET viewProduct 
// @desc render product detail page 
router.get('/view-product/:id',userController.renderViewProduct)

//@desc render cart page
router.get('/cart',userController.renderCartPage)

module.exports = router;
