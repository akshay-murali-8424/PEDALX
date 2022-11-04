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
          required: "Please enter category",
        },  
        description: {
          required: "Please enter description",
        },
      },
    });
  });