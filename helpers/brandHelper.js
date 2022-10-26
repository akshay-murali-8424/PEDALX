const { getDb } = require("../db")

module.exports={
    
    findAll:async()=>{
       const categories=await getDb().collection('brand').find().toArray();
       return categories;
    },

    addBrand:async(name,description)=>{
        await getDb().collection('brand').insertOne({name,description});
    }
}