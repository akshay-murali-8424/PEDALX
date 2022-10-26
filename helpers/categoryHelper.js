const { getDb } = require("../db")

module.exports={
    
    findAll:async()=>{
       const categories=await getDb().collection('category').find().toArray();
       return categories;
    },

    addCategory:async(name,description)=>{
        await getDb().collection('category').insertOne({name,description});
    }
}