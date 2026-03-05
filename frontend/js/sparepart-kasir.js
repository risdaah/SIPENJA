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

/* ===== DATA & STATE ===== */
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

/* ===== FORMAT RUPIAH ===== */
function formatRupiah(angka) {
  return (
    "Rp " + Number(angka).toLocaleString("id-ID", { minimumFractionDigits: 2 })
  );
}

/* ===== LOAD DATA SPAREPART ===== */
async function loadSparepart() {
  try {
    const res = await fetch(`${API_BASE_URL}/sparepart/get-all`, {
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
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Tidak ada data sparepart.</td></tr>`;
    renderPagination(0);
    return;
  }

  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = data.slice(start, end);

  tbody.innerHTML = pageData
    .map(
      (item, index) => `
    <tr>
      <td class="text-center">${start + index + 1}</td>
      <td class="text-center">${escapeHtml(item.KODESPAREPART)}</td>
      <td>${escapeHtml(item.NAMA)}</td>
      <td class="text-end">${formatRupiah(item.HARGAJUAL)}</td>
      <td class="text-center ${item.STOK <= item.STOKMINIMUM ? "text-danger fw-bold" : ""}">${item.STOK}</td>
      <td class="text-center">${item.STOKMINIMUM}</td>
      <td class="text-center">${escapeHtml(item.NAMA_SUPPLIER ?? "-")}</td>
      <td class="text-center">
        <button class="btn btn-warning btn-sm btn-square" title="Edit Stok"
          onclick="bukaModalEdit(${item.IDSPAREPART})">
          <i class="fa fa-pen-to-square"></i>
        </button>
      </td>
    </tr>
  `,
    )
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
      <i class="fa fa-chevron-left" style="font-size:11px;"></i>
    </a></li>`;

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + 4);
  if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

  if (startPage > 1) {
    pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
    if (startPage > 2)
      pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
  }
  for (let i = startPage; i <= endPage; i++) {
    pages += `<li class="page-item ${i === currentPage ? "active" : ""}">
      <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a></li>`;
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1)
      pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
  }
  pages += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
      <i class="fa fa-chevron-right" style="font-size:11px;"></i>
    </a></li>`;

  container.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
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

function renderError(msg) {
  document.getElementById("tableBody").innerHTML =
    `<tr><td colspan="8" class="text-center py-4 text-danger">
      <i class="fa fa-circle-exclamation me-2"></i>${msg}
    </td></tr>`;
  document.getElementById("paginationContainer").innerHTML = "";
}

/* ===== SEARCH ===== */
function searchData() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  filteredData = allData.filter(
    (item) =>
      (item.NAMA ?? "").toLowerCase().includes(keyword) ||
      (item.KODESPAREPART ?? "").toLowerCase().includes(keyword) ||
      (item.NAMA_SUPPLIER ?? "").toLowerCase().includes(keyword),
  );
  currentPage = 1;
  renderTable(filteredData);
}

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

  document.getElementById("searchInput").addEventListener("keyup", function () {
    filteredData = allData.filter(
      (item) =>
        (item.NAMA ?? "").toLowerCase().includes(this.value.toLowerCase()) ||
        (item.KODESPAREPART ?? "")
          .toLowerCase()
          .includes(this.value.toLowerCase()) ||
        (item.NAMA_SUPPLIER ?? "")
          .toLowerCase()
          .includes(this.value.toLowerCase()),
    );
    currentPage = 1;
    renderTable(filteredData);
  });

  loadSparepart();
});

/* ===== MODAL EDIT ===== */
function bukaModalEdit(id) {
  const item = allData.find((d) => d.IDSPAREPART == id);
  if (!item) return;

  // Isi ID dan stok ke form
  document.getElementById("editId").value = item.IDSPAREPART;
  document.getElementById("editStok").value = item.STOK ?? "";

  new bootstrap.Modal(document.getElementById("modalEdit")).show();
}

async function updateSparepart() {
  const id = document.getElementById("editId").value;
  const stok = document.getElementById("editStok").value;

  if (!id) return Swal.fire("Gagal", "ID sparepart tidak ditemukan.", "error");
  if (stok === "" || stok < 0)
    return Swal.fire(
      "Peringatan",
      "Stok tidak boleh kosong atau negatif.",
      "warning",
    );

  try {
    const res = await fetch(`${API_BASE_URL}/sparepart/update-stok/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ STOK: Number(stok) }),
    });
    const json = await res.json();
    if (!res.ok || !json.success)
      throw new Error(json.message || "Gagal mengupdate stok");

    bootstrap.Modal.getInstance(document.getElementById("modalEdit")).hide();
    await loadSparepart();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Stok berhasil diupdate.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== UTIL ===== */
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
