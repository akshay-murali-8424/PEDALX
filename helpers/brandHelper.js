const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");


module.exports={
    
    findAll:asyncHandler(async()=>{
       const categories=await getDb().collection('brand').find().toArray();
       return categories;
    }),

    addBrand:asyncHandler(async(name,description)=>{
        await getDb().collection('brand').insertOne({name,description});
    }),
}