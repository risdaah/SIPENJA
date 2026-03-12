const API_BASE_URL = "http://localhost:3000";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

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
})(jQuery);

/* ===== DATA & STATE ===== */
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

function formatRupiah(angka) {
  return (
    "Rp " + Number(angka).toLocaleString("id-ID", { minimumFractionDigits: 0 })
  );
}

/* ===== LOAD DATA ===== */
async function loadSparepart() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/sparepart/get-all`);
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
    .map((item, index) => {
      const stokRendah = item.STOK <= item.STOKMINIMUM;
      return `
      <tr>
        <td class="text-center">${start + index + 1}</td>
        <td class="text-center">${escapeHtml(item.KODESPAREPART)}</td>
        <td>${escapeHtml(item.NAMA)}</td>
        <td class="text-end">${formatRupiah(item.HARGAJUAL)}</td>
        <td class="text-center">
          <span class="${stokRendah ? "badge bg-danger" : ""}">
            ${item.STOK}
          </span>
          ${stokRendah ? `<i class="fa-solid fa-triangle-exclamation text-danger ms-1" title="Stok di bawah minimum!"></i>` : ""}
        </td>
        <td class="text-center">${item.STOKMINIMUM}</td>
        <td class="text-center">${escapeHtml(item.NAMA_SUPPLIER ?? "-")}</td>
        <td class="text-center">
          <button class="btn btn-primary btn-sm btn-square me-1" title="Tambah Stok"
            onclick="bukaModalTambahStok(${item.IDSPAREPART})">
            <i class="fa-solid fa-boxes-stacked"></i>
          </button>
          <button class="btn btn-warning btn-sm btn-square me-1" title="Edit"
            onclick="bukaModalEdit(${item.IDSPAREPART})">
            <i class="fa fa-pen-to-square"></i>
          </button>
          <button class="btn btn-danger btn-sm btn-square" title="Hapus"
            onclick="konfirmasiHapus(${item.IDSPAREPART})">
            <i class="fa fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
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
      <i class="fa fa-chevron-left" style="font-size:11px;"></i></a></li>`;

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
      <i class="fa fa-chevron-right" style="font-size:11px;"></i></a></li>`;

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
      <i class="fa fa-circle-exclamation me-2"></i>${msg}</td></tr>`;
  document.getElementById("paginationContainer").innerHTML = "";
}

/* ===== DROPDOWN ===== */
async function loadDropdowns() {
  try {
    const [resKat, resSup] = await Promise.all([
      fetch(`${API_BASE_URL}/api/kategori-sparepart/get-all`),
      fetch(`${API_BASE_URL}/api/supplier/get-all`),
    ]);
    const katJson = await resKat.json();
    const supJson = await resSup.json();

    const katOpts = (katJson.data ?? [])
      .map(
        (k) => `<option value="${k.IDKATEGORI}">${escapeHtml(k.NAMA)}</option>`,
      )
      .join("");
    const supOpts = (supJson.data ?? [])
      .map(
        (s) => `<option value="${s.IDSUPPLIER}">${escapeHtml(s.NAMA)}</option>`,
      )
      .join("");

    ["inputKategori", "editKategori"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML =
          `<option value="">-- Pilih Kategori --</option>` + katOpts;
    });
    ["inputSupplier", "editSupplier"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.innerHTML =
          `<option value="">-- Pilih Supplier --</option>` + supOpts;
    });
  } catch (err) {
    console.warn("Gagal load dropdown:", err.message);
  }
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
  if (!Session.guard(["admin"])) return;
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

  // Hitung total preview saat qty/harga berubah
  document.getElementById("stokQty")?.addEventListener("input", hitungTotal);
  document
    .getElementById("stokHargaBeli")
    ?.addEventListener("input", hitungTotal);

  loadSparepart();
  loadDropdowns();
});

/* ===== TAMBAH SPAREPART ===== */
async function simpanSparepart() {
  const payload = {
    KODESPAREPART: document.getElementById("inputKode").value.trim(),
    NAMA: document.getElementById("inputNama").value.trim(),
    IDKATEGORI: document.getElementById("inputKategori").value,
    IDSUPPLIER: document.getElementById("inputSupplier").value,
    HARGAJUAL: document.getElementById("inputHargaJual").value,
    STOK: document.getElementById("inputStok").value,
    STOKMINIMUM: document.getElementById("inputStokMin").value,
  };

  if (!payload.KODESPAREPART || !payload.NAMA)
    return Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Kode dan Nama sparepart wajib diisi.",
    });

  try {
    const res = await fetch(`${API_BASE_URL}/api/sparepart/create`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal menyimpan data");
    bootstrap.Modal.getInstance(document.getElementById("modalTambah")).hide();
    document
      .getElementById("modalTambah")
      .querySelectorAll("input[type=text], input[type=number]")
      .forEach((el) => (el.value = ""));
    document.getElementById("inputKategori").value = "";
    document.getElementById("inputSupplier").value = "";
    await loadSparepart();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Sparepart berhasil ditambahkan.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== EDIT SPAREPART (tanpa stok) ===== */
function bukaModalEdit(id) {
  const item = allData.find((d) => d.IDSPAREPART == id);
  if (!item) return;

  document.getElementById("editId").value = item.IDSPAREPART;
  document.getElementById("editKode").value = item.KODESPAREPART ?? "";
  document.getElementById("editNama").value = item.NAMA ?? "";
  document.getElementById("editHargaJual").value = item.HARGAJUAL ?? "";
  document.getElementById("editStokMin").value = item.STOKMINIMUM ?? "";

  setTimeout(() => {
    document.getElementById("editKategori").value = item.IDKATEGORI ?? "";
    document.getElementById("editSupplier").value = item.IDSUPPLIER ?? "";
  }, 50);

  new bootstrap.Modal(document.getElementById("modalEdit")).show();
}

async function updateSparepart() {
  const id = document.getElementById("editId").value;
  const payload = {
    KODESPAREPART: document.getElementById("editKode").value.trim(),
    NAMA: document.getElementById("editNama").value.trim(),
    IDKATEGORI: document.getElementById("editKategori").value,
    IDSUPPLIER: document.getElementById("editSupplier").value,
    HARGAJUAL: document.getElementById("editHargaJual").value,
    STOKMINIMUM: document.getElementById("editStokMin").value,
  };

  if (!payload.KODESPAREPART || !payload.NAMA)
    return Swal.fire({
      icon: "warning",
      title: "Perhatian",
      text: "Kode dan Nama sparepart wajib diisi.",
    });

  try {
    const res = await fetch(`${API_BASE_URL}/api/sparepart/update/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Gagal mengupdate data");
    bootstrap.Modal.getInstance(document.getElementById("modalEdit")).hide();
    await loadSparepart();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: "Sparepart berhasil diupdate.",
      timer: 1800,
      showConfirmButton: false,
    });
  } catch (err) {
    Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
  }
}

/* ===== HAPUS ===== */
function konfirmasiHapus(id) {
  Swal.fire({
    title: "Hapus Sparepart?",
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
        const res = await fetch(`${API_BASE_URL}/api/sparepart/delete/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Gagal menghapus data");
        await loadSparepart();
        Swal.fire({
          icon: "success",
          title: "Terhapus!",
          text: "Sparepart berhasil dihapus.",
          timer: 1800,
          showConfirmButton: false,
        });
      } catch (err) {
        Swal.fire({ icon: "error", title: "Gagal!", text: err.message });
      }
    }
  });
}

/* ===== MODAL TAMBAH STOK ===== */
function bukaModalTambahStok(id) {
  const item = allData.find((d) => d.IDSPAREPART == id);
  if (!item) return;

  document.getElementById("stokId").value = item.IDSPAREPART;
  document.getElementById("stokQty").value = "";
  document.getElementById("stokHargaBeli").value = "";
  document.getElementById("stokKeterangan").value = "";
  document.getElementById("stok-total-preview").textContent = "Rp 0";

  document.getElementById("stok-nama").textContent = item.NAMA;
  document.getElementById("stok-supplier").textContent =
    item.NAMA_SUPPLIER ?? "-";
  document.getElementById("stok-saat-ini").textContent = item.STOK;
  document.getElementById("stok-harga-jual").textContent = formatRupiah(
    item.HARGAJUAL,
  );

  new bootstrap.Modal(document.getElementById("modalTambahStok")).show();
}

function hitungTotal() {
  const qty = Number(document.getElementById("stokQty").value) || 0;
  const harga = Number(document.getElementById("stokHargaBeli").value) || 0;
  document.getElementById("stok-total-preview").textContent = formatRupiah(
    qty * harga,
  );
}

async function simpanTambahStok() {
  const id = document.getElementById("stokId").value;
  const qty = Number(document.getElementById("stokQty").value);
  const harga = Number(document.getElementById("stokHargaBeli").value);
  const ket = document.getElementById("stokKeterangan").value.trim();

  if (!qty || qty <= 0)
    return Swal.fire(
      "Peringatan",
      "Jumlah stok harus lebih dari 0.",
      "warning",
    );
  if (!harga || harga <= 0)
    return Swal.fire("Peringatan", "Harga beli harus lebih dari 0.", "warning");

  const total = qty * harga;
  const item = allData.find((d) => d.IDSPAREPART == id);

  const confirm = await Swal.fire({
    title: "Konfirmasi Tambah Stok",
    html: `
      <div style="text-align:left;font-size:.9rem">
        <div class="d-flex justify-content-between mb-1">
          <span>Sparepart</span><strong>${escapeHtml(item?.NAMA ?? "")}</strong>
        </div>
        <div class="d-flex justify-content-between mb-1">
          <span>Supplier</span><strong>${escapeHtml(item?.NAMA_SUPPLIER ?? "-")}</strong>
        </div>
        <div class="d-flex justify-content-between mb-1">
          <span>Jumlah Stok</span><strong>+${qty}</strong>
        </div>
        <div class="d-flex justify-content-between mb-1">
          <span>Harga Beli</span><strong>${formatRupiah(harga)}</strong>
        </div>
        <hr style="margin:8px 0">
        <div class="d-flex justify-content-between">
          <span>Total Pengeluaran</span>
          <strong style="color:#009CFF">${formatRupiah(total)}</strong>
        </div>
      </div>`,
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#009CFF",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Simpan",
    cancelButtonText: "Batal",
  });

  if (!confirm.isConfirmed) return;

  try {
    const res = await fetch(`${API_BASE_URL}/api/pengeluaran/tambah-stok`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        IDSPAREPART: Number(id),
        QTY: qty,
        HARGA_BELI: harga,
        KETERANGAN: ket || null,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success)
      throw new Error(json.message || "Gagal menyimpan");

    bootstrap.Modal.getInstance(
      document.getElementById("modalTambahStok"),
    ).hide();
    await loadSparepart();
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: `Stok ditambah ${qty}. Pengeluaran ${formatRupiah(total)} tercatat.`,
      timer: 2500,
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
