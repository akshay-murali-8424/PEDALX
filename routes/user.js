const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const { userPermission } = require('../middlewares/userAuth');
const userAuth = require('../middlewares/userAuth');
const router = express.Router();

router.use(userAuth.isUserLoggedIn)

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

router.get('/logout',authController.userLogout)

// GET allcycles page 
router.get('/cycles',userController.renderCyclePage)


// GET viewProduct 
// @desc render product detail page 
router.get('/view-product/:id',userController.renderViewProduct)

router.get('/add-to-cart/:id',userAuth.addToCartPermission,userController.addToCart)

//@desc render cart page
router.get('/cart',userAuth.userPermission,userController.renderCartPage)

//@desc to change product quantity in cart
router.post('/change-product-quantity',userAuth.addToCartPermission,userController.changeProductQuantity)

router.route('/checkout')
.get(userAuth.userPermission,userController.renderCheckoutPage)
.post(userAuth.userPermission,userController.placeOrder)

router.post('/add-address',userAuth.userPermission,userController.addAddress)

router.get('/wishlist',userAuth.userPermission,userController.renderWishlist)

router.get('/add-to-wishlist/:id',userAuth.addToCartPermission,userController.addToWishlist)

router.get('/remove-from-wishlist/:id',userAuth.addToCartPermission,userController.removeFromWishlist)

router.get('/user-profile/:id',userAuth.userPermission,userController.renderUserProfile)

router.get('/user-orders/:id',userAuth.userPermission,userController.renderUserOrders)

router.get('/user-addresses/:id',userAuth.userPermission,userController.renderUserAddresses)

module.exports = router;
