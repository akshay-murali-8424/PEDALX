const { getDb } = require("../db")
const mongodb=require('mongodb')

module.exports={
    findAll:async()=>{
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
    },


    addProduct:async (name,description,price,category,brand,images)=>{
        await getDb().collection('products').insertOne({name,description,price,category:mongodb.ObjectId(category),brand:mongodb.ObjectId(brand),images})
    },

    findProduct:async(id)=>{
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
    },
}