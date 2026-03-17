/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = "http://localhost:3000/api";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

/* ===== STATE ===== */
let allData = []; // ← semua data dari API
let filteredData = []; // ← data setelah filter/search
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

/* ===== JQUERY INIT ===== */
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
    loadRiwayat();
  });
})(jQuery);

/* ===== LOAD DATA ===== */
function loadRiwayat() {
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
      // Simpan ke allData — WAJIB, supaya filter bisa jalan
      allData = (res.data || []).filter(function (s) {
        return s.STATUS === "Selesai";
      });
      filteredData = allData;
      currentPage = 1;
      renderTable(filteredData);
    })
    .catch(function () {
      tbody.innerHTML =
        '<tr><td colspan="8" class="text-center py-4 text-danger">Gagal memuat data riwayat.</td></tr>';
    });
}

/* ===== FILTER & SEARCH ===== */
function searchData() {
  applyFilter();
}
function filterData() {
  applyFilter();
}

function applyFilter() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const dropdown = document.getElementById("filterDropdown").value;
  const tglMulai = document.getElementById("filterTanggalMulai").value;
  const tglAkhir = document.getElementById("filterTanggalAkhir").value;

  filteredData = allData.filter(function (item) {
    return filterItem(item, keyword, dropdown, tglMulai, tglAkhir);
  });
  currentPage = 1;
  renderTable(filteredData);
}

function filterItem(item, keyword, dropdown, tglMulai, tglAkhir) {
  const matchKeyword =
    !keyword ||
    (item.KODEANTRIAN ?? "").toLowerCase().includes(keyword) ||
    (item.NAMAPELANGGAN ?? "").toLowerCase().includes(keyword);

  const matchStatus = !dropdown || item.STATUS === dropdown;

  const tglItem = item.TANGGALMASUK ? item.TANGGALMASUK.substring(0, 10) : "";
  const matchTgl =
    (!tglMulai || tglItem >= tglMulai) && (!tglAkhir || tglItem <= tglAkhir);

  return matchKeyword && matchStatus && matchTgl;
}

function resetFilter() {
  document.getElementById("searchInput").value = "";
  document.getElementById("filterDropdown").value = "";
  document.getElementById("filterTanggalMulai").value = "";
  document.getElementById("filterTanggalAkhir").value = "";
  filteredData = allData;
  currentPage = 1;
  renderTable(filteredData);
}

/* ===== RENDER TABEL ===== */
function renderTable(data) {
  var tbody = document.getElementById("tableBody");
  var totalItems = data.length;

  if (!totalItems) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center py-4 text-muted">Belum ada riwayat pekerjaan selesai.</td></tr>';
    renderPagination(0);
    return;
  }

  var totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (currentPage > totalPages) currentPage = totalPages;

  var start = (currentPage - 1) * ITEMS_PER_PAGE;
  var pageData = data.slice(start, start + ITEMS_PER_PAGE);

  tbody.innerHTML = pageData
    .map(function (s, i) {
      var layananHtml = "-";
      if (s.LAYANAN && s.LAYANAN.length > 0) {
        layananHtml = s.LAYANAN.map(function (l) {
          return (
            '<span class="badge bg-light text-dark border me-1">' +
            escapeHtml(l.NAMA_LAYANAN || "-") +
            "</span>"
          );
        }).join("");
      }

      return (
        "<tr>" +
        '<td class="text-center">' +
        (start + i + 1) +
        "</td>" +
        '<td class="text-center fw-semibold">' +
        escapeHtml(s.KODEANTRIAN) +
        "</td>" +
        "<td>" +
        escapeHtml(s.NAMAPELANGGAN) +
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
        formatTanggal(s.TANGGALSELESAI) +
        "</td>" +
        '<td class="text-center">' +
        '<button class="btn btn-info btn-sm btn-square" title="Lihat Detail" onclick="bukaModalDetail(' +
        s.IDSERVIS +
        ')">' +
        '<i class="fa fa-eye"></i></button>' +
        "</td>" +
        "</tr>"
      );
    })
    .join("");

  renderPagination(totalItems);
}

/* ===== PAGINATION ===== */
function renderPagination(totalItems) {
  var totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  var container = document.getElementById("paginationContainer");
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  var start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  var end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);

  var pages =
    '<li class="page-item ' +
    (currentPage === 1 ? "disabled" : "") +
    '">' +
    '<a class="page-link" href="#" onclick="goToPage(' +
    (currentPage - 1) +
    ');return false;">' +
    '<i class="fa fa-chevron-left" style="font-size:11px"></i></a></li>';

  var sp = Math.max(1, currentPage - 2);
  var ep = Math.min(totalPages, sp + 4);
  if (ep - sp < 4) sp = Math.max(1, ep - 4);

  if (sp > 1) {
    pages +=
      '<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1);return false;">1</a></li>';
    if (sp > 2)
      pages +=
        '<li class="page-item disabled"><span class="page-link">…</span></li>';
  }
  for (var p = sp; p <= ep; p++) {
    pages +=
      '<li class="page-item ' +
      (p === currentPage ? "active" : "") +
      '">' +
      '<a class="page-link" href="#" onclick="goToPage(' +
      p +
      ');return false;">' +
      p +
      "</a></li>";
  }
  if (ep < totalPages) {
    if (ep < totalPages - 1)
      pages +=
        '<li class="page-item disabled"><span class="page-link">…</span></li>';
    pages +=
      '<li class="page-item"><a class="page-link" href="#" onclick="goToPage(' +
      totalPages +
      ');return false;">' +
      totalPages +
      "</a></li>";
  }
  pages +=
    '<li class="page-item ' +
    (currentPage === totalPages ? "disabled" : "") +
    '">' +
    '<a class="page-link" href="#" onclick="goToPage(' +
    (currentPage + 1) +
    ');return false;">' +
    '<i class="fa fa-chevron-right" style="font-size:11px"></i></a></li>';

  container.innerHTML =
    '<div class="d-flex justify-content-between align-items-center flex-wrap gap-2">' +
    '<small class="text-muted">Menampilkan ' +
    start +
    "–" +
    end +
    " dari " +
    totalItems +
    " data</small>" +
    '<ul class="pagination pagination-sm mb-0">' +
    pages +
    "</ul>" +
    "</div>";
}

function goToPage(page) {
  var total = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  if (page < 1 || page > total) return;
  currentPage = page;
  renderTable(filteredData);
}

/* ===== MODAL DETAIL ===== */
function bukaModalDetail(idServis) {
  var modalBody = document.getElementById("modalDetailBody");
  modalBody.innerHTML =
    '<div class="text-center py-4 text-muted">' +
    '<div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>' +
    "Memuat detail...</div>";

  new bootstrap.Modal(document.getElementById("modalDetail")).show();

  fetch(API_BASE_URL + "/servis/get/" + idServis, { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var s = res.data;

      var infoHtml =
        '<div class="row g-3 mb-4">' +
        '<div class="col-sm-4"><span class="text-muted small">Kode Antrian</span>' +
        '<div class="fw-semibold">' +
        escapeHtml(s.KODEANTRIAN) +
        "</div></div>" +
        '<div class="col-sm-4"><span class="text-muted small">Pelanggan</span>' +
        '<div class="fw-semibold">' +
        escapeHtml(s.NAMAPELANGGAN) +
        "</div></div>" +
        '<div class="col-sm-4"><span class="text-muted small">Status</span>' +
        "<div>" +
        badgeStatus(s.STATUS) +
        "</div></div>" +
        '<div class="col-sm-4"><span class="text-muted small">Keluhan</span>' +
        "<div>" +
        escapeHtml(s.KELUHAN || "-") +
        "</div></div>" +
        '<div class="col-sm-4"><span class="text-muted small">Tgl Masuk</span>' +
        "<div>" +
        formatTanggal(s.TANGGALMASUK) +
        "</div></div>" +
        '<div class="col-sm-4"><span class="text-muted small">Tgl Selesai</span>' +
        "<div>" +
        formatTanggal(s.TANGGALSELESAI) +
        "</div></div>" +
        "</div>";

      var layananRows =
        s.LAYANAN && s.LAYANAN.length
          ? s.LAYANAN.map(function (l) {
              return (
                "<tr><td>" +
                escapeHtml(l.NAMA_LAYANAN || "-") +
                "</td>" +
                '<td class="text-end">' +
                formatRupiah(l.BIAYA) +
                "</td></tr>"
              );
            }).join("")
          : '<tr><td colspan="2" class="text-muted fst-italic">Tidak ada layanan</td></tr>';

      var layananHtml =
        '<h6 class="fw-semibold mb-2"><i class="fa-solid fa-tag me-1 text-warning"></i>Layanan</h6>' +
        '<table class="table table-sm table-bordered mb-4">' +
        '<thead class="table-light"><tr><th>Nama Layanan</th><th class="text-end">Biaya</th></tr></thead>' +
        "<tbody>" +
        layananRows +
        "</tbody></table>";

      var sparepartRows =
        s.SPAREPART && s.SPAREPART.length
          ? s.SPAREPART.map(function (sp) {
              return (
                "<tr><td>" +
                escapeHtml(sp.NAMA_SPAREPART || sp.NAMA || "-") +
                "</td>" +
                '<td class="text-center">' +
                (sp.QTY || 0) +
                "</td>" +
                '<td class="text-end">' +
                formatRupiah(sp.HARGASATUAN) +
                "</td>" +
                '<td class="text-end">' +
                formatRupiah(sp.SUBTOTAL) +
                "</td></tr>"
              );
            }).join("")
          : '<tr><td colspan="4" class="text-muted fst-italic">Tidak ada sparepart</td></tr>';

      var sparepartHtml =
        '<h6 class="fw-semibold mb-2"><i class="fa fa-gear me-1 text-secondary"></i>Sparepart</h6>' +
        '<table class="table table-sm table-bordered mb-4">' +
        '<thead class="table-light"><tr><th>Nama Sparepart</th><th class="text-center">Qty</th>' +
        '<th class="text-end">Harga Satuan</th><th class="text-end">Subtotal</th></tr></thead>' +
        "<tbody>" +
        sparepartRows +
        "</tbody></table>";

      var progressHtml = "";
      if (s.PROGRESS && s.PROGRESS.length) {
        progressHtml =
          '<h6 class="fw-semibold mb-2"><i class="fa-solid fa-timeline me-1 text-primary"></i>Riwayat Progress</h6>' +
          '<div class="mb-4">' +
          s.PROGRESS.map(function (p) {
            return (
              '<div class="detail-progress-item">' +
              '<div class="d-flex justify-content-between align-items-center">' +
              "<span>" +
              badgeStatus(p.STATUS) +
              "</span>" +
              '<small class="text-muted">' +
              formatWaktu(p.WAKTU) +
              "</small></div>" +
              '<div class="small mt-1">' +
              escapeHtml(p.KETERANGAN || "-") +
              "</div></div>"
            );
          }).join("") +
          "</div>";
      }

      var totalLayanan = (s.LAYANAN || []).reduce(function (a, l) {
        return a + Number(l.BIAYA || 0);
      }, 0);
      var totalSparepart = (s.SPAREPART || []).reduce(function (a, sp) {
        return a + Number(sp.SUBTOTAL || 0);
      }, 0);
      var grandTotal = totalLayanan + totalSparepart;

      var totalHtml =
        '<div class="d-flex justify-content-end">' +
        '<div class="bg-light rounded px-4 py-2 text-end">' +
        '<div class="small text-muted mb-1">Layanan: <span class="fw-semibold">' +
        formatRupiah(totalLayanan) +
        "</span>" +
        ' &nbsp;+&nbsp; Sparepart: <span class="fw-semibold">' +
        formatRupiah(totalSparepart) +
        "</span></div>" +
        '<div>Total Biaya: <span class="fw-bold text-primary fs-5 ms-2">' +
        formatRupiah(grandTotal) +
        "</span></div>" +
        "</div></div>";

      modalBody.innerHTML =
        infoHtml + layananHtml + sparepartHtml + progressHtml + totalHtml;
    })
    .catch(function () {
      modalBody.innerHTML =
        '<div class="text-danger">Gagal memuat detail servis.</div>';
    });
}

/* ===== UTILS ===== */
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
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}

function formatWaktu(str) {
  if (!str) return "-";
  return new Date(str).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
