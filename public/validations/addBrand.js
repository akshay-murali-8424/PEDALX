$(document).ready(function () {
    $("#addBrand").validate({
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
          required: "Please enter your brand name",
        },  
        description: {
          required: "Please enter description",
        },
      },
    });
  });