
  const login = async (email, password) => {
    try {
      const res = await axios({
        method: 'POST', url: '/admin/login', data: { email, password }
      })
  
      location.assign('/admin')
    } catch (err) {
      document.querySelector('.alert').textContent = "invalid credentials";
    }
  }

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
      submitHandler:function(){
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
      }
    });
  });




