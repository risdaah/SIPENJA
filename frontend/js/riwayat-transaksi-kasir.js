/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = "http://localhost:3000/api";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

(function ($) {
  "use strict";

  // Spinner
  setTimeout(function () {
    if ($("#spinner").length > 0) $("#spinner").removeClass("show");
  }, 1);

  // Back to top
  $(window).scroll(function () {
    $(this).scrollTop() > 300
      ? $(".back-to-top").fadeIn("slow")
      : $(".back-to-top").fadeOut("slow");
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 800);
    return false;
  });

  // Sidebar Toggler
  $(".sidebar-toggler").click(function () {
    $(".sidebar, .content").toggleClass("open");
    return false;
  });
})(jQuery);

/* ===== STATE ===== */
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

/* ===== INIT ===== */
document.addEventListener("DOMContentLoaded", () => {
  if (!Session.guard(["kasir"])) return;
  Session.setupAjax();

  const _u = Session.getUser();
  if (_u) {
    const elNama = document.getElementById("navbar-nama");
    const elRole = document.getElementById("navbar-role");
    if (elNama) elNama.textContent = _u.NAMA;
    if (elRole) elRole.textContent = _u.ROLE;
  }

  // Enter pada search
  document
    .getElementById("searchInput")
    .addEventListener("keyup", function (e) {
      if (e.key === "Enter") searchData();
    });

  loadRiwayat();
});

/* ===== LOAD DATA ===== */
async function loadRiwayat() {
  try {
    const res = await fetch(`${API_BASE_URL}/transaksi/get-all`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Gagal mengambil data");
    const json = await res.json();
    allData = json.data ?? [];
    filteredData = allData;
    currentPage = 1;
    renderTable(filteredData);
  } catch (err) {
    renderError(err.message);
  }
}

/* ===== RENDER TABLE ===== */
function renderTable(data) {
  const tbody = document.getElementById("tableBody");

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Tidak ada data transaksi.</td></tr>`;
    renderPagination(0);
    return;
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * itemsPerPage;
  const pageData = data.slice(start, start + itemsPerPage);

  tbody.innerHTML = pageData
    .map((item, i) => {
      const jenisBadge =
        item.JENISTRANSAKSI === "SERVIS"
          ? '<span class="badge bg-primary">Servis</span>'
          : '<span class="badge bg-success">Pembelian</span>';

      return `
      <tr>
        <td class="text-center">${start + i + 1}</td>
        <td class="text-center fw-semibold">${escapeHtml(item.NOTRANSAKSI)}</td>
        <td class="text-center">${formatTanggal(item.TANGGAL)}</td>
        <td class="text-center">${jenisBadge}</td>
        <td class="text-end">${formatRupiah(item.TOTAL)}</td>
        <td class="text-center">${escapeHtml(item.NAMA_KASIR ?? "-")}</td>
        <td>${escapeHtml(item.CATATAN ?? "-")}</td>
        <td class="text-center">
          <button class="btn btn-primary btn-sm btn-square" title="Lihat Detail"
            onclick="lihatDetail(${item.IDTRANSAKSI})">
            <i class="fa fa-eye"></i>
          </button>
        </td>
      </tr>`;
    })
    .join("");

  renderPagination(totalItems);
}

/* ===== PAGINATION ===== */
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const container = document.getElementById("paginationContainer");

  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  let pages = "";
  pages += `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
      <i class="fa fa-chevron-left" style="font-size:11px"></i>
    </a></li>`;

  let sp = Math.max(1, currentPage - 2);
  let ep = Math.min(totalPages, sp + 4);
  if (ep - sp < 4) sp = Math.max(1, ep - 4);

  if (sp > 1) {
    pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
    if (sp > 2)
      pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
  }
  for (let p = sp; p <= ep; p++) {
    pages += `<li class="page-item ${p === currentPage ? "active" : ""}">
      <a class="page-link" href="#" onclick="goToPage(${p}); return false;">${p}</a></li>`;
  }
  if (ep < totalPages) {
    if (ep < totalPages - 1)
      pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
  }
  pages += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
      <i class="fa fa-chevron-right" style="font-size:11px"></i>
    </a></li>`;

  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center flex-wrap gap-2">
      <small class="text-muted">Menampilkan ${start}–${end} dari ${totalItems} data</small>
      <ul class="pagination pagination-sm mb-0">${pages}</ul>
    </div>`;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable(filteredData);
}

/* ===== SEARCH ===== */
function searchData() {
  applyFilter();
}

/* ===== FILTER ===== */
function filterData() {
  applyFilter();
}

function applyFilter() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const jenis = document.getElementById("filterJenis").value;
  const tglMulai = document.getElementById("filterTanggalMulai").value;
  const tglAkhir = document.getElementById("filterTanggalAkhir").value;

  filteredData = allData.filter((item) => {
    // Filter keyword
    const matchKeyword =
      !keyword ||
      (item.NOTRANSAKSI ?? "").toLowerCase().includes(keyword) ||
      (item.NAMA_KASIR ?? "").toLowerCase().includes(keyword);

    // Filter jenis
    const matchJenis = !jenis || item.JENISTRANSAKSI === jenis;

    // Filter tanggal
    const tglItem = item.TANGGAL ? item.TANGGAL.substring(0, 10) : "";
    const matchMulai = !tglMulai || tglItem >= tglMulai;
    const matchAkhir = !tglAkhir || tglItem <= tglAkhir;

    return matchKeyword && matchJenis && matchMulai && matchAkhir;
  });

  currentPage = 1;
  renderTable(filteredData);
}

function resetFilter() {
  document.getElementById("filterJenis").value = "";
  document.getElementById("filterTanggalMulai").value = "";
  document.getElementById("filterTanggalAkhir").value = "";
  document.getElementById("searchInput").value = "";
  filteredData = allData;
  currentPage = 1;
  renderTable(filteredData);
}

/* ===== DETAIL TRANSAKSI ===== */
async function lihatDetail(id) {
  const modal = new bootstrap.Modal(document.getElementById("modalDetail"));
  document.getElementById("modalDetailBody").innerHTML =
    `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>`;
  modal.show();

  try {
    const res = await fetch(`${API_BASE_URL}/transaksi/get/${id}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok || !json.success)
      throw new Error(json.message || "Gagal memuat detail");

    const d = json.data;
    const isServis = d.JENISTRANSAKSI === "SERVIS";

    let html = `
      <!-- Info Transaksi -->
      <div class="row g-3 mb-4">
        <div class="col-sm-6">
          <div class="mb-2"><span class="text-muted small">No. Transaksi</span><div class="fw-semibold">${escapeHtml(d.NOTRANSAKSI)}</div></div>
          <div class="mb-2"><span class="text-muted small">Tanggal</span><div class="fw-semibold">${formatTanggal(d.TANGGAL)}</div></div>
          <div class="mb-2"><span class="text-muted small">Jenis</span><div>
            ${isServis ? '<span class="badge bg-primary">Servis Kendaraan</span>' : '<span class="badge bg-success">Pembelian Sparepart</span>'}
          </div></div>
        </div>
        <div class="col-sm-6">
          <div class="mb-2"><span class="text-muted small">Kasir</span><div class="fw-semibold">${escapeHtml(d.NAMA_KASIR ?? "-")}</div></div>
          <div class="mb-2"><span class="text-muted small">Total</span><div class="fw-bold text-primary fs-6">${formatRupiah(d.TOTAL)}</div></div>
          <div class="mb-2"><span class="text-muted small">Catatan</span><div>${escapeHtml(d.CATATAN ?? "-")}</div></div>
        </div>
      </div>
      <hr>`;

    // ── SERVIS ──
    if (isServis && d.SERVIS) {
      const s = d.SERVIS;
      html += `
        <h6 class="fw-bold mb-3"><i class="fa-solid fa-screwdriver-wrench me-2 text-primary"></i>Info Servis</h6>
        <div class="row g-3 mb-3">
          <div class="col-sm-6">
            <div class="mb-2"><span class="text-muted small">Kode Antrian</span><div class="fw-semibold">${escapeHtml(s.KODEANTRIAN)}</div></div>
            <div class="mb-2"><span class="text-muted small">Nama Pelanggan</span><div class="fw-semibold">${escapeHtml(s.NAMAPELANGGAN)}</div></div>
            <div class="mb-2"><span class="text-muted small">Keluhan</span><div>${escapeHtml(s.KELUHAN ?? "-")}</div></div>
          </div>
          <div class="col-sm-6">
            <div class="mb-2"><span class="text-muted small">Mekanik</span><div class="fw-semibold">${escapeHtml(s.NAMA_MEKANIK ?? "-")}</div></div>
            <div class="mb-2"><span class="text-muted small">Tanggal Masuk</span><div>${formatTanggal(s.TANGGALMASUK)}</div></div>
            <div class="mb-2"><span class="text-muted small">Status</span><div>${badgeStatus(s.STATUS)}</div></div>
          </div>
        </div>`;

      // Layanan
      if (s.LAYANAN && s.LAYANAN.length) {
        html += `
          <h6 class="fw-bold mb-2 mt-3"><i class="fa-solid fa-tag me-2 text-warning"></i>Layanan Servis</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm table-bordered mb-0">
              <thead class="table-light"><tr>
                <th class="text-center">#</th>
                <th>Nama Layanan</th>
                <th class="text-end">Biaya</th>
              </tr></thead>
              <tbody>
                ${s.LAYANAN.map(
                  (l, i) => `
                  <tr>
                    <td class="text-center">${i + 1}</td>
                    <td>${escapeHtml(l.NAMA_LAYANAN ?? l.NAMA ?? "-")}</td>
                    <td class="text-end">${formatRupiah(l.BIAYA ?? l.BIAYAPOKOK)}</td>
                  </tr>`,
                ).join("")}
              </tbody>
            </table>
          </div>`;
      }

      // Sparepart servis
      if (s.SPAREPART && s.SPAREPART.length) {
        html += `
          <h6 class="fw-bold mb-2 mt-3"><i class="fa fa-gear me-2 text-secondary"></i>Sparepart Digunakan</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm table-bordered mb-0">
              <thead class="table-light"><tr>
                <th class="text-center">#</th>
                <th>Nama Sparepart</th>
                <th class="text-center">Qty</th>
                <th class="text-end">Harga Satuan</th>
                <th class="text-end">Subtotal</th>
              </tr></thead>
              <tbody>
                ${s.SPAREPART.map(
                  (sp, i) => `
                  <tr>
                    <td class="text-center">${i + 1}</td>
                    <td>${escapeHtml(sp.NAMA_SPAREPART ?? sp.NAMA ?? "-")}</td>
                    <td class="text-center">${sp.QTY}</td>
                    <td class="text-end">${formatRupiah(sp.HARGASATUAN)}</td>
                    <td class="text-end">${formatRupiah(sp.SUBTOTAL)}</td>
                  </tr>`,
                ).join("")}
              </tbody>
            </table>
          </div>`;
      }

      // Progress
      if (s.PROGRESS && s.PROGRESS.length) {
        html += `
          <h6 class="fw-bold mb-2 mt-3"><i class="fa-solid fa-timeline me-2 text-info"></i>Progress Servis</h6>
          <ul class="list-group list-group-flush mb-2">
            ${s.PROGRESS.map(
              (p) => `
              <li class="list-group-item px-0 py-2 d-flex gap-3 align-items-start">
                <div>${badgeStatus(p.STATUS)}</div>
                <div>
                  <div class="small text-muted">${formatTanggal(p.WAKTU)}</div>
                  <div>${escapeHtml(p.KETERANGAN ?? "-")}</div>
                </div>
              </li>`,
            ).join("")}
          </ul>`;
      }

      // ── PEMBELIAN ──
    } else if (!isServis && d.ITEMS && d.ITEMS.length) {
      html += `
        <h6 class="fw-bold mb-2"><i class="fa fa-gear me-2 text-success"></i>Detail Pembelian Sparepart</h6>
        <div class="table-responsive">
          <table class="table table-sm table-bordered mb-0">
            <thead class="table-light"><tr>
              <th class="text-center">#</th>
              <th>Nama Sparepart</th>
              <th class="text-center">Jumlah</th>
              <th class="text-end">Harga Satuan</th>
              <th class="text-end">Subtotal</th>
            </tr></thead>
            <tbody>
              ${d.ITEMS.map(
                (item, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${escapeHtml(item.NAMA_SPAREPART ?? "-")}</td>
                  <td class="text-center">${item.JUMLAH}</td>
                  <td class="text-end">${formatRupiah(item.HARGA_SATUAN)}</td>
                  <td class="text-end">${formatRupiah(item.SUB_TOTAL)}</td>
                </tr>`,
              ).join("")}
            </tbody>
          </table>
        </div>`;
    }

    document.getElementById("modalDetailBody").innerHTML = html;
    document.getElementById("modalDetailLabel").textContent =
      "Detail Transaksi — " + d.NOTRANSAKSI;
  } catch (err) {
    document.getElementById("modalDetailBody").innerHTML =
      `<div class="text-center py-4 text-danger"><i class="fa fa-circle-exclamation me-2"></i>${err.message}</div>`;
  }
}

function badgeStatus(status) {
  const map = {
    Belum: "bg-secondary",
    "Dalam Proses": "bg-warning text-dark",
    Selesai: "bg-success",
  };
  const cls = map[status] || "bg-secondary";
  return `<span class="badge ${cls}">${escapeHtml(status ?? "-")}</span>`;
}

/* ===== ERROR ===== */
function renderError(msg) {
  document.getElementById("tableBody").innerHTML =
    `<tr><td colspan="8" class="text-center py-4 text-danger">
      <i class="fa fa-circle-exclamation me-2"></i>${msg}
    </td></tr>`;
  document.getElementById("paginationContainer").innerHTML = "";
}

/* ===== UTILS ===== */
function formatRupiah(angka) {
  return (
    "Rp " +
    Number(angka || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 })
  );
}

function formatTanggal(str) {
  if (!str) return "-";
  const d = new Date(str);
  return d.toLocaleDateString("id-ID", {
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
  }).then((result) => {
    if (result.isConfirmed) Session.logout();
  });
}
