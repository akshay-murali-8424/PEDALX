const { getDb } = require("../db")
const mongoDb=require('mongodb')
const asyncHandler = require("express-async-handler");

module.exports={

    findExistingEmail:asyncHandler(async(email)=>{
        const isExistingEmail=await getDb().collection('userData').findOne({email:email})
        return isExistingEmail;
    }),

    findExistingPhoneno:asyncHandler( async(phoneno)=>{
        const isExistingPhoneno=await getDb().collection('userData').findOne({phoneno:phoneno})
        return isExistingPhoneno;
    }),

    addUser:asyncHandler( async(name,email,password,phoneno)=>{
        const user=await getDb().collection('userData').insertOne({name,email,password,phoneno});
        return user;

    }),

    findUserForToken:asyncHandler(async(id)=>{
        const [user]=await getDb().collection('userData').find({_id:mongoDb.ObjectId(id)}).project({name:1}).toArray();
        return user;
    }),

    addAddress:asyncHandler(async (userId,address)=>{
        address.id=mongoDb.ObjectId()
      await getDb().collection('userData').updateOne({_id:mongoDb.ObjectId(userId)},{$push:{addresses:address}})
    }),

    getUser:asyncHandler(async(userId)=>{
        const user=await getDb().collection('userData').findOne({_id:mongoDb.ObjectId(userId)})
        return user;
    }),

    getAddress:asyncHandler(async(userId)=>{
        const addresses=await getDb().collection('userData').find({_id:mongoDb.ObjectId(userId)}).project({addresses:1}).toArray()
        return addresses;
    }),

    getAddressForCheckout:asyncHandler(async(userId,addressId)=>{
        const addresses=await getDb().collection('userData').aggregate([
            {
                '$match': {
                  '_id': mongoDb.ObjectId(userId)
                }
              }, {
                '$unwind': {
                  'path': '$addresses'
                }
              }, {
                '$project': {
                  '_id': 0, 
                  'addresses': 1
                }
              }, {
                '$match': {
                  'addresses.id': mongoDb.ObjectId(addressId)
                }
              }
          ]).toArray()
          const address=addresses[0].addresses;
          return address;
    }),

    updateUser:asyncHandler(async(userId,name,email,phoneno)=>{
      await getDb().collection('userData').updateOne({_id:mongoDb.ObjectId(userId)},
      {
        $set:{name:name,email:email,phoneno:phoneno}
      })
    }),

    changePassword:asyncHandler(async(userId,newPassword)=>{
      
      await getDb().collection('userData').updateOne({_id:mongoDb.ObjectId(userId)},
      {
        $set:{password:newPassword}
      })
    }),

    findAll:asyncHandler(async()=>{
      const users=await getDb().collection('userData').find().toArray();
      return users;
    })
    
}