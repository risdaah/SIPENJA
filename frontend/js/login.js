(function () {
  "use strict";

  const API = "http://localhost:3000/api"; // ← sesuaikan URL backend

  // ══════════════════════════════════════════════════════
  //  SESSION MANAGER — tersedia global sebagai window.Session
  //  Include login.js di setiap halaman agar Session bisa dipakai
  // ══════════════════════════════════════════════════════
  window.Session = {
    TOKEN_KEY: "sipenja_token",
    USER_KEY: "sipenja_user",

    // Simpan token & data user setelah login berhasil
    save: function (token, user) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    // Ambil JWT token
    getToken: function () {
      return localStorage.getItem(this.TOKEN_KEY) || null;
    },

    // Ambil data user { IDUSER, NAMA, USERNAME, ROLE, STATUS }
    getUser: function () {
      try {
        return JSON.parse(localStorage.getItem(this.USER_KEY)) || null;
      } catch (e) {
        return null;
      }
    },

    // Cek apakah sudah login (ada token)
    isLoggedIn: function () {
      return !!this.getToken();
    },

    // Cek apakah token sudah expired (client-side via JWT payload)
    isExpired: function () {
      var token = this.getToken();
      if (!token) return true;
      try {
        var payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
      } catch (e) {
        return true;
      }
    },

    // Hapus seluruh data sesi dari localStorage
    clear: function () {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    },

    // ── GUARD ─────────────────────────────────────────
    // Panggil di awal $(document).ready setiap halaman yang butuh login.
    // Jika tidak login / expired → redirect ke login otomatis.
    // Jika roles diisi → cek role user, jika tidak cocok → redirect dashboard.
    //
    // Contoh:
    //   Session.guard();                        // semua role boleh
    //   Session.guard(['admin']);               // hanya admin
    //   Session.guard(['admin', 'kasir']);      // admin atau kasir
    guard: function (roles) {
      if (!this.isLoggedIn() || this.isExpired()) {
        this.clear();
        // Dari subfolder (page-admin/page-kasir/page-mekanik) perlu naik satu level
        window.location.href = "login.html";
        return false;
      }
      if (roles && roles.length) {
        var user = this.getUser();
        if (!user || !roles.includes(user.ROLE)) {
          // Redirect ke dashboard sesuai role, dari dalam subfolder
          window.location.href = getDashboard(user ? user.ROLE : null);
          return false;
        }
      }
      return true;
    },

    // Logout: beritahu server + hapus sesi + redirect login
    logout: function () {
      var token = this.getToken();
      var self = this;
      if (token) {
        // Fire and forget — tidak perlu tunggu response
        fetch(API + "/auth/logout", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        }).catch(function () {});
      }
      self.clear();
      window.location.href = "login.html";
    },

    // Setup header Authorization otomatis untuk semua fetch / XMLHttpRequest.
    // Panggil sekali di $(document).ready halaman yang butuh auth.
    // Juga handle 401 expired → redirect login otomatis.
    setupAjax: function () {
      var token = this.getToken();
      if (!token) return;

      // Jika pakai jQuery $.ajax
      if (typeof $ !== "undefined" && $.ajaxSetup) {
        $.ajaxSetup({
          headers: { Authorization: "Bearer " + token },
        });

        // Handle 401 global (token expired di tengah sesi)
        $(document)
          .off("ajaxError.session")
          .on("ajaxError.session", function (event, xhr) {
            if (xhr.status === 401) {
              var res = xhr.responseJSON;
              if (res && res.expired) {
                Session.clear();
                Swal.fire({
                  title: "Sesi Berakhir",
                  text: "Sesi Anda telah habis. Silakan login kembali.",
                  icon: "warning",
                  confirmButtonColor: "#009CFF",
                  allowOutsideClick: false,
                }).then(function () {
                  window.location.href = "login.html";
                });
              }
            }
          });
      }
    },
  };

  // Dari login.html (root frontend)
  function getDashboard(role) {
    switch (role) {
      case "admin":
        return "dashboard-admin.html";
      case "kasir":
        return "transaksi-kasir.html";
      case "mekanik":
        return "update-progress.html";
      default:
        return "login.html";
    }
  }

  // Dari dalam subfolder (page-admin / page-kasir / page-mekanik)
  // Perlu naik satu level (..) sebelum masuk ke folder tujuan
  function getDashboardFromSub(role) {
    switch (role) {
      case "admin":
        return "dashboard-admin.html";
      case "kasir":
        return "transaksi-kasir.html";
      case "mekanik":
        return "update-progress.html";
      default:
        return "login.html";
    }
  }

  // ══════════════════════════════════════════════════════
  //  INIT — hanya dijalankan di halaman login.html
  // ══════════════════════════════════════════════════════

  // Spinner hide setelah halaman load
  window.addEventListener("load", function () {
    var spinner = document.getElementById("spinner");
    if (spinner) spinner.classList.add("hide");
  });

  // Auto-redirect: hanya jalan di halaman login.html
  // Kalau sudah login dan buka login.html lagi → langsung ke dashboard
  var currentPath = window.location.pathname || window.location.href;
  var fileName = currentPath.split("/").pop();
  if (!fileName || !fileName.includes(".html")) {
    fileName = currentPath.split("\\").pop();
  }
  var isLoginPage = fileName === "login.html";

  if (isLoginPage && Session.isLoggedIn() && !Session.isExpired()) {
    var _user = Session.getUser();
    window.location.href = getDashboard(_user ? _user.ROLE : null);
  }

  // Toggle show/hide password
  var toggleBtn = document.getElementById("togglePass");
  var passInput = document.getElementById("inputPassword");
  if (toggleBtn && passInput) {
    toggleBtn.addEventListener("click", function () {
      var isPassword = passInput.type === "password";
      passInput.type = isPassword ? "text" : "password";
      var icon = document.getElementById("pwIcon");
      if (icon) {
        icon.classList.toggle("fa-eye", !isPassword);
        icon.classList.toggle("fa-eye-slash", isPassword);
      }
    });
  }

  // Enter key untuk submit
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") doLogin();
  });

  // Klik tombol Masuk
  var btnLogin = document.getElementById("btnLogin");
  if (btnLogin) {
    btnLogin.addEventListener("click", doLogin);
  }

  // ══════════════════════════════════════════════════════
  //  DO LOGIN
  //  POST /api/auth/login { USERNAME, PASSWORD }
  //  Response: { success, token, user: { IDUSER, NAMA, USERNAME, ROLE, STATUS } }
  // ══════════════════════════════════════════════════════
  function doLogin() {
    hideAlert();
    clearInputError();

    var username = (
      document.getElementById("inputUsername").value || ""
    ).trim();
    var password = document.getElementById("inputPassword").value || "";

    // Validasi client-side
    if (!username) {
      showAlert(
        '<i class="fas fa-exclamation-circle"></i> Username tidak boleh kosong.',
      );
      setInputError("wrap-username");
      document.getElementById("inputUsername").focus();
      return;
    }
    if (!password) {
      showAlert(
        '<i class="fas fa-exclamation-circle"></i> Kata sandi tidak boleh kosong.',
      );
      setInputError("wrap-password");
      document.getElementById("inputPassword").focus();
      return;
    }

    setLoading(true);

    // Kirim ke backend
    fetch(API + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ USERNAME: username, PASSWORD: password }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (res) {
        setLoading(false);

        if (res.success) {
          // Simpan token + data user ke localStorage
          // res.user = { IDUSER, NAMA, USERNAME, ROLE, STATUS }
          Session.save(res.token, res.user);

          // Tampilkan sukses sebentar lalu redirect
          showSuccessThen(function () {
            window.location.href = getDashboard(res.user.ROLE);
          });
        } else {
          // Pesan dari backend (misal: "Username atau password salah")
          showAlert(
            '<i class="fas fa-exclamation-circle"></i> ' +
              (res.message || "Login gagal."),
          );
          setInputError("wrap-username");
          setInputError("wrap-password");
        }
      })
      .catch(function () {
        setLoading(false);
        showAlert(
          '<i class="fas fa-exclamation-circle"></i> Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.',
        );
      });
  }

  // ══════════════════════════════════════════════════════
  //  UI HELPERS
  // ══════════════════════════════════════════════════════

  function setLoading(state) {
    var btn = document.getElementById("btnLogin");
    var btnText = document.getElementById("btnText");
    var btnSpin = document.getElementById("btnSpinner");
    var btnArr = document.getElementById("btnArrow");

    if (!btn) return;
    btn.disabled = state;
    if (btnText) btnText.textContent = state ? "Memproses..." : "Masuk";
    if (btnSpin) btnSpin.style.display = state ? "inline" : "none";
    if (btnArr) btnArr.style.display = state ? "none" : "inline";
  }

  function showAlert(html) {
    var box = document.getElementById("alert-error");
    if (!box) return;
    box.innerHTML = html;
    box.style.display = "flex";
  }

  function hideAlert() {
    var box = document.getElementById("alert-error");
    if (box) box.style.display = "none";
  }

  function setInputError(wrapId) {
    var wrap = document.getElementById(wrapId);
    if (wrap) wrap.classList.add("input-error");
  }

  function clearInputError() {
    var wraps = document.querySelectorAll(".input-group-custom");
    wraps.forEach(function (w) {
      w.classList.remove("input-error");
    });
  }

  function showSuccessThen(callback) {
    if (typeof Swal !== "undefined") {
      Swal.fire({
        title: "Login Berhasil!",
        text: "Selamat datang di SIPENJA.",
        icon: "success",
        confirmButtonColor: "#009CFF",
        timer: 1200,
        timerProgressBar: true,
        showConfirmButton: false,
      }).then(callback);
    } else {
      callback();
    }
  }
})();
