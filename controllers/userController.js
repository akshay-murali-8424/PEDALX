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
const couponService = require("../services/couponService");
const puppeteer=require('puppeteer')
const hbs = require('hbs')
const path = require('path')
const { readFile } = require("fs/promises");
const reviewService = require("../services/reviewService");
const colors=require('colors')


module.exports = ({
  renderHomePage: async (req, res) => {
    const newArrivals=await productService.getNewArrivals()
    res.render("index", { user: true, newArrivals})
  },

  renderLoginPage: (req, res) => {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    if(req.user){
      res.redirect('/')
    }else{
      res.render("userLogin", { user: true });
    }
  },

  renderLoginWithOtp: (req, res) => {
    res.render("loginWithOtp", { user: true });
  },

  renderRegisterPage: (req, res) => {
    res.render("userRegister", { user: true })
  },

  renderCyclePage: async (req, res) => {
    try {
      const limit = 6
      let isSort = true;
      let dbQuery = {isDeleted:{$ne:true}};
      let pageNo
      let sortOrder = {};
      if (req.query?.p) {
        pageNo = req.query.p - 1 || 0;
      } else {
        pageNo = 0
      }
      if (req.query.categoryId) {
        dbQuery.category=ObjectId(req.query.categoryId) 
      }
      if (req.query.brandId) {
        dbQuery.brand=ObjectId(req.query.brandId) 
      }
      if(req.query?.price){
        let price=parseInt(req.query.price)
        dbQuery.offerPrice={$lte:price}
      }
      if (req.query?.sort) {
        const sort = parseInt(req.query.sort)
        if (sort === 1) {
          isSort = true;
        } else {
          isSort = false;
        }
        sortOrder = {
          offerPrice: sort
        }
      }
      const products = await productService.findAllCycles(dbQuery, sortOrder, pageNo, limit);
      const allProducts = await productService.findAllInCategory(dbQuery)
      let max = allProducts.length / limit;
      let m = Math.ceil(max);
      let page = [];
      for (let i = 1; i <= m; i++) {
        page.push(parseInt(i));
      }
      pageNo = pageNo + 1;
      pageNo = parseInt(pageNo);
      res.render("allCycles", { user: true, products, isSort, page, pageNo })
    } catch (err) {
      console.log(err)
    }
  },

  renderViewProduct: async (req, res) => {
    const productId = req.params.id;
    const [product,reviews] = await Promise.all([
      productService.findProduct(productId),
      reviewService.getReviews(productId)])
    let isPurchasedProduct=false;
    let isUserAlreadyReviewed=false;
    let isEligibleToReview=false;
    if(req.user){
        [isPurchasedProduct,isUserAlreadyReviewed] = await Promise.all([
        orderService.isPurchasedProduct(req.user._id,productId),
        reviewService.isUserAlreadyReviewed(req.user._id,productId)
      ])
    }
    if(isPurchasedProduct&&!isUserAlreadyReviewed){
      isEligibleToReview=true;
    }
    res.render("viewProduct", { user: true, product, isEligibleToReview,reviews});
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
    const cartDetail = await cartService.findOne(req.user._id)
    let total = 0;
    cart.forEach(cart => {
      total = total + cart.subTotal;
    });
    const [user, wallet] = await Promise.all([
      userService.getUser(req.user._id),
      walletService.getWallet(req.user._id)
    ])
    let isWalletMoneyEnough = false
    if (wallet.balance > total) {
      isWalletMoneyEnough = true
    }
    res.render("checkout", { user: true, cart, total, user, isWalletMoneyEnough })
  },

  addAddress: async (req, res) => {
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

    const { addressId, paymentMethod, coupon } = req.body;
    const address = await userService.getAddressForCheckout(req.user._id, addressId)
    let cart = await cartService.getCart(req.user._id);
    cart.forEach(cart => {
      if (cart.products.quantity > cart.productDetails.stock) {
        throw new AppError(`not enough stock for ${cart.productDetails.name}`, 401);
      }
    })

    let total = 0;
    let discount = 0;
    let products = [];
    cart.forEach(cart => {
      cart.productDetails.quantity = cart.products.quantity;
      cart.productDetails.subTotal = cart.subTotal;
      products.push(cart.productDetails);
      total = total + cart.subTotal;
    });
    let discountedTotal = total
    let couponDetails
    let discountInPercentage=0
    if (coupon !== '0') {
      couponDetails = await couponService.findOne(coupon)
      await couponService.addUser(req.user._id, couponDetails._id)
      discountInPercentage = couponDetails.discount;
      discount = Math.trunc(total * (discountInPercentage / 100));
      discountedTotal = discountedTotal - discount;
      couponDetails = couponDetails.name;
    } else {
      couponDetails = "none";
    }
    products.forEach(products => {
      products.isReturned=false
      if (discountInPercentage) {
        products.afterCouponTotal = products.subTotal - (products.subTotal * (discountInPercentage / 100))
      } else {
        products.afterCouponTotal = products.subTotal
      }
    }) 
    const scratchReward = Math.floor(Math.random()* 10);
    res.cookie("reward", scratchReward, {
      httpOnly: true,
      sameSite: false,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    })
    const orderDetails = await orderService.placeOrder(req.user._id, address, products, total, discountInPercentage, discountedTotal, paymentMethod, couponDetails,scratchReward)
    const orderId = orderDetails.insertedId;
    if (paymentMethod === "cod") {
      await Promise.all(
        cart.map(async (cart) => {
          cart.productDetails.quantity = cart.productDetails.quantity * -1;
          await productService.updateStock(cart.productDetails._id, cart.productDetails.quantity)
        })
      )
      await cartService.deleteCart(req.user._id)
      res.json({
        status: "success",
        message: "order placed"
      })
      
    } else if (paymentMethod === "razorpay") {
      const razorResponse = await razorpay.generateRazorpay(orderId, discountedTotal);
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
        res.cookie("total", discountedTotal, {
          httpOnly: true,
          sameSite: false,
          secure: false,
          maxAge: 24 * 60 * 60 * 1000,
        })
        res.json({ paypalLink })
      }
      paypal.generatePayPal(req.user._id, discountedTotal, fn)
    } else if (paymentMethod === "wallet") {
      await Promise.all(
        cart.map(async (cart) => {
          cart.productDetails.quantity = cart.productDetails.quantity * -1;
          await productService.updateStock(cart.productDetails._id, cart.productDetails.quantity)
        })
      )
      await cartService.deleteCart(req.user._id)
      const status = `purchase of order ${orderId}`
      await walletService.purchaseByWallet(req.user._id, discountedTotal, status)
      res.json({
        status: "success",
        message: "order placed"
      })
    }
    await walletService.refundToWallet(req.user._id,scratchReward,`reward for order ${orderId}`)
  }),

  renderWishlist: async (req, res) => {
    let isEmpty=0
    const [wishlist] = await wishlistService.getWishlist(req.user._id);
    if(wishlist){
      isEmpty=wishlist.products.length
    }
    res.render('wishlist', { user: true, wishlist, isEmpty})
  },

  addToWishlist: asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const productId = req.params.id;
    const result = await wishlistService.addToWishlist(userId, productId);
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
    } catch (err) {
      console.log(err)
    }
  },

  editAddress: async (req, res) => {
    try {
      await userService.editAddress(req.user._id, req.body, req.params.id)
      res.redirect('back')
    } catch (err) {
      console.log(err);
    }
  },

  deleteAddress: async (req, res) => {
    try {
      await userService.deleteAddress(req.user._id, req.params.id)
      res.redirect('back')
    } catch (err) {
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
      let { value: order } = await orderService.cancelOrder(orderId);
      await Promise.all(
        order.products.map(async (products) => {
          await productService.updateStock(products._id, products.quantity)
        })
      )
      if (!order.paymentMethod === "cod") {
        const status = `refunded for cancellation of the order ${orderId}`
        await walletService.refundToWallet(req.user._id, order.discountedTotal,status)
      }
      
      res.redirect('back')
    } catch (err) {
      console.log(err);
    }

  },

  returnOrder: async (req, res) => {
    try {
      const {orderId,productId}=req.query;
      const {products}=await orderService.findReturnedProduct(orderId,productId)
      await orderService.returnProduct(orderId,productId,products.subTotal,products.afterCouponTotal)
      const status=`refunded for the return of ${products.name} in order ${orderId}` 
      await walletService.refundToWallet(req.user._id,products.afterCouponTotal,status)
      res.redirect('back')
    } catch (err) {
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
          cart.productDetails.quantity = cart.productDetails.quantity * -1;
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
          cart.productDetails.quantity = cart.productDetails.quantity * -1;
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
    const reward = req.cookies.reward;
    res.render('successOrder', { user: true, userId, reward })
  },

  renderUserWallet: async (req, res) => {
    try {
      const wallet = await walletService.getWallet(req.params.id)
      res.render('userWallet', { user: true, wallet })
    } catch (err) {
      console.log(err);
    }
  },

  addMoneyToWallet: async (req, res) => {
    try {
      const amount = req.body.amount;
      const transactionId = await walletService.addTransaction(req.user._id, amount, true);
      const razorResponse = await razorpay.generateRazorpay(transactionId, amount);
      const userData = await userService.getUser(req.user._id)
      res.json({
        transactionId: transactionId,
        razorId: razorResponse.id,
        amount: razorResponse.amount,
        userEmail: userData.email,
        userPhone: userData.phoneno,
        userName: userData.name
      })
    } catch (err) {
      console.log(err);
    }
  },

  verifyAddMoneyToWallet: asyncHandler(async (req, res) => {
    const { razorResponse, transactionId, amount } = req.body;
    const isSuccessfull = razorpay.verifyPayment(razorResponse);
    if (isSuccessfull) {
      await walletService.addMoney(req.user._id, transactionId, amount, "added money by razorpay");
      res.json({
        status: "success",
        message: "payment successfull"
      })
    } else {
      throw new AppError("payment failed", 401)
    }
  }),

  applyCoupon: asyncHandler(async (req, res) => {
    const { name } = req.body;
    const coupon = await couponService.findOne(name)
    if (!coupon) {
      throw new AppError("please enter a invalid coupon", 401)
    }
    const currentDate=new Date()
    if(coupon.expiryDate<currentDate||coupon.isExpired){
      throw new AppError("Sorry the coupon is expired",401)
    }
    const isUsedCoupon = await couponService.checkUsedCoupon(req.user._id, coupon._id)
    if (isUsedCoupon) {
      throw new AppError("this coupon is already used", 401)
    }
    res.json({
      status: "success",
      percentage: coupon.discount
    })
  }),

  getInvoice: async (req, res) => {
    try {
      const orderId = req.params.id;
      const order = await orderService.findOne(orderId);
      const compile = async function (templateName, data) {
        const filePath = path.join(
          process.cwd(),
          "/views",
          `${templateName}.hbs`
        );
        const html = await readFile(filePath, "utf-8");
        hbs.registerHelper('toLocaleString', function(number) {
          try{
            return number?.toLocaleString()
          }catch(err){
            
          }
        })
        hbs.registerHelper("inc",(value)=>{
          return parseInt(value)+1;
        })
        return hbs.compile(html)(data);
      };
      //creating puppeteer
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      //calling compile function
      const content = await compile("invoice", order);

      await page.setContent(content);
      const filePath = path.join(
        process.cwd(),
        "temp",
        `Invoice-${order._id}.pdf`
      );

      //creating pdf function
      await page.pdf({
        path: filePath,
        format: "A4",
        printBackground: true,
      });

      await browser.close();
      res.sendFile(filePath);
    } catch (err) {
      console.log(err)
    }

  },

  postReview:asyncHandler(async(req,res)=>{
    const {productId, rating, review}=req.body;
    await reviewService.postReview(productId,rating,review,req.user._id)
    res.json({
      status:"success",
    })
  }),


  search:asyncHandler(async(req,res)=>{
    let payload=req.body.e.trim()
    let search=await productService.searchProduct(payload)
    res.json({
      search
    })
  }),

  renderForgotPassword:(req,res)=>{
    res.render('forgotPassword',{user:true})
  },

  renderSetNewPassword:(req,res)=>{
    res.render('setNewPassword',{user:true})
  },
  
  removeFromCart:async(req,res)=>{
    const productId=req.params.id
    await cartService.removeFromCart(req.user._id,productId)
    res.redirect('back')
  }
})