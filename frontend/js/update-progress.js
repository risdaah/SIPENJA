/* ===== KONFIGURASI BASE URL API ===== */
// API_BASE_URL diambil dari js/config.js

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

/* ===================================================
   INIT
=================================================== */
(function ($) {
  "use strict";

  setTimeout(function () {
    if ($("#spinner").length > 0) $("#spinner").removeClass("show");
  }, 1);

  $(window).scroll(function () {
    $(this).scrollTop() > 300
      ? $(".back-to-top").fadeIn("slow")
      : $(".back-to-top").fadeOut("slow");
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 800);
    return false;
  });

  $(".sidebar-toggler").click(function () {
    $(".sidebar, .content").toggleClass("open");
    return false;
  });

  $(document).ready(function () {
    if (!Session.guard(["mekanik"])) return;
    Session.setupAjax();
    var _u = Session.getUser();
    if (_u) {
      $("#navbar-nama").text(_u.NAMA);
      $("#navbar-role").text(_u.ROLE);
    }
    loadServisAktif();
  });
})(jQuery);

/* ===================================================
   LOAD SERVIS AKTIF
   Hanya servis yang ditugaskan ke mekanik yang login
   dan belum Selesai
=================================================== */
function loadServisAktif() {
  var user = Session.getUser();
  if (!user) return;

  var tbody = document.getElementById("tableBody");
  tbody.innerHTML =
    '<tr><td colspan="8" class="text-center py-4 text-muted">' +
    '<div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>' +
    "Memuat data...</td></tr>";

  fetch(API_BASE_URL + "/servis/get-by-mekanik/" + user.IDUSER, {
    headers: getAuthHeaders(),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      // Filter hanya yang belum Selesai dan milik mekanik ini
      var list = (res.data || []).filter(function (s) {
        return (
          s.STATUS !== "Selesai" && String(s.IDUSER) === String(user.IDUSER)
        );
      });
      renderTable(list);
    })
    .catch(function () {
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center py-4 text-danger">Gagal memuat data servis.</td></tr>';
    });
}

function renderTable(list) {
  var tbody = document.getElementById("tableBody");
  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center py-4 text-muted">Tidak ada servis aktif yang ditugaskan.</td></tr>';
    return;
  }
  tbody.innerHTML = list
    .map(function (s, i) {
      // Susun layanan sebagai badge-badge kecil
      var layananHtml = "-";
      if (s.LAYANAN && s.LAYANAN.length > 0) {
        layananHtml = s.LAYANAN.map(function (l) {
          return (
            '<span class="badge bg-light text-dark border me-1">' +
            escapeHtml(l.NAMA_LAYANAN || l.NAMA || "-") +
            "</span>"
          );
        }).join("");
      }

      return (
        "<tr>" +
        '<td class="text-center">' +
        (i + 1) +
        "</td>" +
        '<td class="text-center fw-semibold">' +
        escapeHtml(s.KODEANTRIAN) +
        "</td>" +
        "<td>" +
        escapeHtml(s.NAMAPELANGGAN) +
        "</td>" +
        "<td>" +
        escapeHtml(s.KELUHAN || "-") +
        "</td>" +
        '<td class="layanan-cell">' +
        layananHtml +
        "</td>" +
        '<td class="text-center">' +
        badgeStatus(s.STATUS) +
        "</td>" +
        '<td class="text-center">' +
        formatTanggal(s.TANGGALMASUK) +
        "</td>" +
        '<td class="text-center">' +
        '<button class="btn btn-primary btn-sm btn-square" title="Update Status" onclick="bukaModalProgress(' +
        s.IDSERVIS +
        ')">' +
        '<i class="fa fa-pen-to-square"></i>' +
        "</button>" +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

/* ===================================================
   BUKA MODAL PROGRESS
   Hanya menampilkan info servis + pilih status + keterangan.
   Tambah layanan & sparepart sudah dipindahkan ke kasir.
=================================================== */
function bukaModalProgress(idServis) {
  document.getElementById("progressIdServis").value = idServis;
  document.getElementById("progressStatus").value = "";
  document.getElementById("progressKeterangan").value = "";
  document.getElementById("infoServis").innerHTML =
    '<div class="text-center text-muted py-2">' +
    '<div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>' +
    "Memuat info servis...</div>";

  new bootstrap.Modal(document.getElementById("modalProgress")).show();

  // Fetch detail servis untuk menampilkan info ringkas
  fetch(API_BASE_URL + "/servis/get/" + idServis, { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var s = res.data;

      // Baris layanan terdaftar (read-only, untuk referensi mekanik)
      var layananRows = "";
      if (s.LAYANAN && s.LAYANAN.length > 0) {
        layananRows = s.LAYANAN.map(function (l) {
          return (
            "<tr>" +
            "<td>" +
            escapeHtml(l.NAMA_LAYANAN || l.NAMA || "-") +
            "</td>" +
            '<td class="text-end">' +
            formatRupiah(l.BIAYA || l.BIAYAPOKOK) +
            "</td>" +
            "</tr>"
          );
        }).join("");
      } else {
        layananRows =
          '<tr><td colspan="2" class="text-muted fst-italic">Belum ada layanan</td></tr>';
      }

      // Baris sparepart terdaftar (read-only, untuk referensi mekanik)
      var sparepartRows = "";
      if (s.SPAREPART && s.SPAREPART.length > 0) {
        sparepartRows = s.SPAREPART.map(function (sp) {
          return (
            "<tr>" +
            "<td>" +
            escapeHtml(sp.NAMA_SPAREPART || sp.NAMA || "-") +
            "</td>" +
            '<td class="text-center">' +
            (sp.QTY || 0) +
            "</td>" +
            '<td class="text-end">' +
            formatRupiah(
              sp.HARGASATUAN || (sp.QTY ? sp.SUBTOTAL / sp.QTY : 0),
            ) +
            "</td>" +
            '<td class="text-end">' +
            formatRupiah(sp.SUBTOTAL) +
            "</td>" +
            "</tr>"
          );
        }).join("");
      } else {
        sparepartRows =
          '<tr><td colspan="4" class="text-muted fst-italic">Belum ada sparepart</td></tr>';
      }

      document.getElementById("infoServis").innerHTML =
        '<div class="row g-2 mb-3">' +
        '<div class="col-sm-4"><span class="text-muted small">Kode Antrian</span>' +
        '<div class="fw-semibold">' +
        escapeHtml(s.KODEANTRIAN) +
        "</div></div>" +
        '<div class="col-sm-4"><span class="text-muted small">Pelanggan</span>' +
        '<div class="fw-semibold">' +
        escapeHtml(s.NAMAPELANGGAN) +
        "</div></div>" +
        '<div class="col-sm-4"><span class="text-muted small">Status Saat Ini</span>' +
        "<div>" +
        badgeStatus(s.STATUS) +
        "</div></div>" +
        "</div>" +
        // Tabel layanan terdaftar (read-only)
        '<div class="mt-2 mb-3">' +
        '<p class="mb-1 small fw-semibold text-muted"><i class="fa-solid fa-tag me-1 text-warning"></i>Layanan Servis Terdaftar:</p>' +
        '<table class="table table-sm table-bordered mb-0">' +
        '<thead class="table-light"><tr>' +
        "<th>Nama Layanan</th>" +
        '<th class="text-end">Biaya</th>' +
        "</tr></thead>" +
        "<tbody>" +
        layananRows +
        "</tbody>" +
        "</table>" +
        "</div>" +
        // Tabel sparepart terdaftar (read-only)
        '<div class="mt-2">' +
        '<p class="mb-1 small fw-semibold text-muted"><i class="fa fa-gear me-1 text-secondary"></i>Sparepart Terdaftar:</p>' +
        '<table class="table table-sm table-bordered mb-0">' +
        '<thead class="table-light"><tr>' +
        "<th>Nama Sparepart</th>" +
        '<th class="text-center">Qty</th>' +
        '<th class="text-end">Harga Satuan</th>' +
        '<th class="text-end">Subtotal</th>' +
        "</tr></thead>" +
        "<tbody>" +
        sparepartRows +
        "</tbody>" +
        "</table>" +
        "</div>";

      // Pre-select status saat ini
      document.getElementById("progressStatus").value = s.STATUS;
    })
    .catch(function () {
      document.getElementById("infoServis").innerHTML =
        '<span class="text-danger">Gagal memuat info servis.</span>';
    });
}

/* ===================================================
   SIMPAN PROGRESS
   Mekanik hanya mengirim STATUS dan KETERANGAN.
   Layanan & sparepart tidak disertakan.
=================================================== */
function simpanProgress() {
  var idServis = document.getElementById("progressIdServis").value;
  var status = document.getElementById("progressStatus").value;
  var keterangan = document.getElementById("progressKeterangan").value.trim();

  if (!status)
    return Swal.fire("Peringatan", "Pilih status terlebih dahulu.", "warning");

  var payload = {
    STATUS: status,
    KETERANGAN: keterangan || null,
  };

  var $btn = document.getElementById("btnSimpanProgress");
  $btn.disabled = true;
  $btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';

  fetch(API_BASE_URL + "/servis/update-progress/" + idServis, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      $btn.disabled = false;
      $btn.innerHTML = "Simpan Progress";
      if (!res.success)
        throw new Error(res.message || "Gagal menyimpan progress");

      bootstrap.Modal.getInstance(
        document.getElementById("modalProgress"),
      ).hide();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Status servis berhasil diupdate.",
        timer: 1800,
        showConfirmButton: false,
      }).then(function () {
        loadServisAktif();
      });
    })
    .catch(function (err) {
      $btn.disabled = false;
      $btn.innerHTML = "Simpan Progress";
      Swal.fire(
        "Gagal",
        err.message || "Tidak dapat terhubung ke server.",
        "error",
      );
    });
}

/* ===================================================
   MODAL PETUNJUK
=================================================== */
function tampilkanPetunjuk() {
  new bootstrap.Modal(document.getElementById("modalPetunjuk")).show();
}

/* ===================================================
   UTILS
=================================================== */
function badgeStatus(status) {
  var map = {
    Belum: "bg-secondary",
    "Dalam Proses": "bg-warning text-dark",
    Selesai: "bg-success",
  };
  return (
    '<span class="badge ' +
    (map[status] || "bg-secondary") +
    '">' +
    escapeHtml(status || "-") +
    "</span>"
  );
}

function formatRupiah(angka) {
  return "Rp" + Number(angka || 0).toLocaleString("id-ID");
}

function formatTanggal(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
