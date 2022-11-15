const { getDb } = require("../db")
const { ObjectId } = require('mongodb')
const asyncHandler = require("express-async-handler");

module.exports = {
    createWallet:async(userId)=>{
        await getDb().collection('wallet').insertOne({
            user:userId,
            balance:0
        })
    },


    getWallet: async (userId) => {
        const wallet = await getDb().collection('wallet').findOne({ user: ObjectId(userId) })
        return wallet;
    },

    addTransaction: async (userId,amount,creditOrDebit) => {
        const date = new Date();
        var month = date.getUTCMonth() + 1; //months from 1-12
        var day = date.getUTCDate();
        var year = date.getUTCFullYear();
        var newdate = day + "/" + month + "/" + year;
        amount=parseInt(amount);
        const transactionId = ObjectId();
        await getDb().collection('wallet').updateOne({ user: ObjectId(userId) }, {
            $push: {
                transactions: {
                    id: transactionId,
                    status: "pending",
                    amount: amount,
                    credit:creditOrDebit,
                    date:newdate
                }
            },
        })
        return transactionId;
    },

    addMoney:async(userId,transactionId,amount,status)=>{
        amount=parseInt(amount)/100;
       await getDb().collection('wallet').updateOne({user:ObjectId(userId),"transactions.id":ObjectId(transactionId)},{
        $set:{
           "transactions.$.status":status
        },
        $inc:{
           balance: amount
        }
       })
    },

    refundToWallet:async(userId,amount,status)=>{
        const date = new Date();
        var month = date.getUTCMonth() + 1; //months from 1-12
        var day = date.getUTCDate();
        var year = date.getUTCFullYear();
        var newdate = day + "/" + month + "/" + year;
        amount=parseInt(amount);
        const transactionId = ObjectId();
        await getDb().collection('wallet').updateOne({ user: ObjectId(userId) }, {
            $push: {
                transactions: {
                    id: transactionId,
                    status: status,
                    amount: amount,
                    credit:true,
                    date:newdate
                }
            },
            $inc:{
                balance:amount
            }
        })
    },

    purchaseByWallet:async(userId,amount,status)=>{
        const date = new Date();
        var month = date.getUTCMonth() + 1; //months from 1-12
        var day = date.getUTCDate();
        var year = date.getUTCFullYear();
        var newdate = day + "/" + month + "/" + year;
        amount=parseInt(amount);
        const transactionId = ObjectId();
        await getDb().collection('wallet').updateOne({ user: ObjectId(userId) }, {
            $push: {
                transactions: {
                    id: transactionId,
                    status: status,
                    amount: amount,
                    credit:false,
                    date:newdate
                }
            },
            $inc:{
                balance: -(amount)
            }
        })
    }
}