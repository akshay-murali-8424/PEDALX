$(document).ready(function () {
    $("#addCategory").validate({
      errorClass: 'errors',
      rules: {
        name: {
          required: true,
        },
        description: {
          required: true,
        }
      },
      messages: {

        name: {
          required: "Please enter your password",
        },  
        description: {
          required: "Please enter your email",
        },
      },
    });
  });