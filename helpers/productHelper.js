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

    findProductForEdit:asyncHandler(async(productId)=>{
        const product=await getDb().collection('products').findOne({_id:mongodb.ObjectId(productId)})
        return product;
    }),

    updateProduct:asyncHandler(async(productId,name,description,price,category,brand,stock,images)=>{
      category=mongodb.ObjectId(category)
      brand=mongodb.ObjectId(brand)
      productId=mongodb.ObjectId(productId)
      price=parseInt(price);
      stock=parseInt(stock);
      result=await getDb().collection('products').updateOne({_id:productId},
        {
          $set:{name,description,price:price,category:category,brand:brand,stock:stock,images:images}
        })
    console.log(result);
    }),

    updateStockOnCheckout:asyncHandler(async(productId,quantity)=>{
        quantity=-Math.abs(quantity)
        await getDb().collection('products').updateOne({_id:mongodb.ObjectId(productId)},{
          $inc:{stock: quantity}
        });
        
    })
}