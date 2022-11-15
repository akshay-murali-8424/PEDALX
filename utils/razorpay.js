const razorpay = require('razorpay')
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const crypto=require('crypto')

const instance = new razorpay({
    key_id: process.env.RAZOR_KEY_ID,
    key_secret: process.env.RAZOR_KEY_SECRET
})

module.exports = {
    generateRazorpay: async (orderId, total) => {
        try {
            total = parseInt(total);
            const order = await instance.orders.create(
                {
                    amount: total*100,
                    currency: "INR",
                    receipt: "" + orderId
                })
            return order;
        } catch (err) {
            console.log(err)
        }
    },

    verifyPayment:(razorpayResponse)=>{
      let hmac=crypto.createHmac('sha256',process.env.RAZOR_KEY_SECRET)
      hmac.update(razorpayResponse.razorpay_order_id+'|'+razorpayResponse.razorpay_payment_id)
      hmac=hmac.digest('hex')
      if(hmac===razorpayResponse.razorpay_signature){
        return true;
      }else{
        return false;
      }
    
    }


}
