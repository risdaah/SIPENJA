(function () {
    "use strict";

    // ── Spinner: hide after page load ──
    window.addEventListener('load', function () {
        var spinner = document.getElementById('spinner');
        if (spinner) {
            spinner.classList.add('hide');
        }
    });

    // ── Toggle password visibility ──
    var toggleBtn = document.getElementById('togglePass');
    var passInput = document.getElementById('inputPassword');

    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', function () {
            var isPassword = passInput.type === 'password';
            passInput.type = isPassword ? 'text' : 'password';
            var icon = toggleBtn.querySelector('i');
            icon.classList.toggle('fa-eye', !isPassword);
            icon.classList.toggle('fa-eye-slash', isPassword);
        });
    }

    // ── Login button handler (placeholder) ──
    var btnLogin = document.getElementById('btnLogin');
    if (btnLogin) {
        btnLogin.addEventListener('click', function () {
            var email = document.getElementById('inputEmail').value.trim();
            var password = document.getElementById('inputPassword').value;

            if (!email || !password) {
                alert('Mohon isi email dan kata sandi.');
                return;
            }

            // TODO: integrate with backend authentication
            console.log('Login dengan:', email);
        });
    }

})();