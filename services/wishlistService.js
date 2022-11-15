const { ObjectId } = require("mongodb");
const { getDb } = require("../db");
const asyncHandler = require("express-async-handler");

module.exports={
  
    addToWishlist:asyncHandler(async(userId,productId)=>{
      productId=ObjectId(productId)
      const isProductExist = await getDb()
      .collection("wishlist")
      .findOne({ user:ObjectId(userId), products: { $elemMatch: { productId:ObjectId(productId) } } });
      if(!isProductExist){
       const pro={
           productId:ObjectId(productId) 
        }
        await getDb().collection('wishlist').updateOne(
            { user: userId },
            { $push: { products:  pro }},
            { upsert: true }
            );
            return true;
      }else{
    return false;  
    }
    }),

    getWishlist:asyncHandler(async(userId)=>{
     const wishlist=await getDb().collection('wishlist').aggregate([
        {
          $lookup: {
              from: 'products',
              localField: 'products.productId',
              foreignField: '_id',
              as: 'productDetails'
          }
      }
      ]).toArray()
     return wishlist;
    }),

    removeFromWishlist:asyncHandler(async(userId,productId)=>{
        const pro={
            productId:ObjectId(productId) 
         }
        userId=ObjectId(userId)
        await getDb().collection('wishlist').updateOne({user:userId},{ $pull: { products:  pro }});
    }),
}