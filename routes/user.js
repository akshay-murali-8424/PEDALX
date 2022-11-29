const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
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

router.post('/sign-up-with-google',authController.signUpWithGoogle)

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

router.get('/remove-from-cart/:id',userAuth.userPermission,userController.removeFromCart)

router.route('/checkout')
.get(userAuth.userPermission,userController.renderCheckoutPage)
.post(userAuth.userPermission,userController.placeOrder)


router.post('/verify-payment',userAuth.addToCartPermission,userController.verifyPayment)

router.get('/success-order',userAuth.userPermission,userController.renderSuccessOrder)

router.post('/add-address',userAuth.userPermission,userController.addAddress)

router.get('/wishlist',userAuth.userPermission,userController.renderWishlist)

router.get('/add-to-wishlist/:id',userAuth.addToCartPermission,userController.addToWishlist)

router.get('/remove-from-wishlist/:id',userAuth.addToCartPermission,userController.removeFromWishlist)

router.get('/user-profile/:id',userAuth.userPermission,userController.renderUserProfile)

router.patch('/edit-personal-info',userAuth.userPermission,userController.editPersonalInfo)

router.patch('/change-password',userAuth.userPermission,userController.changePassword)

router.get('/user-orders/:id',userAuth.userPermission,userController.renderUserOrders)

router.post('/cancel-order/:id',userAuth.userPermission,userController.cancelOrder)

router.get('/return-order',userAuth.userPermission,userController.returnOrder)

router.get('/user-addresses/:id',userAuth.userPermission,userController.renderUserAddresses)

router.post('/edit-address/:id',userAuth.userPermission,userController.editAddress)

router.get('/delete-address/:id',userAuth.userPermission,userController.deleteAddress)

router.get('/user-wallet/:id',userAuth.userPermission,userController.renderUserWallet)

router.post('/add-money-to-wallet',userAuth.userPermission,userController.addMoneyToWallet)

router.post('/verify-add-money-to-wallet',userAuth.userPermission,userController.verifyAddMoneyToWallet)

router.get('/success',userAuth.userPermission,userController.paypalSuccess)

router.get('/cancel',userController.paypalCancel)

router.post('/apply-coupon',userAuth.userPermission,userController.applyCoupon)

router.get('/get-invoice/:id',userAuth.userPermission,userController.getInvoice)

router.post('/post-review',userAuth.userPermission,userController.postReview)

router.post('/search',userController.search)

router.get('/forgot-password',userController.renderForgotPassword)

router.route('/set-new-password')
.get(userAuth.userPermission,userController.renderSetNewPassword)
.post(userAuth.userPermission,authController.setNewPassword)

module.exports = router;
