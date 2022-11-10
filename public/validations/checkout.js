

const addNewAddress = async (name, house, area, state, country, pincode) => {
  try {
    const res = await axios({
      method: "POST", url: "/add-address", data: { name, house, area, state, country, pincode }
    })
    location.reload()
  } catch (err) {
    document.querySelector('.alert').classList.remove('d-none')
  }
}


$(document).ready(function () {
  $("#add-address").validate({
    errorClass: 'errors',
    rules: {
      name: {
        required: true,
      },
      house: {
        required: true,
      },
      city: {
        required: true,
      },
      area: {
        required: true,
      },
      state: {
        required: true,
      },
      country: {
        required: true,
      },
      pincode: {
        required: true,
      },
    },
    messages: {

      name: {
        required: "field required",
      },
      house: {
        required: "field required",
      },
      city: {
        required: "field required",
      },
      area: {
        required: "field required",
      },
      state: {
        required: "field required",
      },
      country: {
        required: "field required",
      },
      pincode: {
        required: "field required",
      },
    },
    submitHandler: function () {
      const name = document.getElementById('name').value;
      const house = document.getElementById('house').value;
      const area = document.getElementById('area').value;
      const state = document.getElementById('state').value;
      const country = document.getElementById('country').value;
      const pincode = document.getElementById('pincode').value;
      addNewAddress(name, house, area, state, country, pincode);
    }
  });
});
  
  const verifyPayment=async(razorResponse,orderId)=>{
    try{
      const res = await axios({
        method: 'POST', url: '/verify-payment', data: { razorResponse,orderId }
      })
      console.log("payment Successfull")
      location.assign('/')
    }catch(err){
      console.log(err)
      Toastify({
        text: `${err.response.data.message}`,
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #fe6d00, #ffb900)",
        },
      }).showToast();
    }

  }





  const placeOrder = async (addressId, paymentMethod) => {
    try {
      const res = await axios({
        method: 'POST', url: '/checkout', data: { addressId, paymentMethod }
      })
      if (paymentMethod === "cod") {
        location.assign('/')
      } else if (paymentMethod === "razorpay") {

        const options = {
          "key": "rzp_test_fjHiuCYRBblZjU", // Enter the Key ID generated from the Dashboard
          "amount": res.data.amount+"", // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
          "currency": "INR",
          "name": "PEDELX",
          "description": "Test Transaction",
          "image": "/img/logopedalx.png",
          "order_id": res.data.razorId+"", //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
         
          "handler": function (response) {
           
            verifyPayment(response,res.data.orderId)
          },
          "prefill": {
            "name": res.data.userName,
            "email":res.data.userEmail,
            "contact": res.data.userPhone
          },
          "notes": {
            "address": "Razorpay Corporate Office"
          },
          "theme": {
            "color": "#3399cc"
          }
        };
        const rzp1 = new Razorpay(options);
        rzp1.open();
      }else if(paymentMethod === "paypal"){
        location.assign(res.data.paypalLink)
      }
    }
    catch (err) {
      console.log(err);
      Toastify({
        text: `${err.response.data.message}`,
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "linear-gradient(to right, #fe6d00, #ffb900)",
        },
      }).showToast();
    }
  }


  document.getElementById('proceed').addEventListener('click', e => {
    e.preventDefault();
    if (!document.querySelector('input[name="address"]:checked')) {
      document.querySelector('.address-alert').classList.remove('d-none')
      return
    }
    if (!document.querySelector('input[name="payment-option"]:checked')) {
      document.querySelector('.payment-alert').classList.remove('d-none')
      return
    }
    const addressId = document.querySelector('input[name="address"]:checked').value;
    const paymentMethod = document.querySelector('input[name="payment-option"]:checked').value;

    placeOrder(addressId, paymentMethod);

  })

