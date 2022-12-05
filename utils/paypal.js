const paypal = require('paypal-rest-sdk')
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': process.env.PAYPAL_CLIENT_ID,
    'client_secret': process.env.PAYPAL_SECRET
});

module.exports = {
    generatePayPal: (userId,total,callback) => {
        try {
            total=total/80;
            const create_payment_json = {
                "intent": "sale",
                "payer": {
                    "payment_method": "paypal"
                },
                "redirect_urls": {
                    "return_url": "https://www.pedalx.shop/success",
                    "cancel_url": "https://www.pedalx.shop/cancel"
                },
                "transactions": [{
                    "item_list": {
                        "items": [{
                            "name": "item",
                            "sku": userId,
                            "price": Math.ceil(total),
                            "currency": "USD",
                            "quantity": 1
                        }]
                    },
                    "amount": {
                        "currency": "USD",
                        "total": Math.ceil(total),
                    },
                    "description": "This is the payment description."
                }]
            };


             paypal.payment.create(create_payment_json, function (error, payment) {
                 if (error) {
                    throw error;
                } else {
                    console.log("Create Payment Response");
                    for (let i = 0; i < payment.links.length; i++) {
                        if (payment.links[i].rel === "approval_url") {
                            const paypalLink = payment.links[i].href;
                            callback(paypalLink);
                        }
                    }
                }
            });

        } catch (err) {
            console.log(err);
        }
    },

    executePaypal:(payerId,paymentId,total,callback)=>{
        try{
            total=total/80;
            const execute_payment_json = {
                "payer_id": payerId,
                "transactions": [{
                    "amount": {
                        "currency": "USD",
                        "total": Math.ceil(total),
                    }
                }]
            };
            
            paypal.payment.execute(paymentId, execute_payment_json,function(error,payment){
                if(error){
                    throw error;
                }else{
                    callback();
                }
            })
        }catch(err){
            console.log(err)
        }
    }
}