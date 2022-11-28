const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");


module.exports={
    
    findAll:asyncHandler(async()=>{
       const categories=await getDb().collection('brand').find({isDeleted:{$ne:true}}).toArray();
       return categories;
    }),

    findAllForAdmin:asyncHandler(async()=>{
        const brands=await getDb().collection('brand').aggregate([
         {
           '$lookup': {
             'from': 'products', 
             'localField': '_id', 
             'foreignField': 'brand', 
             'as': 'products'
           }
         }, {
           '$match': {
             'isDeleted': {
               '$ne': true
             }
           }
         }, {
           '$project': {
             'name': 1, 
             'description': 1, 
             'products._id': 1
           }
         }
       ]).toArray()
       return brands;
     }),

    addBrand:asyncHandler(async(name,description)=>{
        await getDb().collection('brand').insertOne({name,description});
    }),

    editBrand:asyncHandler(async(brandId,name,description)=>{
        await getDb().collection('brand').updateOne({_id:ObjectId(brandId)},{
            $set:{name,description}
        })
    }),

    deleteBrand:asyncHandler(async(brandId)=>{
        await getDb().collection('brand').updateOne({_id:ObjectId(brandId)},{
            $set:{
                isDeleted:true
            }
        })
    }),

}