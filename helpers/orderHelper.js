const { ObjectId, Timestamp } = require('mongodb')
const { getDb } = require("../db");
const cartHelper = require('./cartHelper');
const asyncHandler = require("express-async-handler");


module.exports = {
  placeOrder: asyncHandler(async (userId, address, products, total, paymentMethod) => {
    let orderStatus
    if(paymentMethod=="cod"){
      orderStatus="confirmed";
    }else{
      orderStatus="pending";
    }
    const date = new Date();
    var month = date.getUTCMonth() + 1; //months from 1-12
    var day = date.getUTCDate();
    var year = date.getUTCFullYear();
    var newdate = day + "/" + month + "/" + year;
    const orderDetails= await getDb().collection('orders').insertOne({ user: ObjectId(userId), address, products, total, orderedTime: newdate, date, paymentMethod,orderStatus:orderStatus });
    return orderDetails;
  }),

  getOrders: asyncHandler(async (userId) => {
    const orders = await getDb().collection('orders').find({ user: userId }).sort({ date: -1 }).toArray();
    return orders;
  }),

  findAll: asyncHandler(async () => {
    const orders = await getDb().collection('orders').aggregate([
      {
        $lookup: {
          from: 'userData',
          localField: 'user',
          foreignField: '_id',
          as: 'userDetails'
        },
      }, {
        $sort: {
          date: -1
        }
      }
    ]).toArray();
    return orders;
  }),

  changeOrderStatus:asyncHandler( async(orderId,orderStatus)=>{
    await getDb().collection('orders').updateOne({_id:ObjectId(orderId)},{$set:{orderStatus}})
  }),

  cancelOrder:asyncHandler(async(orderId)=>{
    await getDb().collection('orders').updateOne({_id:ObjectId(orderId)},{$set:{orderStatus:"cancelled"}})
  }),
}