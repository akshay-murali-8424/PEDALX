const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");

module.exports={
    
    findAll:asyncHandler(async()=>{
       const categories=await getDb().collection('category').find().toArray();
       return categories;
    }),

    addCategory:asyncHandler( async(name,description)=>{
        await getDb().collection('category').insertOne({name,description});
    }),

    editCategory:asyncHandler(async(categoryId,name,description)=>{
        await getDb().collection('category').updateOne({_id:ObjectId(categoryId)},{
            $set:{name,description}
        })
    })
}