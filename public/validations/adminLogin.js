$(document).ready(function () {
    $("#adminLogin").validate({
      errorClass: 'errors',
      rules: {
        email: {
          required: true,
        },
        password: {
          required: true,
        }
      },
      messages: {

        password: {
          required: "Please enter your password",
        },  
        email: {
          required: "Please enter your email",
        },
      },
    });
  });