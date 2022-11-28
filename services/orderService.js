const { ObjectId, Timestamp } = require('mongodb')
const { getDb } = require("../db");
const asyncHandler = require("express-async-handler");


module.exports = {
  placeOrder: asyncHandler(async (userId, address, products, total,discount,discountedTotal,paymentMethod,coupon,scratchReward) => {
    let orderStatus
    if(paymentMethod=="cod"||paymentMethod=="wallet"){
      orderStatus="confirmed";
    }else{
      orderStatus="pending";
    }
    discount=parseInt(discount)
    scratchReward=parseInt(scratchReward)
    discountedTotal=parseInt(discountedTotal)
    const date = new Date();
    var month = date.getUTCMonth() + 1; //months from 1-12
    var day = date.getUTCDate();
    var year = date.getUTCFullYear();
    var newdate = day + "/" + month + "/" + year;
    const orderDetails= await getDb().collection('orders').insertOne({ user: ObjectId(userId), address, products, total, coupon,discount,discountedTotal,orderedTime: newdate, date, paymentMethod,orderStatus:orderStatus,scratchReward });
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
    const order=await getDb().collection('orders').findOneAndUpdate({_id:ObjectId(orderId)},{$set:{orderStatus:"cancelled"}})
    return order;
  }),

  returnProduct:asyncHandler(async(orderId,productId,subTotal,afterCouponTotal)=>{
    subTotal=subTotal*-1
    afterCouponTotal=afterCouponTotal*-1
    await getDb().collection('orders').updateOne({_id: ObjectId(orderId),'products._id': ObjectId(productId)},{
        $set:{
          'products.$.isReturned':true
        },
        $inc:{
          total: subTotal,
          discountedTotal:afterCouponTotal
        }
      }
     )
  }),

  findOne:async(orderId)=>{
    const [order] = await getDb().collection('orders').aggregate([
      {
        $match: {
         _id:ObjectId(orderId)
        }
      },
      {
        $lookup:{
          from: "userData",
          localField: "user",
          foreignField: "_id",
          as: "userDetails"
        }
      }
    ]).toArray();
    return order
  },
 

  findReturnedProduct:asyncHandler(async(orderId,productId)=>{
    const [product]=await getDb().collection('orders').aggregate([
      {
        '$match': {
          '_id': ObjectId(orderId)
        }
      }, {
        '$unwind': {
          'path': '$products'
        }
      }, {
        '$match': {
          'products._id': ObjectId(productId)
        }
      },{
        $project:{
          products:1
        }
      }
    ]).toArray()
    return product;
  }),

  getSales:asyncHandler(async(dateMatchQuery)=>{
    const sales=await getDb().collection('orders').aggregate([
      {
        $unwind: {
          path: '$products'
        }
      }, {
        $match: {
          orderStatus: {$ne:'cancelled'}, 
          'products.isReturned': false
        }
      },{
        $sort:{
          date:-1
        }
      },{
        $match:dateMatchQuery
      }
    ]).toArray();
    return sales;
  }),

  getOrderStatusCount:asyncHandler(async()=>{
    const orderStatusCount=await getDb().collection('orders').aggregate([
      {
        '$group': {
          '_id': '$orderStatus', 
          'count': {
            '$sum': 1
          }
        }
      }
    ]).toArray()
    return orderStatusCount
  }),

  salesPerMonth:asyncHandler(async()=>{
    const date = new Date();
    let year = date.getUTCFullYear();
    year=parseInt(year)
    const salesPerMonth=await getDb().collection('orders').aggregate([
      {
        '$match': {
          'orderStatus': {
            '$ne': 'cancelled'
          }
        }
      }, {
        '$group': {
          '_id': {
            '$month': '$date'
          }, 
          'sale': {
            '$sum': '$discountedTotal'
          }
        }
      },
    ]).toArray();
    return salesPerMonth
  }),


  getAnnualReport:asyncHandler(async()=>{
    const date = new Date();
    let year = date.getUTCFullYear();
    year=parseInt(year)
    const annualReport=await getDb().collection('orders').aggregate([
      {
        '$match': {
          'orderStatus': {
            '$ne': 'cancelled'
          }
        }
      }, {
        '$group': {
          '_id': {
            '$year': '$date'
          }, 
          'saleAmount': {
            '$sum': '$discountedTotal'
          }, 
          'saleCount': {
            '$sum': 1
          }
        }
      }, {
        '$match': {
          '_id': year
        }
      }
    ]).toArray()
     return annualReport
  }),

  getDailyReport:asyncHandler(async()=>{
    const date = new Date();
    let day = date.getUTCDate();
    day=parseInt(day)
    const dailyReport=await getDb().collection('orders').aggregate([
      {
        '$match': {
          'orderStatus': {
            '$ne': 'cancelled'
          }
        }
      }, {
        '$group': {
          '_id': {
            '$dayOfMonth': '$date'
          }, 
          'saleAmount': {
            '$sum': '$discountedTotal'
          }, 
          'saleCount': {
            '$sum': 1
          }
        }
      }, {
        '$match': {
          '_id': day
        }
      }
    ]).toArray();
     return dailyReport
  }),

  isPurchasedProduct:asyncHandler(async(userId,productId)=>{
     const response=await getDb().collection('orders').aggregate([
      {
        $match:{
          orderStatus:"delivered",
          user: ObjectId(userId),
          'products._id':ObjectId(productId)
        }
      }
     ]).toArray();
     if(response.length){
      return true
     }else{
      return false
     }
  }),
  
}