/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = 'http://localhost:3000'; // Ganti sesuai alamat backend kamu

(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();

    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        $('html, body').animate({ scrollTop: 0 }, 800);
        return false;
    });

    // Sidebar Toggler
    $('.sidebar-toggler').click(function () {
        $('.sidebar, .content').toggleClass("open");
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
    return 'Rp ' + Number(angka).toLocaleString('id-ID', { minimumFractionDigits: 2 });
}

/* ===== LOAD DATA SPAREPART ===== */
async function loadSparepart() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/sparepart/get-all`);
        if (!res.ok) throw new Error('Gagal mengambil data');
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
    const tbody = document.getElementById('tableBody');

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

    tbody.innerHTML = pageData.map((item, index) => `
        <tr>
            <td class="text-center">${start + index + 1}</td>
            <td class="text-center">${escapeHtml(item.KODESPAREPART)}</td>
            <td>${escapeHtml(item.NAMA)}</td>
            <td class="text-end">${formatRupiah(item.HARGAJUAL)}</td>
            <td class="text-center">${item.STOK}</td>
            <td class="text-center">${item.STOKMINIMUM}</td>
            <td class="text-center">${escapeHtml(item.NAMA_SUPPLIER ?? '-')}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm btn-square me-1" title="Edit" onclick="bukaModalEdit(${item.IDSPAREPART})">
                    <i class="fa fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-square" title="Hapus" onclick="bukaModalHapus(${item.IDSPAREPART})">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    renderPagination(totalItems);
}

function renderPagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const container = document.getElementById('paginationContainer');

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    let pages = '';

    // Prev button
    pages += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
            <i class="fa fa-chevron-left" style="font-size:11px;"></i>
        </a>
    </li>`;

    // Page numbers — show max 5 pages around current
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

    if (startPage > 1) {
        pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
        if (startPage > 2) pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    }

    for (let i = startPage; i <= endPage; i++) {
        pages += `<li class="page-item ${i === currentPage ? 'active' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
        </li>`;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
        pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
    }

    // Next button
    pages += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
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
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger"><i class="fa fa-circle-exclamation me-2"></i>${msg}</td></tr>`;
    document.getElementById('paginationContainer').innerHTML = '';
}

/* ===== LOAD DROPDOWN KATEGORI & SUPPLIER ===== */
async function loadDropdowns() {
    try {
        const [resKat, resSup] = await Promise.all([
            fetch(`${API_BASE_URL}/api/kategori-sparepart/get-all`),
            fetch(`${API_BASE_URL}/api/supplier/get-all`)
        ]);
        const katJson = await resKat.json();
        const supJson = await resSup.json();
        const kategoriList = katJson.data ?? [];
        const supplierList = supJson.data ?? [];

        const katOptions = kategoriList.map(k =>
            `<option value="${k.IDKATEGORI}">${escapeHtml(k.NAMA)}</option>`
        ).join('');
        const supOptions = supplierList.map(s =>
            `<option value="${s.IDSUPPLIER}">${escapeHtml(s.NAMA)}</option>`
        ).join('');

        ['inputKategori', 'editKategori'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<option value="">-- Pilih Kategori --</option>` + katOptions;
        });
        ['inputSupplier', 'editSupplier'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = `<option value="">-- Pilih Supplier --</option>` + supOptions;
        });
    } catch (err) {
        console.warn('Gagal load dropdown:', err.message);
    }
}

/* ===== SEARCH ===== */
function searchData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    filteredData = allData.filter(item =>
        (item.NAMA ?? '').toLowerCase().includes(keyword) ||
        (item.KODESPAREPART ?? '').toLowerCase().includes(keyword) ||
        (item.NAMA_SUPPLIER ?? '').toLowerCase().includes(keyword)
    );
    currentPage = 1;
    renderTable(filteredData);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') searchData();
        // Live search
        const keyword = this.value.toLowerCase();
        filteredData = allData.filter(item =>
            (item.NAMA ?? '').toLowerCase().includes(keyword) ||
            (item.KODESPAREPART ?? '').toLowerCase().includes(keyword) ||
            (item.NAMA_SUPPLIER ?? '').toLowerCase().includes(keyword)
        );
        currentPage = 1;
        renderTable(filteredData);
    });
    loadSparepart();
    loadDropdowns();
});

/* ===== TAMBAH ===== */
async function simpanSparepart() {
    const payload = {
        KODESPAREPART: document.getElementById('inputKode').value.trim(),
        NAMA:          document.getElementById('inputNama').value.trim(),
        IDKATEGORI:    document.getElementById('inputKategori').value,
        IDSUPPLIER:    document.getElementById('inputSupplier').value,
        HARGAJUAL:     document.getElementById('inputHargaJual').value,
        STOK:          document.getElementById('inputStok').value,
        STOKMINIMUM:   document.getElementById('inputStokMin').value,
    };

    if (!payload.KODESPAREPART || !payload.NAMA) {
        alert('Kode dan Nama sparepart wajib diisi.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/sparepart/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Gagal menyimpan data');
        bootstrap.Modal.getInstance(document.getElementById('modalTambah')).hide();
        document.getElementById('modalTambah').querySelectorAll('input[type=text], input[type=number]').forEach(el => el.value = '');
        document.getElementById('inputKategori').value = '';
        document.getElementById('inputSupplier').value = '';
        loadSparepart();
    } catch (err) {
        alert(err.message);
    }
}

/* ===== EDIT ===== */
function bukaModalEdit(id) {
    const item = allData.find(d => d.IDSPAREPART == id);
    if (!item) return;

    document.getElementById('editId').value        = item.IDSPAREPART;
    document.getElementById('editKode').value      = item.KODESPAREPART ?? '';
    document.getElementById('editNama').value      = item.NAMA ?? '';
    document.getElementById('editHargaJual').value = item.HARGAJUAL ?? '';
    document.getElementById('editStok').value      = item.STOK ?? '';
    document.getElementById('editStokMin').value   = item.STOKMINIMUM ?? '';

    setTimeout(() => {
        document.getElementById('editKategori').value = item.IDKATEGORI ?? '';
        document.getElementById('editSupplier').value = item.IDSUPPLIER ?? '';
    }, 50);

    new bootstrap.Modal(document.getElementById('modalEdit')).show();
}

async function updateSparepart() {
    const id = document.getElementById('editId').value;
    const payload = {
        KODESPAREPART: document.getElementById('editKode').value.trim(),
        NAMA:          document.getElementById('editNama').value.trim(),
        IDKATEGORI:    document.getElementById('editKategori').value,
        IDSUPPLIER:    document.getElementById('editSupplier').value,
        HARGAJUAL:     document.getElementById('editHargaJual').value,
        STOK:          document.getElementById('editStok').value,
        STOKMINIMUM:   document.getElementById('editStokMin').value,
    };

    if (!payload.KODESPAREPART || !payload.NAMA) {
        alert('Kode dan Nama sparepart wajib diisi.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/sparepart/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Gagal mengupdate data');
        bootstrap.Modal.getInstance(document.getElementById('modalEdit')).hide();
        loadSparepart();
    } catch (err) {
        alert(err.message);
    }
}

/* ===== HAPUS ===== */
function bukaModalHapus(id) {
    document.getElementById('hapusId').value = id;
    new bootstrap.Modal(document.getElementById('modalHapus')).show();
}

async function hapusSparepart() {
    const id = document.getElementById('hapusId').value;
    try {
        const res = await fetch(`${API_BASE_URL}/api/sparepart/delete/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus data');
        bootstrap.Modal.getInstance(document.getElementById('modalHapus')).hide();
        loadSparepart();
    } catch (err) {
        alert(err.message);
    }
}

/* ===== UTIL ===== */
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}