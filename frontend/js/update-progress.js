/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = "http://localhost:3000/api";

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
   STATE MODAL
=================================================== */
var layananDipilih = []; // [{IDLAYANANSERVIS, NAMA, BIAYAPOKOK}]
var sparepartDipilih = []; // [{IDSPAREPART, NAMA, HARGAJUAL, STOK, qty}]

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
        '<button class="btn btn-primary btn-sm btn-square" title="Update Progress" onclick="bukaModalProgress(' +
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
=================================================== */
function bukaModalProgress(idServis) {
  // Reset state
  layananDipilih = [];
  sparepartDipilih = [];
  document.getElementById("progressIdServis").value = idServis;
  document.getElementById("progressStatus").value = "";
  document.getElementById("progressKeterangan").value = "";
  document.getElementById("listCariLayanan").innerHTML = "";
  document.getElementById("listCariSparepart").innerHTML = "";
  document.getElementById("infoServis").innerHTML =
    '<div class="text-center text-muted py-2">' +
    '<div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>' +
    "Memuat info servis...</div>";

  new bootstrap.Modal(document.getElementById("modalProgress")).show();

  // Fetch detail servis (sudah include LAYANAN dari getServisById di backend)
  fetch(API_BASE_URL + "/servis/get/" + idServis, { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var s = res.data;

      // ── Info Servis + Daftar Layanan yang sudah ada ──
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
        // Tabel layanan yang sudah terdaftar
        '<div class="mt-2">' +
        '<p class="mb-1 small fw-semibold text-muted">Layanan Servis Terdaftar:</p>' +
        '<table class="table table-sm table-bordered mb-0">' +
        '<thead class="table-light"><tr>' +
        "<th>Nama Layanan</th>" +
        '<th class="text-end">Biaya</th>' +
        "</tr></thead>" +
        "<tbody>" +
        layananRows +
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
   CARI LAYANAN — per baris
=================================================== */
var layananRowCount = 0;

function tambahBarisCariLayanan() {
  var rowId = "layananRow" + ++layananRowCount;
  var html =
    '<div class="input-group mb-2 position-relative" id="' +
    rowId +
    '">' +
    '<input type="text" class="form-control form-control-sm" placeholder="Ketik nama layanan..." ' +
    "oninput=\"cariLayananInput(this, '" +
    rowId +
    "')\">" +
    '<button class="btn btn-outline-danger btn-sm" onclick="hapusBaris(\'' +
    rowId +
    "')\">" +
    '<i class="fa-solid fa-trash-can"></i>' +
    "</button>" +
    '<div class="dropdown-hasil-inline d-none" id="hasil' +
    rowId +
    '"></div>' +
    "</div>";
  document
    .getElementById("listCariLayanan")
    .insertAdjacentHTML("beforeend", html);
}

function cariLayananInput(input, rowId) {
  var keyword = input.value.trim().toLowerCase();
  var $box = document.getElementById("hasil" + rowId);

  if (!keyword) {
    $box.classList.add("d-none");
    $box.innerHTML = "";
    return;
  }

  fetch(API_BASE_URL + "/layanan-servis/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var list = (res.data || res)
        .filter(function (l) {
          return l.NAMA.toLowerCase().includes(keyword);
        })
        .slice(0, 6);

      $box.innerHTML = "";
      if (!list.length) {
        $box.innerHTML =
          '<div class="hasil-item text-muted">Tidak ditemukan</div>';
        $box.classList.remove("d-none");
        return;
      }
      list.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "hasil-item";
        div.innerHTML =
          '<span class="fw-semibold">' +
          escapeHtml(item.NAMA) +
          "</span>" +
          '<span class="text-muted ms-2">' +
          formatRupiah(item.BIAYAPOKOK) +
          "</span>";
        div.onclick = function () {
          if (
            layananDipilih.find(function (l) {
              return l.IDLAYANANSERVIS === item.IDLAYANANSERVIS;
            })
          ) {
            Swal.fire("Info", "Layanan sudah ditambahkan.", "info");
            return;
          }
          layananDipilih.push(item);
          input.value = item.NAMA + " — " + formatRupiah(item.BIAYAPOKOK);
          input.dataset.idLayanan = item.IDLAYANANSERVIS;
          input.readOnly = true;
          $box.classList.add("d-none");
        };
        $box.appendChild(div);
      });
      $box.classList.remove("d-none");
    });
}

/* ===================================================
   CARI SPAREPART — per baris
=================================================== */
var sparepartRowCount = 0;

function tambahBarisCariSparepart() {
  var rowId = "sparepartRow" + ++sparepartRowCount;
  var html =
    '<div class="mb-2 position-relative" id="' +
    rowId +
    '">' +
    '<div class="input-group input-group-sm">' +
    '<input type="text" class="form-control" placeholder="Ketik nama sparepart..." ' +
    "oninput=\"cariSparepartInput(this, '" +
    rowId +
    "')\">" +
    '<input type="number" class="form-control qty-input" placeholder="Qty" min="1" style="max-width:80px" ' +
    'id="qty' +
    rowId +
    '" disabled>' +
    '<button class="btn btn-outline-danger" onclick="hapusBaris(\'' +
    rowId +
    "', true)\">" +
    '<i class="fa-solid fa-trash-can"></i>' +
    "</button>" +
    "</div>" +
    '<div class="dropdown-hasil-inline d-none" id="hasil' +
    rowId +
    '"></div>' +
    "</div>";
  document
    .getElementById("listCariSparepart")
    .insertAdjacentHTML("beforeend", html);
}

function cariSparepartInput(input, rowId) {
  var keyword = input.value.trim().toLowerCase();
  var $box = document.getElementById("hasil" + rowId);

  if (!keyword) {
    $box.classList.add("d-none");
    $box.innerHTML = "";
    return;
  }

  fetch(API_BASE_URL + "/sparepart/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var list = (res.data || res)
        .filter(function (s) {
          return s.NAMA.toLowerCase().includes(keyword);
        })
        .slice(0, 6);

      $box.innerHTML = "";
      if (!list.length) {
        $box.innerHTML =
          '<div class="hasil-item text-muted">Tidak ditemukan</div>';
        $box.classList.remove("d-none");
        return;
      }
      list.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "hasil-item" + (item.STOK <= 0 ? " disabled-item" : "");
        div.innerHTML =
          '<span class="fw-semibold">' +
          escapeHtml(item.NAMA) +
          "</span>" +
          '<span class="text-muted ms-2">' +
          formatRupiah(item.HARGAJUAL) +
          "</span>" +
          (item.STOK <= 0
            ? '<span class="badge bg-danger ms-2">Stok Habis</span>'
            : '<span class="text-muted ms-2">Stok: ' + item.STOK + "</span>");
        div.onclick = function () {
          if (item.STOK <= 0) {
            Swal.fire("Peringatan", "Stok habis.", "warning");
            return;
          }
          input.value = item.NAMA;
          input.dataset.idSparepart = item.IDSPAREPART;
          input.dataset.stok = item.STOK;
          input.readOnly = true;
          var qtyInput = document.getElementById("qty" + rowId);
          qtyInput.disabled = false;
          qtyInput.max = item.STOK;
          qtyInput.value = 1;
          $box.classList.add("d-none");
        };
        $box.appendChild(div);
      });
      $box.classList.remove("d-none");
    });
}

function hapusBaris(rowId, isSp) {
  var el = document.getElementById(rowId);
  if (!el) return;
  var input = el.querySelector(
    "input[data-id-layanan], input[data-id-sparepart]",
  );
  if (input) {
    if (isSp && input.dataset.idSparepart) {
      var id = parseInt(input.dataset.idSparepart);
      sparepartDipilih = sparepartDipilih.filter(function (s) {
        return s.IDSPAREPART !== id;
      });
    } else if (!isSp && input.dataset.idLayanan) {
      var id = parseInt(input.dataset.idLayanan);
      layananDipilih = layananDipilih.filter(function (l) {
        return l.IDLAYANANSERVIS !== id;
      });
    }
  }
  el.remove();
}

/* ===================================================
   SIMPAN PROGRESS
=================================================== */
function simpanProgress() {
  var idServis = document.getElementById("progressIdServis").value;
  var status = document.getElementById("progressStatus").value;
  var keterangan = document.getElementById("progressKeterangan").value.trim();

  if (!status)
    return Swal.fire("Peringatan", "Pilih status terlebih dahulu.", "warning");

  // Kumpulkan layanan dari baris input
  var layananPayload = [];
  document
    .querySelectorAll("#listCariLayanan input[readonly]")
    .forEach(function (inp) {
      if (inp.dataset.idLayanan) {
        layananPayload.push({
          IDLAYANANSERVIS: parseInt(inp.dataset.idLayanan),
        });
      }
    });

  // Kumpulkan sparepart dari baris input
  var sparepartPayload = [];
  var valid = true;
  document.querySelectorAll("#listCariSparepart .mb-2").forEach(function (row) {
    var spInput = row.querySelector("input[data-id-sparepart]");
    var qtyInput = row.querySelector(".qty-input");
    if (!spInput || !qtyInput) return;
    var qty = parseInt(qtyInput.value);
    if (!qty || qty <= 0) {
      Swal.fire("Peringatan", "Isi jumlah sparepart yang valid.", "warning");
      valid = false;
      return;
    }
    if (qty > parseInt(spInput.dataset.stok)) {
      Swal.fire(
        "Peringatan",
        "Jumlah melebihi stok tersedia (" + spInput.dataset.stok + ").",
        "warning",
      );
      valid = false;
      return;
    }
    sparepartPayload.push({
      IDSPAREPART: parseInt(spInput.dataset.idSparepart),
      QTY: qty,
    });
  });

  if (!valid) return;

  var payload = {
    STATUS: status,
    KETERANGAN: keterangan || null,
  };
  if (layananPayload.length) payload.LAYANAN = layananPayload;
  if (sparepartPayload.length) payload.SPAREPART = sparepartPayload;

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
        text: "Progress servis berhasil diupdate.",
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
