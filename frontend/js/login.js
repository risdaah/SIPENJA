(function () {
  "use strict";

  const API = "http://localhost:3000/api";

  // ══════════════════════════════════════════════════════
  //  SESSION MANAGER
  // ══════════════════════════════════════════════════════
  window.Session = {
    TOKEN_KEY: "sipenja_token",
    USER_KEY: "sipenja_user",
    REMEMBER_KEY: "sipenja_remember", // username yang disimpan

    save: function (token, user) {
      localStorage.setItem(this.TOKEN_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    },

    getToken: function () {
      return localStorage.getItem(this.TOKEN_KEY) || null;
    },

    getUser: function () {
      try {
        return JSON.parse(localStorage.getItem(this.USER_KEY)) || null;
      } catch (e) {
        return null;
      }
    },

    isLoggedIn: function () {
      return !!this.getToken();
    },

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

    clear: function () {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
      // remember TIDAK dihapus saat logout
    },

    // ── Simpan / hapus username remember ──
    saveRemember: function (username) {
      localStorage.setItem(this.REMEMBER_KEY, username);
    },
    clearRemember: function () {
      localStorage.removeItem(this.REMEMBER_KEY);
    },
    getRemember: function () {
      return localStorage.getItem(this.REMEMBER_KEY) || "";
    },

    // ── GUARD ──────────────────────────────────────────
    guard: function (roles) {
      if (!this.isLoggedIn() || this.isExpired()) {
        this.clear();
        window.location.href = "login.html";
        return false;
      }
      if (roles && roles.length) {
        var user = this.getUser();
        if (!user || !roles.includes(user.ROLE)) {
          window.location.href = getDashboard(user ? user.ROLE : null);
          return false;
        }
      }
      return true;
    },

    logout: function () {
      var token = this.getToken();
      var self = this;
      if (token) {
        fetch(API + "/auth/logout", {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
        }).catch(function () {});
      }
      self.clear();
      window.location.href = "login.html";
    },

    setupAjax: function () {
      var token = this.getToken();
      if (!token) return;
      if (typeof $ !== "undefined" && $.ajaxSetup) {
        $.ajaxSetup({ headers: { Authorization: "Bearer " + token } });
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

  // ── Dashboard redirect berdasarkan role ──
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

  // ══════════════════════════════════════════════════════
  //  INIT — hanya berjalan di login.html
  // ══════════════════════════════════════════════════════
  window.addEventListener("load", function () {
    var spinner = document.getElementById("spinner");
    if (spinner) spinner.classList.add("hide");
  });

  // Auto-redirect kalau sudah login dan buka login.html lagi
  var fileName = (window.location.pathname || window.location.href)
    .split("/")
    .pop();
  var isLoginPage = !fileName || fileName === "" || fileName === "login.html";

  if (isLoginPage && Session.isLoggedIn() && !Session.isExpired()) {
    var _user = Session.getUser();
    window.location.href = getDashboard(_user ? _user.ROLE : null);
  }

  // ── Isi username dari remember ──
  var savedUsername = Session.getRemember();
  var inputUsername = document.getElementById("inputUsername");
  var inputPassword = document.getElementById("inputPassword");
  var chkRemember = document.getElementById("chkRemember");

  if (inputUsername && savedUsername) {
    inputUsername.value = savedUsername;
    if (chkRemember) chkRemember.checked = true;
    // Langsung fokus ke password supaya tinggal isi password
    if (inputPassword) inputPassword.focus();
  }

  // Toggle show/hide password
  var toggleBtn = document.getElementById("togglePass");
  if (toggleBtn && inputPassword) {
    toggleBtn.addEventListener("click", function () {
      var isPassword = inputPassword.type === "password";
      inputPassword.type = isPassword ? "text" : "password";
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
  if (btnLogin) btnLogin.addEventListener("click", doLogin);

  // ══════════════════════════════════════════════════════
  //  DO LOGIN
  // ══════════════════════════════════════════════════════
  function doLogin() {
    hideAlert();
    clearInputError();

    var username = (
      document.getElementById("inputUsername").value || ""
    ).trim();
    var password = document.getElementById("inputPassword").value || "";
    var remember = chkRemember ? chkRemember.checked : false;

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
          // Simpan atau hapus remember me
          if (remember) {
            Session.saveRemember(username);
          } else {
            Session.clearRemember();
          }

          Session.save(res.token, res.user);
          showSuccessThen(function () {
            window.location.href = getDashboard(res.user.ROLE);
          });
        } else {
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
    document.querySelectorAll(".input-group-custom").forEach(function (w) {
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

/* ══════════════════════════════════════════════════════════════
   TOPBAR AVATAR — inisial dari nama user yang sedang login
   Dipanggil otomatis saat DOM siap. Semua halaman pakai ini.
══════════════════════════════════════════════════════════════ */
(function () {
  // Warna avatar berdasarkan role
  var ROLE_COLORS = {
    admin:   { bg: "#DBEAFE", color: "#1D4ED8" },
    kasir:   { bg: "#DCFCE7", color: "#15803D" },
    mekanik: { bg: "#FEF3C7", color: "#B45309" },
  };

  function getInitials(nama) {
    if (!nama) return "?";
    var parts = nama.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  function applyAvatar() {
    var user = window.Session && Session.getUser();
    if (!user) return;

    var initials = getInitials(user.NAMA);
    var role     = (user.ROLE || "").toLowerCase();
    var scheme   = ROLE_COLORS[role] || { bg: "#E2E8F0", color: "#475569" };

    // Update semua elemen #topbarAvatar yang ada di halaman
    document.querySelectorAll("#topbarAvatar").forEach(function (el) {
      el.textContent      = initials;
      el.style.background = scheme.bg;
      el.style.color      = scheme.color;
    });

    // Update nama & role di topbar jika belum diisi JS lain
    var elNama = document.getElementById("navbar-nama");
    var elRole = document.getElementById("navbar-role");
    if (elNama && (!elNama.textContent || elNama.textContent === "—")) {
      elNama.textContent = user.NAMA;
    }
    if (elRole && (!elRole.textContent || elRole.textContent === "—")) {
      elRole.textContent = user.ROLE;
    }
  }

  // Jalankan setelah DOM siap
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyAvatar);
  } else {
    applyAvatar();
  }

  // Expose agar bisa dipanggil ulang setelah update nama profil
  window.applyTopbarAvatar = applyAvatar;
})();
