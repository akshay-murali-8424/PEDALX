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