function validateForm() {

    var name = document.getElementById("name").value;

    var age = document.getElementById("age").value;

    var phone = document.getElementById("phone").value;

    var address = document.getElementById("address").value;

    var service = document.getElementById("service").value;


    if (name == "") {
        alert("Please enter your name");
        return false;
    }

    if (age == "") {
        alert("Please enter your age");
        return false;
    }

    if (phone == "") {
        alert("Please enter your phone number");
        return false;
    }

    if (address == "") {
        alert("Please enter your address");
        return false;
    }

    if (service == "") {
        alert("Please select a service");
        return false;
    }


    alert("Registration Successful! Welcome to Vridha Sabha.");

    document.getElementById("message").innerHTML =
    "Thank you " + name + "! Your registration is successful.";

    return false;

}
