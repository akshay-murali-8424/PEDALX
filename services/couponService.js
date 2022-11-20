const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");

module.exports={

    findAll:asyncHandler(async()=>{
      const coupons=await getDb().collection('coupons').find().sort({date:-1}).toArray()
      return coupons
    }),

    addCoupon:asyncHandler(async(name,discount)=>{
        discount=parseInt(discount)
        const date = new Date();
        var month = date.getUTCMonth() + 1; //months from 1-12
        var day = date.getUTCDate();
        var year = date.getUTCFullYear();
        var newdate = day + "/" + month + "/" + year;
        await getDb().collection('coupons').insertOne({name,discount,date,createdOn:newdate})

    }),

    findOne:asyncHandler(async(name)=>{
        const coupon=await getDb().collection('coupons').findOne({name})
        return coupon
    }),

    addUser:asyncHandler(async(userId,couponId)=>{
        await getDb().collection('coupons').updateOne({_id:ObjectId(couponId)},{
         $push:{users: ObjectId(userId)}
        })
    }),

    checkUsedCoupon:asyncHandler(async(userId,couponId)=>{
       const coupon=await getDb().collection('coupons').findOne({_id: ObjectId(couponId),users:ObjectId(userId)})
       return coupon;
    })
}