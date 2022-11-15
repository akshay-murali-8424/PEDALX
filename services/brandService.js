const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");


module.exports={
    
    findAll:asyncHandler(async()=>{
       const categories=await getDb().collection('brand').find().toArray();
       return categories;
    }),

    addBrand:asyncHandler(async(name,description)=>{
        await getDb().collection('brand').insertOne({name,description});
    }),

    editBrand:asyncHandler(async(brandId,name,description)=>{
        await getDb().collection('brand').updateOne({_id:ObjectId(brandId)},{
            $set:{name,description}
        })
    })
}