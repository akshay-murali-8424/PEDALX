const { ObjectId, Timestamp } = require('mongodb')
const { getDb } = require("../db");
const asyncHandler = require("express-async-handler");

module.exports={
    postReview:asyncHandler(async(productId,rating,review,userId)=>{
        productId=ObjectId(productId)
        userId=ObjectId(userId)
        const reviewId=ObjectId()
        const date=new Date();
        rating=parseInt(rating)
        const postedOn=date.toLocaleDateString('en-in', {  year: 'numeric', month: 'long', day: 'numeric' })
        await getDb().collection('reviews').updateOne({productId},{
            
            $push:{
                reviews:{
                    userId,
                    reviewId,
                    rating,
                    review,
                    postedOn,
                    date
                }
            },
            $inc:{
                totalRating:rating,
                totalReview:1
            },
    },{upsert:true})

    }),

    getReviews:asyncHandler(async(productId)=>{
        const reviews=await getDb().collection('reviews').aggregate([
            {
                '$match': {
                    'productId': ObjectId(productId)
                }
            }, {
                '$unwind': {
                    'path': '$reviews'
                }
            }, {
                '$lookup': {
                    'from': 'userData', 
                    'localField': 'reviews.userId', 
                    'foreignField': '_id', 
                    'as': 'userData'
                }
            }, {
                '$project': {
                    'reviews': 1, 
                    'averageRating': {
                        '$trunc': [
                            {
                                '$divide': [
                                    '$totalRating', '$totalReview'
                                ]
                            }, 2
                        ]
                    }, 
                    'userData': 1,
                    totalReview:1
                }
            }
        ]).toArray();
        return reviews;
    }),

    isUserAlreadyReviewed:asyncHandler(async(userId,productId)=>{
      const isUserAlreadyReviewed=await getDb().collection('reviews').aggregate([
        {
            '$match': {
                'reviews.userId': ObjectId(userId), 
                'productId': ObjectId(productId)
            }
        }
     ]).toArray()
       if(isUserAlreadyReviewed.length){
        return true
       }else{
        return false
       }  
    })
}


