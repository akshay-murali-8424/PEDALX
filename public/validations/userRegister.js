//axios
const register = async (name, email, password, confirmPassword, phoneno) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/register",
      data: { name, email, password, confirmPassword, phoneno },
    });
    if (res.data.status === "email") {
      document.querySelector(".alert").textContent = res.data.message;
    } else if (res.data.status === "phoneno") {
      document.querySelector(".alert").textContent = res.data.message;
    } else {
      location.assign("/");
    }
  } catch (err) {
    console.log(err);
  }
};

$(document).ready(function () {
  $("#registerForm").validate({
    errorClass: "errors",
    rules: {
      name: {
        required: true,
      },
      email: {
        required: true,
      },
      password: {
        required: true,
        minlength: 6,
      },
      confirmPassword: {
        required: true,
        minlength: 6,
        equalTo: "#password",
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
      password: {
        required: "Please enter your password",
        minlength: "Password should be atleast 6 characters",
      },
      confirmPassword: {
        required: "Please enter your password",
        equalTo: "The password and confirmation password do not match",
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
      const password = document.getElementById("password").value;
      const confirmPassword = document.getElementById("confirmPassword").value;
      const phoneno = document.getElementById("phoneno").value;
      register(name, email, password, confirmPassword, phoneno);
    },
  });
});
