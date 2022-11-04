const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");

module.exports={
    
    findAll:asyncHandler(async()=>{
       const categories=await getDb().collection('category').find().toArray();
       return categories;
    }),

    addCategory:asyncHandler( async(name,description)=>{
        await getDb().collection('category').insertOne({name,description});
    }),
}