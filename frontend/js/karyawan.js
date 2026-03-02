/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = "http://localhost:3000";
/* ===== AUTH HEADERS — kirim token JWT ke setiap request ===== */
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

(function ($) {
  "use strict";

  // Spinner
  var spinner = function () {
    setTimeout(function () {
      if ($("#spinner").length > 0) {
        $("#spinner").removeClass("show");
      }
    }, 1);
  };
  spinner();

  // Back to top button
  $(window).scroll(function () {
    if ($(this).scrollTop() > 300) {
      $(".back-to-top").fadeIn("slow");
    } else {
      $(".back-to-top").fadeOut("slow");
    }
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

/* ===== HELPERS ===== */
function formatTanggal(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTanggalInput(iso) {
  if (!iso) return "";
  return iso.substring(0, 10); // YYYY-MM-DD
}

function badgeRole(role) {
  const map = {
    admin: "bg-danger",
    kasir: "bg-primary",
    mekanik: "bg-success",
  };
  const cls = map[role] ?? "bg-secondary";
  return `<span class="badge ${cls} text-capitalize">${escapeHtml(role)}</span>`;
}

function badgeStatus(status) {
  const cls = status === "AKTIF" ? "bg-success" : "bg-secondary";
  return `<span class="badge ${cls}">${escapeHtml(status)}</span>`;
}

/* ===== LOAD DATA ===== */
async function loadKaryawan() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/user/get-all`);
    if (!res.ok) throw new Error("Gagal mengambil data");
    const json = await res.json();
    const data = json.data ?? [];
    allData = data;
    filteredData = data;
    currentPage = 1;
    renderTable(filteredData);
  } catch (err) {
    renderError(err.message);
  }
}

function renderTable(data) {
  const tbody = document.getElementById("tableBody");

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">Tidak ada data karyawan.</td></tr>`;
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
            <td>${escapeHtml(item.NAMA)}</td>
            <td class="text-center">${escapeHtml(item.USERNAME)}</td>
            <td class="text-center">${formatTanggal(item.TANGGALLAHIR)}</td>
            <td class="text-center">${escapeHtml(item.JENISKELAMIN)}</td>
            <td class="text-center">${badgeRole(item.ROLE)}</td>
            <td class="text-center">${badgeStatus(item.STATUS)}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm btn-square me-1" title="Edit"
                    onclick="bukaModalEdit(${item.IDUSER})">
                    <i class="fa fa-pen-to-square"></i>
                </button>
                <button class="btn btn-info btn-sm btn-square me-1" title="Ganti Password"
                    onclick="bukaModalPassword(${item.IDUSER})">
                    <i class="fa fa-key"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-square" title="Hapus"
                    onclick="konfirmasiHapus(${item.IDUSER})">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("");

  renderPagination(totalItems);
}

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
        </a>
    </li>`;

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
            <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
        </li>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1)
      pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
  }

  pages += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
            <i class="fa fa-chevron-right" style="font-size:11px;"></i>
        </a>
    </li>`;

  container.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
            <small class="text-muted">Menampilkan ${start}–${end} dari ${totalItems} data</small>
            <ul class="pagination pagination-sm mb-0">${pages}</ul>
        </div>
    `;
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderTable(filteredData);
}

function renderError(msg) {
  document.getElementById("tableBody").innerHTML =
    `<tr><td colspan="8" class="text-center py-4 text-danger"><i class="fa fa-circle-exclamation me-2"></i>${msg}</td></tr>`;
  document.getElementById("paginationContainer").innerHTML = "";
}

/* ===== SEARCH ===== */
function searchData() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  _applyFilter(keyword);
}

function _applyFilter(keyword) {
  filteredData = allData.filter(
    (item) =>
      (item.NAMA ?? "").toLowerCase().includes(keyword) ||
      (item.USERNAME ?? "").toLowerCase().includes(keyword) ||
      (item.ROLE ?? "").toLowerCase().includes(keyword),
  );
  currentPage = 1;
  renderTable(filteredData);
}

document.addEventListener("DOMContentLoaded", () => {
  // ── SESSION ──────────────────────────────────────────
  if (!Session.guard(["admin"])) return;
  Session.setupAjax();
  var _u = Session.getUser();
  if (_u) {
    document.getElementById("navbar-nama") &&
      (document.getElementById("navbar-nama").textContent = _u.NAMA);
    document.getElementById("navbar-role") &&
      (document.getElementById("navbar-role").textContent = _u.ROLE);
  }
  // ─────────────────────────────────────────────────────
  document.getElementById("searchInput").addEventListener("keyup", function () {
    _applyFilter(this.value.toLowerCase());
  });
  loadKaryawan();
});

/* ===== TAMBAH ===== */
async function simpanKaryawan() {
  const payload = {
    NAMA: document.getElementById("inputNama").value.trim(),
    USERNAME: document.getElementById("inputUsername").value.trim(),
    PASSWORD: document.getElementById("inputPassword").value,
    TANGGALLAHIR: document.getElementById("inputTanggalLahir").value,
    JENISKELAMIN: document.getElementById("inputJenisKelamin").value,
    ROLE: document.getElementById("inputRole").value,
  };

  if (
    !payload.NAMA ||
    !payload.USERNAME ||
    !payload.PASSWORD ||
    !payload.ROLE
  ) {
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Nama, Username, Password, dan Role wajib diisi.",
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/user/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal menyimpan data");
    bootstrap.Modal.getInstance(document.getElementById("modalTambah")).hide();
    document.getElementById("inputNama").value = "";
    document.getElementById("inputUsername").value = "";
    document.getElementById("inputPassword").value = "";
    document.getElementById("inputTanggalLahir").value = "";
    document.getElementById("inputJenisKelamin").value = "";
    document.getElementById("inputRole").value = "";
    await loadKaryawan();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Karyawan berhasil ditambahkan.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== EDIT ===== */
function bukaModalEdit(id) {
  const item = allData.find((d) => d.IDUSER == id);
  if (!item) return;

  document.getElementById("editId").value = item.IDUSER;
  document.getElementById("editNama").value = item.NAMA ?? "";
  document.getElementById("editUsername").value = item.USERNAME ?? "";
  document.getElementById("editTanggalLahir").value = formatTanggalInput(
    item.TANGGALLAHIR,
  );
  document.getElementById("editJenisKelamin").value = item.JENISKELAMIN ?? "";
  document.getElementById("editRole").value = item.ROLE ?? "";

  new bootstrap.Modal(document.getElementById("modalEdit")).show();
}

async function updateKaryawan() {
  const id = document.getElementById("editId").value;
  const payload = {
    NAMA: document.getElementById("editNama").value.trim(),
    USERNAME: document.getElementById("editUsername").value.trim(),
    TANGGALLAHIR: document.getElementById("editTanggalLahir").value,
    JENISKELAMIN: document.getElementById("editJenisKelamin").value,
    ROLE: document.getElementById("editRole").value,
  };

  if (!payload.NAMA || !payload.USERNAME || !payload.ROLE) {
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Nama, Username, dan Role wajib diisi.",
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/user/update/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal mengupdate data");
    bootstrap.Modal.getInstance(document.getElementById("modalEdit")).hide();
    await loadKaryawan();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Data karyawan berhasil diupdate.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== GANTI PASSWORD ===== */
function bukaModalPassword(id) {
  const item = allData.find((d) => d.IDUSER == id);
  if (!item) return;
  document.getElementById("passId").value = item.IDUSER;
  document.getElementById("passNama").textContent = item.NAMA;
  document.getElementById("inputPasswordBaru").value = "";
  document.getElementById("inputPasswordKonfirm").value = "";
  new bootstrap.Modal(document.getElementById("modalPassword")).show();
}

async function gantiPassword() {
  const id = document.getElementById("passId").value;
  const pass = document.getElementById("inputPasswordBaru").value;
  const konf = document.getElementById("inputPasswordKonfirm").value;

  if (!pass) {
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Password baru wajib diisi.",
    });
    return;
  }
  if (pass !== konf) {
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Password dan konfirmasi tidak cocok.",
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/user/update-password/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ PASSWORD: pass }),
    });
    if (!res.ok) throw new Error("Gagal mengganti password");
    bootstrap.Modal.getInstance(
      document.getElementById("modalPassword"),
    ).hide();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Password berhasil diubah.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== HAPUS ===== */
function konfirmasiHapus(id) {
  const item = allData.find((d) => d.IDUSER == id);
  Swal.fire({
    title: "Hapus Karyawan?",
    html: `Karyawan <strong>${escapeHtml(item?.NAMA ?? "")}</strong> akan dihapus permanen.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/user/delete/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Gagal menghapus data");
        await loadKaryawan();
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Karyawan berhasil dihapus.",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
      }
    }
  });
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
  }).then(function (result) {
    if (result.isConfirmed) Session.logout();
  });
}
