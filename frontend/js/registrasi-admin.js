(function () {
  "use strict";

  const API = "http://localhost:3000/api";

  // ── Spinner ──
  window.addEventListener("load", function () {
    var spinner = document.getElementById("spinner");
    if (spinner) spinner.classList.add("hide");
  });

  // ── Toggle password ──
  setupToggle("togglePass", "inputPassword", "pwIcon");
  setupToggle("toggleKonfirm", "inputKonfirmasi", "konfirmIcon");

  function setupToggle(btnId, inputId, iconId) {
    var btn = document.getElementById(btnId);
    var input = document.getElementById(inputId);
    var icon = document.getElementById(iconId);
    if (!btn || !input) return;
    btn.addEventListener("click", function () {
      var isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      if (icon) {
        icon.classList.toggle("fa-eye", !isPass);
        icon.classList.toggle("fa-eye-slash", isPass);
      }
    });
  }

  // ── Enter submit ──
  document.addEventListener("keydown", function (e) {
    if (e.key === "Enter") doDaftar();
  });

  var btnDaftar = document.getElementById("btnDaftar");
  if (btnDaftar) btnDaftar.addEventListener("click", doDaftar);

  // ══════════════════════════════════════════════
  //  REGISTRASI
  // ══════════════════════════════════════════════
  function doDaftar() {
    hideAlert();
    clearErrors();

    var nama = (document.getElementById("inputNama").value || "").trim();
    var username = (
      document.getElementById("inputUsername").value || ""
    ).trim();
    var tglLahir = (
      document.getElementById("inputTglLahir").value || ""
    ).trim();
    var jk = (document.getElementById("inputJK").value || "").trim();
    var password = document.getElementById("inputPassword").value || "";
    var konfirmasi = document.getElementById("inputKonfirmasi").value || "";

    // ── Validasi ──
    var valid = true;

    if (!nama) {
      setError("wrap-nama", "Nama lengkap wajib diisi.");
      valid = false;
    }
    if (!username) {
      setError("wrap-username", "Username wajib diisi.");
      valid = false;
    }
    if (!password) {
      setError("wrap-password", "Kata sandi wajib diisi.");
      valid = false;
    } else if (password.length < 6) {
      setError("wrap-password", "Kata sandi minimal 6 karakter.");
      valid = false;
    }
    if (!konfirmasi) {
      setError("wrap-konfirmasi", "Konfirmasi kata sandi wajib diisi.");
      valid = false;
    } else if (password && konfirmasi !== password) {
      setError("wrap-konfirmasi", "Kata sandi tidak cocok.");
      valid = false;
    }

    if (!valid) {
      showAlert(
        '<i class="fas fa-exclamation-circle"></i> Mohon periksa kembali isian form.',
      );
      return;
    }

    // ── Kirim ke backend ──
    setLoading(true);

    var payload = {
      NAMA: nama,
      USERNAME: username,
      PASSWORD: password,
      TANGGALLAHIR: tglLahir || null,
      JENISKELAMIN: jk || null,
    };

    fetch(API + "/user/create-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (res) {
        setLoading(false);

        if (res.success) {
          Swal.fire({
            title: "Berhasil!",
            text: "Akun admin berhasil dibuat. Silakan login.",
            icon: "success",
            confirmButtonColor: "#009CFF",
            confirmButtonText: "Login Sekarang",
          }).then(function () {
            window.location.href = "login.html";
          });
        } else {
          showAlert(
            '<i class="fas fa-exclamation-circle"></i> ' +
              (res.message || "Registrasi gagal."),
          );
          // Jika username sudah dipakai, highlight field username
          if (res.message && res.message.toLowerCase().includes("username")) {
            setError("wrap-username");
          }
        }
      })
      .catch(function () {
        setLoading(false);
        showAlert(
          '<i class="fas fa-exclamation-circle"></i> Tidak dapat terhubung ke server. Pastikan backend sudah berjalan.',
        );
      });
  }

  // ══════════════════════════════════════════════
  //  UI HELPERS
  // ══════════════════════════════════════════════
  function setLoading(state) {
    var btn = document.getElementById("btnDaftar");
    var btnText = document.getElementById("btnText");
    var btnSpin = document.getElementById("btnSpinner");
    var btnArr = document.getElementById("btnArrow");
    if (!btn) return;
    btn.disabled = state;
    if (btnText)
      btnText.textContent = state ? "Memproses..." : "Buat Akun Admin";
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

  function setError(wrapId, message) {
    var wrap = document.getElementById(wrapId);
    if (!wrap) return;
    wrap.classList.add("input-error");

    // Hapus pesan lama kalau ada
    var old = wrap.parentElement.querySelector(".field-error-msg");
    if (old) old.remove();

    if (message) {
      var msg = document.createElement("p");
      msg.className = "field-error-msg";
      msg.style.cssText =
        "font-size:.75rem;color:#ff4757;margin-top:4px;margin-left:2px";
      msg.textContent = message;
      wrap.parentElement.appendChild(msg);
    }
  }

  function clearErrors() {
    document.querySelectorAll(".input-group-custom").forEach(function (w) {
      w.classList.remove("input-error");
    });
    document.querySelectorAll(".field-error-msg").forEach(function (m) {
      m.remove();
    });
  }
})();
