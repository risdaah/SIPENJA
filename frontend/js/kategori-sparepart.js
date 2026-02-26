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

/* ===== LOAD DATA ===== */
async function loadKategori() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/kategori-sparepart/get-all`);
        if (!res.ok) throw new Error('Gagal mengambil data');
        const json = await res.json();
        const data = json.data ?? [];
        allData = data;
        renderTable(data);
    } catch (err) {
        renderError(err.message);
    }
}

function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Tidak ada data kategori.</td></tr>`;
        return;
    }
    tbody.innerHTML = data.map((item, index) => `
        <tr>
            <td class="text-center">${index + 1}</td>
            <td class="text-center">${escapeHtml(item.NAMA)}</td>
            <td class="text-center">${escapeHtml(item.KODE)}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm btn-square me-1" title="Edit" onclick="bukaModalEdit(${item.IDKATEGORI}, '${escapeHtml(item.NAMA)}', '${escapeHtml(item.KODE)}')">
                    <i class="fa fa-pen-to-square"></i>
                </button>
                <button class="btn btn-danger btn-sm btn-square" title="Hapus" onclick="bukaModalHapus(${item.IDKATEGORI})">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

function renderError(msg) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-danger"><i class="fa fa-circle-exclamation me-2"></i>${msg}</td></tr>`;
}

/* ===== SEARCH ===== */
function searchData() {
    const keyword = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allData.filter(item =>
        item.NAMA.toLowerCase().includes(keyword) ||
        item.KODE.toLowerCase().includes(keyword)
    );
    renderTable(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('searchInput').addEventListener('keyup', function (e) {
        if (e.key === 'Enter') searchData();
    });
    loadKategori();
});

/* ===== TAMBAH ===== */
async function simpanKategori() {
    const nama = document.getElementById('inputNamaKategori').value.trim();
    const kode = document.getElementById('inputKodeKategori').value.trim();
    if (!nama || !kode) { alert('Nama dan Kode kategori wajib diisi.'); return; }

    try {
        const res = await fetch(`${API_BASE_URL}/api/kategori-sparepart/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ NAMA: nama, KODE: kode })
        });
        if (!res.ok) throw new Error('Gagal menyimpan data');
        bootstrap.Modal.getInstance(document.getElementById('modalTambah')).hide();
        document.getElementById('inputNamaKategori').value = '';
        document.getElementById('inputKodeKategori').value = '';
        loadKategori();
    } catch (err) {
        alert(err.message);
    }
}

/* ===== EDIT ===== */
function bukaModalEdit(id, nama, kode) {
    document.getElementById('editId').value = id;
    document.getElementById('editNamaKategori').value = nama;
    document.getElementById('editKodeKategori').value = kode;
    new bootstrap.Modal(document.getElementById('modalEdit')).show();
}

async function updateKategori() {
    const id = document.getElementById('editId').value;
    const nama = document.getElementById('editNamaKategori').value.trim();
    const kode = document.getElementById('editKodeKategori').value.trim();
    if (!nama || !kode) { alert('Nama dan Kode kategori wajib diisi.'); return; }

    try {
        const res = await fetch(`${API_BASE_URL}/api/kategori-sparepart/update/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ NAMA: nama, KODE: kode })
        });
        if (!res.ok) throw new Error('Gagal mengupdate data');
        bootstrap.Modal.getInstance(document.getElementById('modalEdit')).hide();
        loadKategori();
    } catch (err) {
        alert(err.message);
    }
}

/* ===== HAPUS ===== */
function bukaModalHapus(id) {
    document.getElementById('hapusId').value = id;
    new bootstrap.Modal(document.getElementById('modalHapus')).show();
}

async function hapusKategori() {
    const id = document.getElementById('hapusId').value;
    try {
        const res = await fetch(`${API_BASE_URL}/api/kategori-sparepart/delete/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Gagal menghapus data');
        bootstrap.Modal.getInstance(document.getElementById('modalHapus')).hide();
        loadKategori();
    } catch (err) {
        alert(err.message);
    }
}

/* ===== UTIL ===== */
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}