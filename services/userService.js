const { getDb } = require("../db")
const {ObjectId}=require('mongodb')
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
        const isBlocked=false;
        const user=await getDb().collection('userData').insertOne({name,email,password,phoneno,isBlocked});
        return user;

    }),

    addUserGoogle:asyncHandler(async(name,email,picture)=>{
      const isBlocked=false;
      const isGoogleSigned=true;
      const user = await getDb().collection('userData').insertOne({name,email,isBlocked,isGoogleSigned,picture})
      return user;
    }),

    findUserForToken:asyncHandler(async(id)=>{
        const [user]=await getDb().collection('userData').find({_id:ObjectId(id)}).project({name:1,isBlocked:1}).toArray();
        return user;
    }),

    addAddress:asyncHandler(async (userId,address)=>{
        address.id=ObjectId()
      await getDb().collection('userData').updateOne({_id:ObjectId(userId)},{$push:{addresses:address}})
    }),

    editAddress:asyncHandler(async (userId,address,addressId)=>{
       await getDb().collection('userData').updateOne({_id:ObjectId(userId), 'addresses.id':ObjectId(addressId)},{
        $set:{
          'addresses.$.name':address.name,
          'addresses.$.house':address.house,
          'addresses.$.area':address.area,
          'addresses.$.city':address.city,
          'addresses.$.state':address.state,
          'addresses.$.country':address.country,
          'addresses.$.pincode':address.pincode
        }
       })

    }),

    deleteAddress:asyncHandler(async(userId,addressId)=>{
      await getDb().collection('userData').updateOne({_id:ObjectId(userId)},{
        $pull:{
          addresses:{id:ObjectId(addressId)}
        }
      })
    }),

    getUser:asyncHandler(async(userId)=>{
        const user=await getDb().collection('userData').findOne({_id:ObjectId(userId)})
        return user;
    }),

    getAddress:asyncHandler(async(userId)=>{
        const addresses=await getDb().collection('userData').find({_id:ObjectId(userId)}).project({addresses:1}).toArray()
        return addresses;
    }),

    getAddressForCheckout:asyncHandler(async(userId,addressId)=>{
        const addresses=await getDb().collection('userData').aggregate([
            {
                '$match': {
                  '_id': ObjectId(userId)
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
                  'addresses.id': ObjectId(addressId)
                }
              }
          ]).toArray()
          const address=addresses[0].addresses;
          return address;
    }),

    updateUser:asyncHandler(async(userId,name,email,phoneno)=>{
      await getDb().collection('userData').updateOne({_id:ObjectId(userId)},
      {
        $set:{name:name,email:email,phoneno:phoneno}
      })
    }),

    changePassword:asyncHandler(async(userId,newPassword)=>{
      
      await getDb().collection('userData').updateOne({_id:ObjectId(userId)},
      {
        $set:{password:newPassword}
      })
    }),

    findAll:asyncHandler(async()=>{
      const users=await getDb().collection('userData').find().toArray();
      return users;
    }),

    changeUserStatus:asyncHandler(async(userId)=>{
      const user=await getDb().collection('userData').findOne({_id:ObjectId(userId)})
      if(user.isBlocked){
        await getDb().collection('userData').updateOne({_id:ObjectId(userId)},{
          $set:{
            isBlocked:false
          }
        })
      }else{
        await getDb().collection('userData').updateOne({_id:ObjectId(userId)},{
          $set:{
            isBlocked:true
          }
        })
      }
    })
    
}