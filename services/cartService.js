const { ObjectId } = require("mongodb");
const { getDb } = require("../db");
const asyncHandler = require("express-async-handler");

module.exports = {
  addToCart:asyncHandler(async (userId, productId) => {
    productId = ObjectId(productId);
    userId = ObjectId(userId);
    const isProductExist = await getDb()
      .collection("cart")
      .findOne({ user: userId, products: { $elemMatch: { productId } } });
    if (isProductExist) {
      await getDb()
        .collection("cart")
        .updateOne(
          { user: userId, products: { $elemMatch: { productId } } },
          {
            $inc: { "products.$.quantity": 1 },
          }
        );
    } else {
      await getDb()
        .collection("cart")
        .updateOne(
          { user: userId },
          { $push: { products: { productId, quantity: 1 } } },
          { upsert: true }
        );
    }
  }),

  getCart:asyncHandler(async (userId) => {
    const cart = await getDb()
      .collection("cart")
      .aggregate([
        {
          $match: {
            user: new ObjectId(userId),
          },
        },
        {
          $unwind: {
            path: "$products",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $lookup: {
            from: "products",
            localField: "products.productId",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: {
              path: '$productDetails'
          }
      }, {
          $project: {
              products: 1, 
              productDetails: 1, 
              subTotal: {
                  $multiply: [
                      '$products.quantity', '$productDetails.offerPrice'
                  ]
              }
          }
        }
      ])
      .toArray();
    return cart;
  }),

  changeProductQuantity:asyncHandler(async (cartId, productId, count) => {
    
    await getDb().collection('cart').updateOne({ _id: ObjectId(cartId),'products.productId':ObjectId(productId)},{
      $inc:{'products.$.quantity':count}
    })
    const result=await getDb().collection('cart').updateOne({},{$pull:{products:{productId:ObjectId(productId),quantity:0}}});
    return result;
  }),

  deleteCart:asyncHandler(async(userId)=>{
    const result=await getDb().collection('cart').deleteOne({user:ObjectId(userId)})
    console.log(result);
  }),

  applyCoupon:asyncHandler(async(userId,couponId)=>{
    await getDb().collection('cart').updateOne({user: ObjectId(userId)},{
      $set:{
        coupon:couponId
      }
    })
  })
};
