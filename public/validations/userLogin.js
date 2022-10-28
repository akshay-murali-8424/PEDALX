
 const login = async (email,password) => {
    try {
      const res = await axios({
        method: 'POST', url: '/login', data: {email,password}
      })
		location.assign('/');
    } catch (err) {
	  document.querySelector('.alert').textContent = err.response.data.message;
      }
    }

$(document).ready(function () {
    $("#userLogin").validate({
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
       login(email,password);
      }
    });
  });