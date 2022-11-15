const cartService = require("../services/cartService");
const productService = require("../services/productService")
const { ObjectId } = require('mongodb')
const asyncHandler = require("express-async-handler");
const userService = require("../services/userService");
const orderService = require("../services/orderService");
const wishlistService = require("../services/wishlistService");
const AppError = require("../utils/appError");
const bcrypt = require("bcryptjs");
const razorpay = require("../utils/razorpay");
const paypal = require("../utils/paypal");
const walletService = require("../services/walletService");


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
      let isSort=true;
      let dbQuery = {};
      let sortOrder = {};
      if (req.query.categoryId) {
        dbQuery = { category: ObjectId(req.query.categoryId) }
      }
      if(req.query.brandId){
        dbQuery={brand:ObjectId(req.query.brandId)}
      }
      if (req.query?.sort) {
        const sort = parseInt(req.query.sort)
        if(sort===1){
         isSort=true;
        }else{
        isSort=false;
        }
          sortOrder = {
            price: sort
          }
      }
      const products = await productService.findAllCycles(dbQuery, sortOrder);
      res.render("allCycles", { user: true, products, isSort})
    } catch (err) {
      console.log(err)
    }
  },

  renderViewProduct: async (req, res) => {
    const productId = req.params.id;
    const product = await productService.findProduct(productId);
    res.render("viewProduct", { user: true, product });
  },

  renderCartPage: async (req, res) => {
    const cart = await cartService.getCart(req.user._id);
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
    await cartService.addToCart(userId, productId);
    res.json({
      status: "success",
      message: "product added to cart"
    })
  }),

  changeProductQuantity: asyncHandler(async (req, res) => {
    const { cartId, productId, count } = req.body;
    const result = await cartService.changeProductQuantity(cartId, productId, count);
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
    const cart = await cartService.getCart(req.user._id);
    let total = 0;
    cart.forEach(cart => {
      total = total + cart.subTotal;
    });
    const [user,wallet] = await Promise.all([
      userService.getUser(req.user._id),
      walletService.getWallet(req.user._id)
    ])
    let isWalletMoneyEnough=false
    if(wallet.balance>total){
      isWalletMoneyEnough=true
    }
    res.render("checkout", { user: true, cart, total, user, isWalletMoneyEnough})
  },

  addAddress: async (req, res) => {
    console.log(req.user._id, req.body)
    try {
      await userService.addAddress(req.user._id, req.body)
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
    const address = await userService.getAddressForCheckout(req.user._id, addressId)
    let cart = await cartService.getCart(req.user._id);
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

    const orderDetails = await orderService.placeOrder(req.user._id, address, products, total, paymentMethod)
    const orderId = orderDetails.insertedId;
    if (paymentMethod === "cod") {
      await Promise.all(
        cart.map(async (cart) => {
          cart.productDetails.quantity=cart.productDetails.quantity*-1;
          await productService.updateStock(cart.productDetails._id, cart.productDetails.quantity)
        })
      )
      await cartService.deleteCart(req.user._id)
      res.json({
        status: "success",
        message: "order placed"
      })
    } else if (paymentMethod === "razorpay") {
      const razorResponse = await razorpay.generateRazorpay(orderId, total);
      const userData = await userService.getUser(req.user._id)
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
    }else if(paymentMethod==="wallet"){
      await Promise.all(
        cart.map(async (cart) => {
          cart.productDetails.quantity=cart.productDetails.quantity*-1;
          await productService.updateStock(cart.productDetails._id, cart.productDetails.quantity)
        })
      )
      await cartService.deleteCart(req.user._id)
      const status=`purchase of order ${orderId}`
      await walletService.purchaseByWallet(req.user._id,total,status)
      res.json({
        status: "success",
        message: "order placed"
      })
    }

  }),

  renderWishlist: async (req, res) => {
    const [wishlist] = await wishlistService.getWishlist(req.user._id);
    res.render('wishlist', { user: true, wishlist, isEmpty: wishlist.products.length })
  },

  addToWishlist: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.id;
    const result = await wishlistService.addToWishlist(userId, productId);
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
    await wishlistService.removeFromWishlist(userId, productId);
    res.json({
      status: "success",
      message: "product removed from wishlist"
    })
  },

  renderUserProfile: async (req, res) => {
    const userId = req.user._id;
    const userData = await userService.getUser(userId);
    res.render('userProfile', { user: true, userData })
  },

  renderUserOrders: async (req, res) => {
    try {
      const userId = req.user._id;
      const orders = await orderService.getOrders(userId);
      res.render('userOrders', { user: true, orders })
    } catch (err) {
      console.log(err);
    }
  },

  renderUserAddresses: async (req, res) => {
    try {
      const userId = req.user._id;
      const [addresses] = await userService.getAddress(userId)
      res.render('userAddress', { user: true, addresses });
    } catch(err){
      console.log(err)
    }
  },

  editAddress:async(req,res)=>{
    try{
     await userService.editAddress(req.user._id,req.body,req.params.id)
      res.redirect('back')
    }catch(err){
      console.log(err);
    }
  },

  deleteAddress:async(req,res)=>{
    try{
     await userService.deleteAddress(req.user._id,req.params.id)
     res.redirect('back')
    }catch(err){
     console.log(err)
    }
  },

  editPersonalInfo: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name, email, phoneno } = req.body;
    const user = await userService.getUser(userId);
    if (user.email != email) {
      const isExistingEmail = await userService.findExistingEmail(email)
      if (isExistingEmail) {
        throw new AppError("existing email", 401)
      }
    }
    if (user.phoneno != phoneno) {
      const isExistingPhoneno = await userService.findExistingPhoneno(phoneno)
      if (isExistingPhoneno) {
        throw new AppError("existing phone number", 401)
      }
    }
    await userService.updateUser(userId, name, email, phoneno);
    res.json({
      status: "success",
      message: "user details updated"
    })
  }),

  changePassword: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    let { currentPassword, newPassword } = req.body;
    const user = await userService.getUser(userId);
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password)
    // generate salt to hash password
    const salt = await bcrypt.genSalt(10);
    // hashing password
    newPassword = await bcrypt.hash(newPassword, salt);
    if (isPasswordCorrect) {
      await userService.changePassword(userId, newPassword);
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
      let{value:order}=await orderService.cancelOrder(orderId);
      console.log(order.total)
      await Promise.all(
        order.products.map(async(products)=>{
          await productService.updateStock(products._id,products.quantity)
        })
      )
      const status=`refunded for cancellation of the product order ${orderId}`
      await walletService.refundToWallet(req.user._id,order.total,status)
      res.redirect('back')
    } catch (err) {
      console.log(err);
    }

  },

  returnOrder:async(req,res)=>{
   try{
    const orderId = req.params.id;
    let {value:order}=await orderService.returnOrder(orderId);
    await Promise.all(
      order.products.map(async(products)=>{
        await productService.updateStock(products._id,products.quantity)
      })
    )
    res.redirect('back');
   }catch (err) {
    console.log(err);
   }
  },

  verifyPayment: asyncHandler(async (req, res) => {
    const { razorResponse, orderId } = req.body;
    const isSuccessfull = razorpay.verifyPayment(razorResponse);
    if (isSuccessfull) {
      let cart = await cartService.getCart(req.user._id);
      await Promise.all(
        cart.map(async (cart) => {
          cart.productDetails.quantity=cart.productDetails.quantity*-1;
          await productService.updateStock(cart.productDetails._id, cart.products.quantity)
        })
      )
      await cartService.deleteCart(req.user._id)
      await orderService.changeOrderStatus(orderId, "confirmed")
      res.json({
        status: "success",
        message: "order placed"
      })
    } else {
      await orderService.changeOrderStatus(orderId, "cancelled")
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
      let cart = await cartService.getCart(req.user._id);
      await Promise.all(
        cart.map(async (cart) => {
          cart.productDetails.quantity=cart.productDetails.quantity*-1;
          await productService.updateStock(cart.productDetails._id, cart.products.quantity)
        })
      )
      await cartService.deleteCart(req.user._id)
      await orderService.changeOrderStatus(orderId, "confirmed")
      res.redirect('/success-order')
    }
    paypal.executePaypal(payerld, paymentId, total, fn);

  },

  paypalCancel: (req, res) => {
    res.redirect('/checkout')
  },

  renderSuccessOrder: (req, res) => {
    const userId = req.user._id;
    res.render('successOrder', { user: true, userId })
  },

  renderUserWallet:async (req,res)=>{
    try{
      const wallet=await walletService.getWallet(req.params.id)
      res.render('userWallet',{user:true,wallet})
    }catch(err){
      console.log(err);
    }
  },

  addMoneyToWallet:async(req,res)=>{
    try{
      const amount=req.body.amount;
      const transactionId=await walletService.addTransaction(req.user._id,amount,true);
      const razorResponse=await razorpay.generateRazorpay(transactionId,amount);
      const userData = await userService.getUser(req.user._id)
      res.json({
       transactionId:transactionId,
        razorId: razorResponse.id,
        amount: razorResponse.amount,
        userEmail: userData.email,
        userPhone: userData.phoneno,
        userName: userData.name
      })
    }catch(err){
      console.log(err);
    }
  },

  verifyAddMoneyToWallet:asyncHandler(async(req,res)=>{
    const { razorResponse, transactionId, amount } = req.body;
    const isSuccessfull = razorpay.verifyPayment(razorResponse);
    if(isSuccessfull){
      await walletService.addMoney(req.user._id,transactionId,amount,"added money by razorpay");
      res.json({
        status:"success",
        message:"payment successfull"
      })
    }else{
      throw new AppError("payment failed", 401)
    }
  }),

  
})