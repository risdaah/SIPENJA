/* ===== KONFIGURASI ===== */
const API_BASE_URL = "http://localhost:3000/api";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

/* ===== SIDEBAR CONFIG PER ROLE ===== */
const SIDEBAR_MENUS = {
  admin: {
    home: "dashboard-admin.html",
    menus: [
      {
        href: "dashboard-admin.html",
        icon: "fa-solid fa-square-poll-vertical",
        label: "Dashboard",
      },
      {
        href: "kategori-sparepart.html",
        icon: "fa fa-th",
        label: "Kategori Sparepart",
      },
      { href: "sparepart.html", icon: "fa-solid fa-gear", label: "Sparepart" },
      {
        href: "layanan-servis.html",
        icon: "fa-solid fa-tag",
        label: "Layanan Servis",
      },
      {
        href: "supplier.html",
        icon: "fa-solid fa-cart-flatbed",
        label: "Supplier",
      },
      { href: "laporan.html", icon: "fa-solid fa-copy", label: "Laporan" },
      {
        href: "transaksi.html",
        icon: "fa-solid fa-bag-shopping",
        label: "Transaksi",
      },
      {
        href: "karyawan.html",
        icon: "fa-solid fa-user-group",
        label: "Karyawan",
      },
    ],
  },
  kasir: {
    home: "transaksi-kasir.html",
    menus: [
      {
        href: "transaksi-kasir.html",
        icon: "fa-solid fa-house",
        label: "Transaksi",
      },
      { href: "sparepart-kasir.html", icon: "fa fa-gear", label: "Sparepart" },
      {
        href: "layanan-servis-kasir.html",
        icon: "fa-solid fa-tag",
        label: "Layanan Servis",
      },
      {
        href: "perbarui-transaksi-kasir.html",
        icon: "fa-solid fa-bag-shopping",
        label: "Perbarui Transaksi",
      },
      {
        href: "riwayat-transaksi-kasir.html",
        icon: "fa-solid fa-clock-rotate-left",
        label: "Riwayat Transaksi",
      },
    ],
  },
  mekanik: {
    home: "update-progress.html",
    menus: [
      {
        href: "update-progress.html",
        icon: "fa-solid fa-house",
        label: "Update Progress",
      },
      {
        href: "riwayat-pekerjaan.html",
        icon: "fa-solid fa-clock-rotate-left",
        label: "Riwayat Pekerjaan",
      },
    ],
  },
};

/* ===== STATE ===== */
var userData = null;

/* ===== INIT ===== */
(function ($) {
  "use strict";

  setTimeout(function () {
    if ($("#spinner").length > 0) $("#spinner").removeClass("show");
  }, 1);

  $(document).ready(function () {
    if (!Session.guard(["admin", "kasir", "mekanik"])) return;
    Session.setupAjax();

    var user = Session.getUser();
    if (!user) return;

    renderSidebar(user.ROLE);

    $("#navbar-nama").text(user.NAMA);
    $("#navbar-role").text(user.ROLE);

    var badge = document.getElementById("page-role-badge");
    if (badge) {
      badge.textContent = user.ROLE;
      badge.className = "role-badge " + user.ROLE;
    }

    loadProfil(user.IDUSER);

    $(".sidebar-toggler").click(function () {
      $(".sidebar, .content").toggleClass("open");
      return false;
    });

    $(window).scroll(function () {
      $(this).scrollTop() > 300
        ? $(".back-to-top").fadeIn("slow")
        : $(".back-to-top").fadeOut("slow");
    });
    $(".back-to-top").click(function () {
      $("html, body").animate({ scrollTop: 0 }, 800);
      return false;
    });
  });
})(jQuery);

/* ===== RENDER SIDEBAR ===== */
function renderSidebar(role) {
  var config = SIDEBAR_MENUS[role];
  if (!config) return;

  var brand = document.getElementById("sidebar-brand");
  var brandMobile = document.getElementById("navbar-brand-mobile");
  if (brand) brand.href = config.home;
  if (brandMobile) brandMobile.href = config.home;

  var menuEl = document.getElementById("sidebar-menu");
  if (!menuEl) return;
  menuEl.innerHTML = config.menus
    .map(function (m) {
      return (
        '<a href="' +
        m.href +
        '" class="nav-item nav-link">' +
        '<i class="' +
        m.icon +
        ' me-2"></i>' +
        m.label +
        "</a>"
      );
    })
    .join("");
}

/* ===== KEMBALI ===== */
function kembali() {
  var user = Session.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  window.location.href = (SIDEBAR_MENUS[user.ROLE] || {}).home || "login.html";
}

/* ===== LOAD PROFIL ===== */
async function loadProfil(idUser) {
  try {
    const res = await fetch(API_BASE_URL + "/user/get/" + idUser, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    userData = json.data;
    renderProfil(userData);
  } catch (err) {
    Swal.fire("Error", "Gagal memuat data profil: " + err.message, "error");
  }
}

function renderProfil(d) {
  document.getElementById("profileNamaDisplay").textContent = d.NAMA || "—";
  document.getElementById("profileUsernameDisplay").textContent =
    "@" + (d.USERNAME || "—");
  document.getElementById("profileDateCreated").textContent = d.DATECREATED
    ? formatTanggal(d.DATECREATED)
    : "—";

  document.getElementById("inputNama").value = d.NAMA || "";
  document.getElementById("inputUsername").value = d.USERNAME || "";
  document.getElementById("inputTglLahir").value = d.TANGGALLAHIR
    ? new Date(d.TANGGALLAHIR).toISOString().split("T")[0]
    : "";
  document.getElementById("inputJK").value = d.JENISKELAMIN || "";
}

/* ===== SIMPAN PROFIL ===== */
async function simpanProfil() {
  var nama = document.getElementById("inputNama").value.trim();
  var username = document.getElementById("inputUsername").value.trim();
  var tglLahir = document.getElementById("inputTglLahir").value;
  var jk = document.getElementById("inputJK").value;

  if (!nama)
    return Swal.fire("Peringatan", "Nama lengkap wajib diisi.", "warning");
  if (!username)
    return Swal.fire("Peringatan", "Username wajib diisi.", "warning");

  var btn = document.getElementById("btnSimpanProfil");
  btn.disabled = true;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';

  try {
    const res = await fetch(API_BASE_URL + "/user/update/" + userData.IDUSER, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        NAMA: nama,
        USERNAME: username,
        TANGGALLAHIR: tglLahir || null,
        JENISKELAMIN: jk || null,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    // Update session
    var sessionUser = Session.getUser();
    sessionUser.NAMA = nama;
    sessionUser.USERNAME = username;
    Session.save(Session.getToken(), sessionUser);

    // Update tampilan
    document.getElementById("navbar-nama").textContent = nama;
    document.getElementById("profileNamaDisplay").textContent = nama;
    document.getElementById("profileUsernameDisplay").textContent =
      "@" + username;
    userData.NAMA = nama;
    userData.USERNAME = username;
    userData.TANGGALLAHIR = tglLahir || null;
    userData.JENISKELAMIN = jk || null;

    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Data profil berhasil diperbarui.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire("Gagal", err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-floppy-disk me-1"></i>Simpan Perubahan';
  }
}

function batalEditProfil() {
  if (userData) renderProfil(userData);
}

/* ===== SIMPAN PASSWORD ===== */
async function simpanPassword() {
  var pwBaru = document.getElementById("inputPwBaru").value;
  var pwKonfirm = document.getElementById("inputPwKonfirm").value;

  if (!pwBaru)
    return Swal.fire("Peringatan", "Password baru wajib diisi.", "warning");
  if (pwBaru.length < 6)
    return Swal.fire("Peringatan", "Password minimal 6 karakter.", "warning");
  if (pwBaru !== pwKonfirm)
    return Swal.fire(
      "Peringatan",
      "Konfirmasi password tidak cocok.",
      "warning",
    );

  var btn = document.getElementById("btnSimpanPassword");
  btn.disabled = true;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';

  try {
    const res = await fetch(
      API_BASE_URL + "/user/update-password/" + userData.IDUSER,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ PASSWORD: pwBaru }),
      },
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message);
    batalGantiPassword();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Password berhasil diperbarui.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire("Gagal", err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-key me-1"></i>Ganti Password';
  }
}

function batalGantiPassword() {
  document.getElementById("inputPwBaru").value = "";
  document.getElementById("inputPwKonfirm").value = "";
}

/* ===== TOGGLE PASSWORD ===== */
function togglePw(inputId, iconId) {
  var input = document.getElementById(inputId);
  var icon = document.getElementById(iconId);
  if (!input) return;
  var isPass = input.type === "password";
  input.type = isPass ? "text" : "password";
  if (icon) {
    icon.classList.toggle("fa-eye", !isPass);
    icon.classList.toggle("fa-eye-slash", isPass);
  }
}

/* ===== UTILS ===== */
function formatTanggal(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/* ===== LOGOUT ===== */
function confirmLogout() {
  Swal.fire({
    title: "Keluar dari SIPENJA?",
    text: "Sesi Anda akan diakhiri.",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#ff4757",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Keluar",
    cancelButtonText: "Batal",
  }).then(function (result) {
    if (result.isConfirmed) Session.logout();
  });
}
