const { getDb } = require("../db")

module.exports={

    findExistingEmail:async(email)=>{
        const isExistingEmail=await getDb().collection('userData').findOne({email:email})
        return isExistingEmail;
    },

    findExistingPhoneno:async(phoneno)=>{
        const isExistingPhoneno=await getDb().collection('userData').findOne({phoneno:phoneno})
        return isExistingPhoneno;
    },

    addUser:async(name,email,password,phoneno)=>{
        const user=await getDb().collection('userData').insertOne({name,email,password,phoneno});
        return user;

    },
}