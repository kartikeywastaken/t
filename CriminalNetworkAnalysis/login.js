document.addEventListener("DOMContentLoaded", function () {

    const loginForm = document.querySelector(".login-box form");

    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            window.location.href = "dashboard.html";
        });
    }

    const passwordInput = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");

    if (passwordInput && passwordToggle) {
        passwordToggle.addEventListener("click", function () {

            if (passwordInput.type === "password") {
                passwordInput.type = "text";
                passwordToggle.setAttribute("aria-label", "Hide password");
            } else {
                passwordInput.type = "password";
                passwordToggle.setAttribute("aria-label", "Show password");
            }

        });
    }

});