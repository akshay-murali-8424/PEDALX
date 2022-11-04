const { getDb } = require("../db")
const mongodb=require('mongodb')
const asyncHandler = require("express-async-handler");

module.exports={
    findAll:asyncHandler( async()=>{
        const products=await getDb().collection('products').aggregate([
            {
                $lookup:{
                    from:"category",
                    localField:"category",
                    foreignField:"_id",
                    as:"categoryDetails"
                }
            },
            {
                $lookup:{
                    from:"brand",
                    localField:"brand",
                    foreignField:"_id",
                    as:"brandDetails"
                }
            } 
        ]).toArray();
        return products;
    }),


    addProduct:asyncHandler(async (name,description,price,category,brand,stock,images)=>{
        const newPrice=parseInt(price)
        stock=parseInt(stock)
        await getDb().collection('products').insertOne({name,description,price:newPrice,category:mongodb.ObjectId(category),brand:mongodb.ObjectId(brand),stock,images})
    }),

    findProduct:asyncHandler(async(id)=>{
        const product=await getDb().collection('products').aggregate([
            {
               $match:{
                _id:mongodb.ObjectId(id)
               }
            },
            {
                $lookup:{
                    from:"category",
                    localField:"category",
                    foreignField:"_id",
                    as:"categoryDetails"
                }
            },
            {
                $lookup:{
                    from:"brand",
                    localField:"brand",
                    foreignField:"_id",
                    as:"brandDetails"
                }
            } 
        ]).toArray();
        return product;
    }),
}