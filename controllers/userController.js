const cartHelper = require("../helpers/cartHelper");
const productHelper = require("../helpers/productHelper")
const mongoDb = require('mongodb')
const asyncHandler = require("express-async-handler");
const userHelper = require("../helpers/userHelper");
const orderHelper = require("../helpers/orderHelper");
const wishlistHelper = require("../helpers/wishlistHelper");
const AppError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const razorpay = require("../utils/razorpay");
const paypal = require("../utils/paypal");


module.exports = ({
  renderHomePage: (req, res) => {
    res.render("index", { user: true })
  },

  renderLoginPage: (req, res) => {
    res.render("userLogin", { user: true });
  },

  renderLoginWithOtp: (req, res) => {
    res.render("loginWithOtp", { user: true });
  },

  renderRegisterPage: (req, res) => {
    res.render("userRegister", { user: true })
  },

  renderCyclePage: async (req, res) => {
    try {
      const products = await productHelper.findAll();
      res.render("allCycles", { user: true, products })
    } catch (err) {
      console.log(err)
    }
  },

  renderViewProduct: async (req, res) => {
    const productId = req.params.id;
    const product = await productHelper.findProduct(productId);
    res.render("viewProduct", { user: true, product });
  },

  renderCartPage: async (req, res) => {
    const cart = await cartHelper.getCart(req.user._id);
    if (cart) {
      let total = 0;
      cart.forEach(cart => {
        total = total + cart.subTotal;
      });
      res.render("cart", { user: true, cart, total, isEmpty: cart.length })
    } else {
      res.send("cart is empty");
    }
  },

  addToCart: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.id;
    await cartHelper.addToCart(userId, productId);
    res.json({
      status: "success",
      message: "product added to cart"
    })
  }),

  changeProductQuantity: asyncHandler(async (req, res) => {
    const { cartId, productId, count } = req.body;
    const result = await cartHelper.changeProductQuantity(cartId, productId, count);
    console.log(result)
    if (result.modifiedCount === 1) {
      res.json({
        status: "removed",
        message: "product removed"
      })
    } else {
      res.json({
        status: "success",
        message: "product quantity changed"
      })
    }
  }),

  renderCheckoutPage: async (req, res) => {
    const cart = await cartHelper.getCart(req.user._id);
    let total = 0;
    cart.forEach(cart => {
      total = total + cart.subTotal;
    });
    const user = await userHelper.getUser(req.user._id);
    res.render("checkout", { user: true, cart, total, user })
  },

  addAddress: async (req, res) => {
    console.log(req.user._id, req.body)
    try {
      await userHelper.addAddress(req.user._id, req.body)
      res.json({
        status: "success",
        message: "new address added"
      })
    } catch (err) {
      console.log(err)
    }
  },

  placeOrder: asyncHandler(async (req, res) => {

    const { addressId, paymentMethod } = req.body;
    const address = await userHelper.getAddressForCheckout(req.user._id, addressId)
    let cart = await cartHelper.getCart(req.user._id);
    cart.forEach(cart => {
      if (cart.products.quantity > cart.productDetails.stock) {
        throw new AppError(`not enough stock for ${cart.productDetails.name}`, 401);
      }
    })
    let total = 0;
    let products = [];
    cart.forEach(cart => {
      cart.productDetails.quantity = cart.products.quantity;
      cart.productDetails.subTotal = cart.subTotal;
      products.push(cart.productDetails);
      total = total + cart.subTotal;
    });

    const orderDetails = await orderHelper.placeOrder(req.user._id, address, products, total, paymentMethod)
    const orderId = orderDetails.insertedId;
    if (paymentMethod === "cod") {
      await Promise.all(
        cart.map(async (cart) => {
          await productHelper.updateStockOnCheckout(cart.productDetails._id, cart.productDetails.quantity)
        })
      )
      await cartHelper.deleteCart(req.user._id)
      res.json({
        status: "success",
        message: "order placed"
      })
    } else if (paymentMethod === "razorpay") {
      const razorResponse = await razorpay.generateRazorpay(orderId, total);
      const userData = await userHelper.getUser(req.user._id)
      console.log(userData)
      res.json({
        orderId: orderId,
        razorId: razorResponse.id,
        amount: razorResponse.amount,
        userEmail: userData.email,
        userPhone: userData.phoneno,
        userName: userData.name

      })
    } else if (paymentMethod === "paypal") {
      const fn = (paypalLink) => {
        res.cookie("orderId", orderId, {
          httpOnly: true,
          sameSite: false,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
        })
        res.cookie("total", total, {
          httpOnly: true,
          sameSite: false,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
        })
        res.json({ paypalLink })
      }
      paypal.generatePayPal(req.user._id, total, fn)
    }

  }),

  renderWishlist: async (req, res) => {
    const [wishlist] = await wishlistHelper.getWishlist(req.user._id);
    res.render('wishlist', { user: true, wishlist, isEmpty: wishlist.products.length })
  },

  addToWishlist: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.id;
    const result = await wishlistHelper.addToWishlist(userId, productId);
    console.log(result);
    if (!result) {
      res.json({
        status: "failure",
        message: "product is already in the wishlist"
      })
    } else {
      res.json({
        status: "success",
        message: "product added to wishlist"
      })
    }
  }),

  removeFromWishlist: async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.id;
    await wishlistHelper.removeFromWishlist(userId, productId);
    res.json({
      status: "success",
      message: "product removed from wishlist"
    })
  },

  renderUserProfile: async (req, res) => {
    const userId = req.user._id;
    const userData = await userHelper.getUser(userId);
    res.render('userProfile', { user: true, userData })
  },

  renderUserOrders: async (req, res) => {
    try {
      const userId = req.user._id;
      const orders = await orderHelper.getOrders(userId);
      res.render('userOrders', { user: true, orders })
    } catch (err) {
      console.log(err);
    }
  },

  renderUserAddresses: async (req, res) => {
    try {
      const userId = req.user._id;
      const [addresses] = await userHelper.getAddress(userId)
      console.log(addresses);
      res.render('userAddress', { user: true, addresses });
    } catch {
      console.log(err)
    }
  },

  editPersonalInfo: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name, email, phoneno } = req.body;
    const user = await userHelper.getUser(userId);
    if (user.email != email) {
      const isExistingEmail = await userHelper.findExistingEmail(email)
      if (isExistingEmail) {
        throw new AppError("existing email", 401)
      }
    }
    if (user.phoneno != phoneno) {
      const isExistingPhoneno = await userHelper.findExistingPhoneno(phoneno)
      if (isExistingPhoneno) {
        throw new AppError("existing phone number", 401)
      }
    }
    await userHelper.updateUser(userId, name, email, phoneno);
    res.json({
      status: "success",
      message: "user details updated"
    })
  }),

  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    let { currentPassword, newPassword } = req.body;
    const user = await userHelper.getUser(userId);
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password)
    // generate salt to hash password
    const salt = await bcrypt.genSalt(10);
    // hashing password
    newPassword = await bcrypt.hash(newPassword, salt);
    if (isPasswordCorrect) {
      await userHelper.changePassword(userId, newPassword);
      res.json({
        status: "success",
        message: "password is changed"
      })
    } else {
      throw new AppError("the password is incorrect", 401)
    }
  }),

  cancelOrder: async (req, res) => {
    try {

      const orderId = req.params.id;
      await orderHelper.cancelOrder(orderId)
      res.redirect(`/user-orders/${orderId}`)
    } catch (err) {
      console.log(err);
    }

  },

  verifyPayment: asyncHandler(async (req, res) => {
    const { razorResponse, orderId } = req.body;
    const isSuccessfull = razorpay.verifyPayment(razorResponse);
    if (isSuccessfull) {
      let cart = await cartHelper.getCart(req.user._id);
      await Promise.all(
        cart.map(async (cart) => {
          await productHelper.updateStockOnCheckout(cart.productDetails._id, cart.products.quantity)
        })
      )
      await cartHelper.deleteCart(req.user._id)
      await orderHelper.changeOrderStatus(orderId, "confirmed")
      res.json({
        status: "success",
        message: "order placed"
      })
    } else {
      await orderHelper.changeOrderStatus(orderId, "cancelled")
      throw new AppError("payment failed", 401)
    }

  }),

  paypalSuccess: (req, res) => {
    const payerld = req.query.PayerID;
    const paymentId = req.query.paymentId;
    let total = req.cookies.total;
    total = parseInt(total);
    const orderId = req.cookies.orderId;
    const userId = req.user._id;
    const fn = async () => {
      let cart = await cartHelper.getCart(req.user._id);
      await Promise.all(
        cart.map(async (cart) => {
          await productHelper.updateStockOnCheckout(cart.productDetails._id, cart.products.quantity)
        })
      )
      await cartHelper.deleteCart(req.user._id)
      await orderHelper.changeOrderStatus(orderId, "confirmed")
      res.redirect('/')
    }
    paypal.executePaypal(payerld, paymentId, total, fn);

  },

  paypalCancel:(req,res)=>{
    res.redirect('/checkout')
  } 


})