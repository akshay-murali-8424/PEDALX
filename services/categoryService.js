const { getDb } = require("../db")
const asyncHandler = require("express-async-handler");
const { ObjectId } = require("mongodb");

module.exports={
    
    findAll:asyncHandler(async()=>{
       const categories=await getDb().collection('category').find({isDeleted:{$ne:true}}).toArray();
       return categories;
    }),

    findAllForAdmin:asyncHandler(async()=>{
       const categories=await getDb().collection('category').aggregate([
        {
          '$lookup': {
            'from': 'products', 
            'localField': '_id', 
            'foreignField': 'category', 
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
      return categories;
    }),

    addCategory:asyncHandler( async(name,description)=>{
        await getDb().collection('category').insertOne({name,description});
    }),

    editCategory:asyncHandler(async(categoryId,name,description)=>{
        await getDb().collection('category').updateOne({_id:ObjectId(categoryId)},{
            $set:{name,description}
        })
    }),

    changeOffer:asyncHandler(async(categoryId,discount)=>{
        discount=parseInt(discount)
        await getDb().collection('category').updateOne({_id:ObjectId(categoryId)},{
            $set:{offer:discount}
        })
    }),

    deleteCategory:asyncHandler(async(categoryId)=>{
        await getDb().collection('category').updateOne({_id:ObjectId(categoryId)},{
            $set:{
                isDeleted:true
            }
        })
    }),
}