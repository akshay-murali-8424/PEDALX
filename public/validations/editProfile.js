document.getElementById('details-edit').addEventListener('click', e => {
  document.getElementById('details-form').disabled = false;
})

document.getElementById('edit-password').addEventListener('click', e => {
  document.getElementById('edit-password-form').disabled = false;
})

const editPersonalInfo = async (name, email, phoneno) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "/edit-personal-info",
      data: { name, email, phoneno},
    });
    Toastify({
      text: `${res.data.message}`,
      duration: 3000,
      gravity: "bottom",
      position: "center",
      style: {
        background: "linear-gradient(to right, #fe6d00, #ffb900)",
      },
    }).showToast();
  } catch (err) {
    document.querySelector('.alert').textContent = err.response.data.message;
  }
}

const changePassword = async (currentPassword, newPassword) => {
  try{

    const res = await axios({
      method: "PATCH",
      url: "/change-password",
      data: { currentPassword, newPassword},
    });
    Toastify({
      text: `${res.data.message}`,
      duration: 3000,
      gravity: "bottom",
      position: "center",
      style: {
        background: "linear-gradient(to right, #fe6d00, #ffb900)",
      },
    }).showToast();
    setTimeout(()=>{
      location.reload()
    },2500)
  }catch(err){
    document.querySelector('.alertpass').textContent = err.response.data.message;
  }
}

$(document).ready(function () {
  $("#personalDetails").validate({
    errorClass: "errors",
    rules: {
      name: {
        required: true,
      },
      email: {
        required: true,
      },
      phoneno: {
        required: true,
        digits: true,
        minlength: 10,
        maxlength: 10,
      },
    },
    messages: {
      name: {
        required: "Please enter your name",
      },
      email: {
        required: "Please enter your email",
      },
      phoneno: {
        required: "Please enter your phoneno",
        minlength: "Enter 10 digits",
        maxlength: "Enter 10 digits",
      },
    },
    submitHandler: function () {
     
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const phoneno = document.getElementById("phoneno").value;
      editPersonalInfo(name, email, phoneno);
    },
  });
});


$(document).ready(function () {
  $("#changePassword").validate({
    errorClass: "errors",
    rules: {
      currentPassword: {
        required: true,
      },
      newPassword: {
        required: true,
        minlength: 6,
      },
      confirmPassword: {
        required: true,
        minlength: 6,
        equalTo: "#newPassword",
      },
    },
    messages: {

      currentPassword: {
        required: "Please enter your current password",
      },
      newPassword: {
        required: "Please enter your password",
        minlength: "Password should be atleast 6 characters",
      },
      confirmPassword: {
        required: "Please enter your password",
        equalTo: "The password and confirmation password do not match",
      },
    },
    submitHandler: function () {
      const currentPassword = document.getElementById("currentPassword").value;
      const newPassword = document.getElementById("newPassword").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      changePassword(currentPassword, newPassword);
    },
  });
});