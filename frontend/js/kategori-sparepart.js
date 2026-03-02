/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = "http://localhost:3000"; // Ganti sesuai alamat backend kamu

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

  // ══════════════════════════════════════════════════════
  //  SESSION — Cek login & tampilkan info user di navbar
  // ══════════════════════════════════════════════════════
  $(document).ready(function () {
    // 1. Guard: hanya admin yang boleh akses halaman ini
    //    Jika tidak login / token expired → otomatis redirect ke login.html
    //    Jika role bukan admin → redirect ke dashboard sesuai role
    if (!Session.guard(["admin"])) return;

    // 2. Inject token ke semua $.ajax otomatis + handle 401 expired session
    Session.setupAjax();

    // 3. Tampilkan nama & role user yang sedang login di navbar
    var user = Session.getUser();
    if (user) {
      $("#navbar-nama").text(user.NAMA); // USER.NAMA
      $("#navbar-role").text(user.ROLE); // USER.ROLE: 'admin' | 'kasir' | 'mekanik'
    }

    // 4. Load data
    loadKategori();

    // 5. Search realtime
    $("#searchInput").on("keyup", function () {
      const keyword = this.value.toLowerCase();
      filteredData = allData.filter(
        (item) =>
          (item.NAMA ?? "").toLowerCase().includes(keyword) ||
          (item.KODE ?? "").toLowerCase().includes(keyword),
      );
      currentPage = 1;
      renderTable(filteredData);
    });
  });
})(jQuery);

// ══════════════════════════════════════════════════════
//  LOGOUT
// ══════════════════════════════════════════════════════
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
    if (result.isConfirmed) {
      Session.logout(); // hapus localStorage + redirect login
    }
  });
}

/* ===== DATA & STATE ===== */
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

/* ===== LOAD DATA =====
   GET /api/kategori-sparepart/get-all
   Token otomatis dikirim via Session.setupAjax() yang sudah dijalankan di atas.
   Karena pakai fetch() bukan $.ajax, token perlu dikirim manual lewat getAuthHeaders().
*/
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

async function loadKategori() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/kategori-sparepart/get-all`, {
      headers: getAuthHeaders(),
    });

    // Jika 401 expired, Session.setupAjax() sudah handle untuk $.ajax
    // Untuk fetch() kita handle manual
    if (res.status === 401) {
      const json = await res.json();
      if (json.expired) {
        Session.clear();
        Swal.fire({
          title: "Sesi Berakhir",
          text: "Sesi Anda telah habis. Silakan login kembali.",
          icon: "warning",
          confirmButtonColor: "#009CFF",
          allowOutsideClick: false,
        }).then(() => {
          window.location.href = "login.html";
        });
        return;
      }
      throw new Error("Akses ditolak.");
    }

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
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Tidak ada data kategori.</td></tr>`;
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
            <td class="text-center">${escapeHtml(item.NAMA)}</td>
            <td class="text-center">${escapeHtml(item.KODE)}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm btn-square me-1" title="Edit"
                    onclick="bukaModalEdit(${item.IDKATEGORI}, '${escapeHtml(item.NAMA)}', '${escapeHtml(item.KODE)}')">
                    <i class="fa fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-square" title="Hapus"
                    onclick="konfirmasiHapus(${item.IDKATEGORI})">
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
    `<tr><td colspan="4" class="text-center py-4 text-danger"><i class="fa fa-circle-exclamation me-2"></i>${msg}</td></tr>`;
  document.getElementById("paginationContainer").innerHTML = "";
}

/* ===== SEARCH ===== */
function searchData() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  filteredData = allData.filter(
    (item) =>
      (item.NAMA ?? "").toLowerCase().includes(keyword) ||
      (item.KODE ?? "").toLowerCase().includes(keyword),
  );
  currentPage = 1;
  renderTable(filteredData);
}

/* ===== TAMBAH =====
   POST /api/kategori-sparepart/create
   Body: { NAMA, KODE }
*/
async function simpanKategori() {
  const nama = document.getElementById("inputNamaKategori").value.trim();
  const kode = document.getElementById("inputKodeKategori").value.trim();
  if (!nama || !kode) {
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Nama dan Kode kategori wajib diisi.",
    });
    return;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/kategori-sparepart/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ NAMA: nama, KODE: kode }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Gagal menyimpan data");

    bootstrap.Modal.getInstance(document.getElementById("modalTambah")).hide();
    document.getElementById("inputNamaKategori").value = "";
    document.getElementById("inputKodeKategori").value = "";
    await loadKategori();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Kategori berhasil ditambahkan.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== EDIT =====
   PUT /api/kategori-sparepart/update/:id
   Body: { NAMA, KODE }
*/
function bukaModalEdit(id, nama, kode) {
  document.getElementById("editId").value = id;
  document.getElementById("editNamaKategori").value = nama;
  document.getElementById("editKodeKategori").value = kode;
  new bootstrap.Modal(document.getElementById("modalEdit")).show();
}

async function updateKategori() {
  const id = document.getElementById("editId").value;
  const nama = document.getElementById("editNamaKategori").value.trim();
  const kode = document.getElementById("editKodeKategori").value.trim();
  if (!nama || !kode) {
    Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Nama dan Kode kategori wajib diisi.",
    });
    return;
  }

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/kategori-sparepart/update/${id}`,
      {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ NAMA: nama, KODE: kode }),
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Gagal mengupdate data");

    bootstrap.Modal.getInstance(document.getElementById("modalEdit")).hide();
    await loadKategori();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Kategori berhasil diupdate.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== HAPUS =====
   DELETE /api/kategori-sparepart/delete/:id
*/
function konfirmasiHapus(id) {
  Swal.fire({
    title: "Hapus Kategori?",
    text: "Data yang dihapus tidak dapat dikembalikan.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc3545",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Hapus!",
    cancelButtonText: "Batal",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/kategori-sparepart/delete/${id}`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Gagal menghapus data");

        await loadKategori();
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Kategori berhasil dihapus.",
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
