const cartHelper = require("../helpers/cartHelper");
const productHelper = require("../helpers/productHelper")
const mongoDb=require('mongodb')
const asyncHandler = require("express-async-handler");
const userHelper = require("../helpers/userHelper");
const orderHelper = require("../helpers/orderHelper");
const wishlistHelper = require("../helpers/wishlistHelper");

module.exports=({
    renderHomePage:(req,res)=>{
        res.render("index",{user:true})
    },

    renderLoginPage:(req,res)=>{
       res.render("userLogin",{user:true});
    },

    renderLoginWithOtp:(req,res)=>{
       res.render("loginWithOtp",{user:true});
    },

    renderRegisterPage:(req,res)=>{
       res.render("userRegister",{user:true})
    },

    renderCyclePage:async (req,res)=>{
        try{
        const products=await productHelper.findAll();
        res.render("allCycles",{user:true,products})
        }catch(err){
          console.log(err)
        }
    },

    renderViewProduct:async (req,res)=>{
        const productId=req.params.id;
        const product=await productHelper.findProduct(productId);
        res.render("viewProduct",{user:true,product});
    },

    renderCartPage:async (req,res)=>{
        const cart=await cartHelper.getCart(req.user._id);
        if(cart){
        let total=0;
        cart.forEach(cart => {
          total=total+cart.subTotal;
        });
        res.render("cart",{user:true,cart,total,isEmpty:cart.length})
        }else{
            res.send("cart is empty");
        }
    },

    addToCart:asyncHandler(async (req,res)=>{
        const userId=req.user._id;
        const productId=req.params.id;
        await cartHelper.addToCart(userId,productId);
        res.json({
            status:"success",
            message:"product added to cart"
        })
    }),

    changeProductQuantity:asyncHandler(async(req,res)=>{
       const {cartId,productId,count}=req.body;
       const result=await cartHelper.changeProductQuantity(cartId,productId,count);
       if(result.modifiedCount===1){
        res.json({
            status:"removed",
            message:"product removed"
        })
       }else{
        res.json({
            status:"success",
            message:"product quantity changed"
        })
       }
    }),

    renderCheckoutPage:async (req,res)=>{
        const cart=await cartHelper.getCart(req.user._id); 
        let total=0;
        cart.forEach(cart => {
          total=total+cart.subTotal;
        });
        const user=await userHelper.getUser(req.user._id);
        res.render("checkout",{user:true,cart,total,user})
    },

    addAddress:async (req,res)=>{
      console.log(req.user._id,req.body)
      try{
      await userHelper.addAddress(req.user._id,req.body)
      res.json({
        status:"success",
        message:"new address added"
      })
      }catch(err){
        console.log(err)
      }
    },

    placeOrder:async (req,res)=>{
      try{
      const {addressId,paymentMethod}=req.body;
      await orderHelper.placeOrder(req.user._id,addressId,paymentMethod)
      await cartHelper.deleteCart(req.user._id)
      res.json({
        status:"success",
        message:"order placed"
      })
    }catch(err){
      console.log(err)
    }
    },

    renderWishlist:async (req,res)=>{
      const [wishlist]=await wishlistHelper.getWishlist(req.user._id);
      res.render('wishlist',{user:true,wishlist,isEmpty:wishlist.products.length})
    },

    addToWishlist:asyncHandler(async(req,res)=>{
      const userId=req.user._id;
      const productId=req.params.id;
      const result=await wishlistHelper.addToWishlist(userId,productId);
      console.log(result);
      if(!result){
        res.json({
          status:"failure",
          message:"product is already in the wishlist"
      })
      }else{
      res.json({
          status:"success",
          message:"product added to wishlist"
      })
    }
    }),

    removeFromWishlist:async (req,res)=>{
      const userId=req.user._id;
      const productId=req.params.id;
      await wishlistHelper.removeFromWishlist(userId,productId);
      res.json({
        status:"success",
        message:"product removed from wishlist"
      })
    },

    renderUserProfile:(req,res)=>{
      const userId=req.user._id;
      res.render('userProfile',{user:true})
    },

    renderUserOrders:async(req,res)=>{
      try{
      const userId=req.user._id;
      const orders=await orderHelper.getOrders(userId);
      res.render('userOrders',{user:true,orders})
      }catch(err){
        console.log(err);
      }
    },

    renderUserAddresses:async(req,res)=>{
      try{
        const userId=req.user._id;
        const [addresses]=await userHelper.getAddress(userId)
        console.log(addresses);
        res.render('userAddress',{user:true,addresses});
      }catch{
        console.log(err)
      }
    }
})