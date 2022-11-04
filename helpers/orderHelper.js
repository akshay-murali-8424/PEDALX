const {ObjectId, Timestamp}=require('mongodb')
const { getDb } = require("../db");
const cartHelper = require('./cartHelper');
const asyncHandler = require("express-async-handler");


module.exports={
    placeOrder:asyncHandler(async(userId,addressId,paymentMethod)=>{
      const addresses=await getDb().collection('userData').aggregate([
        {
            '$match': {
              '_id': new ObjectId(userId)
            }
          }, {
            '$unwind': {
              'path': '$addresses'
            }
          }, {
            '$project': {
              '_id': 0, 
              'addresses': 1
            }
          }, {
            '$match': {
              'addresses.id': new ObjectId(addressId)
            }
          }
      ]).toArray()
      const address=addresses[0].addresses;
      let cart=await cartHelper.getCart(userId);
      let total=0;
      let products=[];
      cart.forEach(cart => {
        cart.productDetails.quantity=cart.products.quantity;
        cart.productDetails.subTotal=cart.subTotal;
        products.push(cart.productDetails);
        total=total+cart.subTotal;
      });
      const date=new Date();
      var month = date.getUTCMonth() + 1; //months from 1-12
      var day = date.getUTCDate();
      var year = date.getUTCFullYear();
      var newdate = day + "/" + month + "/" + year;
      await getDb().collection('orders').insertOne({user:ObjectId(userId),address,products,total,orderedTime:newdate,date});
    }),

    getOrders:asyncHandler(async(userId)=>{
      const orders=await getDb().collection('orders').find({user:userId}).sort({date:-1}).toArray();
      return orders;
    }),
}