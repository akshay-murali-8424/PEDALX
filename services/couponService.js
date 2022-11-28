const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");

module.exports={

    findAll:asyncHandler(async()=>{
      const coupons=await getDb().collection('coupons').find({isExpired:false}).sort({date:-1}).toArray()
      return coupons
    }),

    addCoupon:asyncHandler(async(name,discount,expiryDate)=>{
        expiryDate=new Date(expiryDate)
        const expiryMonth =expiryDate.getUTCMonth() + 1; //months from 1-12
        const expiryDay =expiryDate.getUTCDate();
        const expiryYear =expiryDate.getUTCFullYear();
        const newExpiryDate = expiryDay + "/" + expiryMonth + "/" + expiryYear;
        discount=parseInt(discount)
        const date = new Date();
        const month = date.getUTCMonth() + 1; //months from 1-12
        const day = date.getUTCDate();
        const year = date.getUTCFullYear();
        const newdate = day + "/" + month + "/" + year;
        
        await getDb().collection('coupons').insertOne({name,discount,date,createdOn:newdate,expiryDate,expiryDateOn:newExpiryDate,isExpired:false})

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
    }),

    deleteCoupon:asyncHandler(async(couponId)=>{
        await getDb().collection('coupons').updateOne({_id:ObjectId(couponId)},{
            $set:{
                isExpired:true
            }
        })
    }),

    updateCoupon:asyncHandler(async(couponId,name,discount,expiryDate)=>{
      expiryDate=new Date(expiryDate)
      const expiryDateOn=expiryDate.toLocaleDateString('en-in', { day: 'numeric' , month: 'numeric' ,year: 'numeric'})
      await getDb().collection('coupons').updateOne({_id:ObjectId(couponId)},{
        $set:{
            name,
            discount,
            expiryDate,
            expiryDateOn
        }
      })
    })

}