/* ===== KONFIGURASI ===== */
const API_BASE_URL = "http://localhost:3000/api";

const BENGKEL = {
  nama: "Bengkel Any Jaya",
  alamat: "Kalitengah, Kec. Tanggulangin, Kab. Sidoarjo, Jawa Timur 61272",
  telp: "+62 897-9980-073",
  pemilik: "Pamuji Slamet",
};

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

/* ===== STATE ===== */
let allData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;

// State struk
let strukData = null;

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
  const start = (currentPage - 1) * itemsPerPage;
  const pageData = data.slice(start, start + itemsPerPage);

  tbody.innerHTML = pageData
    .map((item, i) => {
      const jenisBadge =
        item.JENISTRANSAKSI === "SERVIS"
          ? '<span class="badge bg-primary">Servis</span>'
          : '<span class="badge bg-success">Pembelian</span>';

      const nohpIcon = item.NOHP
        ? `<i class="fab fa-whatsapp text-success ms-1" title="HP: ${escapeHtml(item.NOHP)}" style="font-size:.85rem"></i>`
        : "";

      return `
    <tr>
      <td class="text-center">${start + i + 1}</td>
      <td class="text-center fw-semibold">${escapeHtml(item.NOTRANSAKSI)}${nohpIcon}</td>
      <td class="text-center">${formatTanggal(item.TANGGAL)}</td>
      <td class="text-center">${jenisBadge}</td>
      <td class="text-end">${formatRupiah(item.TOTAL)}</td>
      <td class="text-center">${escapeHtml(item.NAMA_KASIR ?? "-")}</td>
      <td>${escapeHtml(item.CATATAN ?? "-")}</td>
      <td class="text-center">
        <div class="d-flex gap-1 justify-content-center">
          <button class="btn btn-primary btn-sm btn-square" title="Lihat Detail"
            onclick="lihatDetail(${item.IDTRANSAKSI})">
            <i class="fa fa-eye"></i>
          </button>
          <button class="btn btn-secondary btn-sm btn-square" title="Cetak / Kirim Struk"
            onclick="bukaStruk(${item.IDTRANSAKSI})">
            <i class="fa fa-receipt"></i>
          </button>
        </div>
      </td>
    </tr>`;
    })
    .join("");

  renderPagination(totalItems);
}

/* ===== MODAL STRUK ===================================================== */

async function bukaStruk(idTransaksi) {
  // Reset state
  strukData = null;
  document.getElementById("struk-print-area").innerHTML =
    `<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>`;
  updateStrukNohpUI(null);
  document.getElementById("btn-kirim-wa").disabled = true;

  // Tampilkan modal
  const modal = new bootstrap.Modal(document.getElementById("modalStruk"));
  modal.show();

  // Fetch data
  try {
    const res = await fetch(`${API_BASE_URL}/transaksi/struk/${idTransaksi}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Gagal memuat struk");
    strukData = json.data;
    renderStrukContent(strukData);
    updateStrukNohpUI(strukData.NOHP);
  } catch (err) {
    document.getElementById("struk-print-area").innerHTML =
      `<div class="text-center py-4 text-danger"><i class="fa fa-circle-exclamation me-2"></i>${err.message}</div>`;
  }
}

function renderStrukContent(t) {
  const isServis = t.JENISTRANSAKSI === "SERVIS";

  let itemsHtml = "";

  if (isServis) {
    const layanan = t.LAYANAN || [];
    const sparepart = t.SPAREPART || [];

    if (layanan.length) {
      itemsHtml += `<div class="section-title">Layanan Servis</div>
        <table><thead><tr>
          <th>Layanan</th><th>Ket.</th><th class="text-right">Biaya</th>
        </tr></thead><tbody>`;
      layanan.forEach((l) => {
        itemsHtml += `<tr>
          <td>${esc(l.NAMA_LAYANAN)}</td>
          <td>${esc(l.KETERANGAN || "-")}</td>
          <td class="text-right">${rupiah(l.BIAYA)}</td>
        </tr>`;
      });
      itemsHtml += `</tbody></table>`;
    }

    if (sparepart.length) {
      itemsHtml += `<div class="section-title">Sparepart</div>
        <table><thead><tr>
          <th>Nama</th><th class="text-right">Qty</th>
          <th class="text-right">Harga</th><th class="text-right">Sub</th>
        </tr></thead><tbody>`;
      sparepart.forEach((s) => {
        itemsHtml += `<tr>
          <td>${esc(s.NAMA_SPAREPART)}</td>
          <td class="text-right">${s.QTY}</td>
          <td class="text-right">${rupiah(s.HARGASATUAN)}</td>
          <td class="text-right">${rupiah(s.SUBTOTAL)}</td>
        </tr>`;
      });
      itemsHtml += `</tbody></table>`;
    }
  } else {
    const items = t.ITEMS || [];
    if (items.length) {
      itemsHtml += `<div class="section-title">Item Pembelian</div>
        <table><thead><tr>
          <th>Sparepart</th><th class="text-right">Qty</th>
          <th class="text-right">Harga</th><th class="text-right">Sub</th>
        </tr></thead><tbody>`;
      items.forEach((i) => {
        itemsHtml += `<tr>
          <td>${esc(i.NAMA_SPAREPART)}</td>
          <td class="text-right">${i.JUMLAH}</td>
          <td class="text-right">${rupiah(i.HARGA_SATUAN)}</td>
          <td class="text-right">${rupiah(i.SUB_TOTAL)}</td>
        </tr>`;
      });
      itemsHtml += `</tbody></table>`;
    }
  }

  let servisInfoHtml = "";
  if (isServis && t.SERVIS) {
    const s = t.SERVIS;
    servisInfoHtml = `
      <div class="section-title">Info Kendaraan</div>
      <div class="struk-meta">
        <span class="lbl">Pelanggan</span><span class="val">${esc(s.NAMAPELANGGAN)}</span>
        <span class="lbl">Keluhan</span><span class="val">${esc(s.KELUHAN || "-")}</span>
        <span class="lbl">No. Antrian</span><span class="val">${esc(s.KODEANTRIAN || "-")}</span>
        <span class="lbl">Mekanik</span><span class="val">${esc(s.NAMA_MEKANIK || "-")}</span>
      </div>`;
  }

  document.getElementById("struk-print-area").innerHTML = `
    <div class="struk-header">
      <i class="fa fa-wrench" style="font-size:20px;color:#333;margin-bottom:6px"></i>
      <h5>${BENGKEL.nama}</h5>
      <p>${BENGKEL.alamat}</p>
      <p>Telp: ${BENGKEL.telp}</p>
    </div>

    <div class="struk-meta">
      <span class="lbl">No. Transaksi</span><span class="val">${esc(t.NOTRANSAKSI)}</span>
      <span class="lbl">Tanggal</span><span class="val">${formatTanggalLong(t.TANGGAL)}</span>
      <span class="lbl">Kasir</span><span class="val">${esc(t.NAMA_KASIR || "-")}</span>
      <span class="lbl">Jenis</span><span class="val">${isServis ? "Servis Kendaraan" : "Pembelian Sparepart"}</span>
    </div>

    ${servisInfoHtml}
    ${itemsHtml}

    <div class="struk-total">
      ${t.CATATAN ? `<div class="catatan-row"><span>Catatan</span><span>${esc(t.CATATAN)}</span></div>` : ""}
      <div class="grand-row"><span>TOTAL</span><span>${rupiah(t.TOTAL)}</span></div>
    </div>

    <div class="struk-footer">
      <p style="font-weight:700;font-size:13px">Terima kasih!</p>
      <p>Simpan struk ini sebagai bukti pembayaran.</p>
      <p>Pertanyaan? Hubungi kami di ${BENGKEL.telp}</p>
    </div>
  `;

  document.getElementById("modalStrukLabel").textContent =
    "Struk — " + t.NOTRANSAKSI;
}

/* ── No HP ── */
function updateStrukNohpUI(nohp) {
  const input = document.getElementById("struk-nohp-input");
  const saved = document.getElementById("struk-nohp-saved");
  const btnWA = document.getElementById("btn-kirim-wa");
  const feedback = document.getElementById("struk-nohp-feedback");

  if (input) input.value = nohp || "";
  if (feedback) {
    feedback.style.display = "none";
    feedback.textContent = "";
  }

  if (nohp) {
    if (saved) {
      saved.textContent = "✓ Tersimpan: " + nohp;
      saved.style.display = "inline";
    }
    if (btnWA) btnWA.disabled = false;
  } else {
    if (saved) saved.style.display = "none";
    if (btnWA) btnWA.disabled = true;
  }
}

function onNohpInput() {
  // Hapus tanda tersimpan saat user mulai mengetik lagi
  const saved = document.getElementById("struk-nohp-saved");
  if (saved) saved.style.display = "none";
  const feedback = document.getElementById("struk-nohp-feedback");
  if (feedback) {
    feedback.style.display = "none";
  }
}

async function simpanNohpStruk() {
  if (!strukData) return;

  const input = document.getElementById("struk-nohp-input");
  const feedback = document.getElementById("struk-nohp-feedback");
  const btnSimpan = document.getElementById("btn-simpan-nohp");

  const raw = input.value.trim();
  const cleaned = raw.replace(/\D/g, "");

  if (raw && cleaned.length < 9) {
    feedback.textContent = "Nomor HP tidak valid (min 9 digit).";
    feedback.style.display = "block";
    return;
  }

  feedback.style.display = "none";
  btnSimpan.disabled = true;
  btnSimpan.textContent = "Menyimpan...";

  try {
    const res = await fetch(
      `${API_BASE_URL}/transaksi/nohp/${strukData.IDTRANSAKSI}`,
      {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ NOHP: cleaned || null }),
      },
    );
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    strukData.NOHP = cleaned || null;
    updateStrukNohpUI(strukData.NOHP);

    // Update ikon WA di tabel
    const idx = allData.findIndex(
      (d) => d.IDTRANSAKSI === strukData.IDTRANSAKSI,
    );
    if (idx !== -1) allData[idx].NOHP = cleaned || null;
    renderTable(filteredData);
  } catch (err) {
    feedback.textContent = "Gagal menyimpan: " + err.message;
    feedback.style.display = "block";
  } finally {
    btnSimpan.disabled = false;
    btnSimpan.textContent = "Simpan";
  }
}

/* ── Konversi area struk ke canvas (dipakai download & kirim WA) ── */
async function strukToCanvas() {
  const el = document.getElementById("struk-print-area");
  // Sembunyikan sementara elemen non-struk di modal body
  const nohpBox = el.previousElementSibling;
  if (nohpBox) nohpBox.style.visibility = "hidden";

  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 2, // resolusi 2x supaya tajam
    useCORS: true,
    logging: false,
  });

  if (nohpBox) nohpBox.style.visibility = "";
  return canvas;
}

/* ── Download struk sebagai gambar ── */
async function downloadStrukGambar() {
  if (!strukData) return;
  const btn = document.getElementById("btn-download-img");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Proses...`;

  try {
    const canvas = await strukToCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `struk-${strukData.NOTRANSAKSI}.png`;
    a.click();
  } catch (err) {
    alert("Gagal membuat gambar: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa fa-image me-1"></i>Download Gambar`;
  }
}

/* ── Kirim WA — download gambar dulu, lalu buka WA ── */
async function kirimWAStruk() {
  if (!strukData?.NOHP) return;

  const btn = document.getElementById("btn-kirim-wa");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span>Proses...`;

  try {
    // 1. Generate & download gambar struk
    const canvas = await strukToCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `struk-${strukData.NOTRANSAKSI}.png`;
    a.click();

    // 2. Buka WA dengan pesan singkat + instruksi kirim gambar
    await new Promise((r) => setTimeout(r, 800)); // beri jeda download

    const t = strukData;
    let nomor = t.NOHP.replace(/\D/g, "");
    if (nomor.startsWith("0")) nomor = "62" + nomor.slice(1);

    const tgl = formatTanggalLong(t.TANGGAL);
    const teks =
      `Terima kasih telah melakukan transaksi di *${BENGKEL.nama}*, ` +
      `ini adalah struk Anda pada ${tgl}.`;

    window.open(
      `https://wa.me/${nomor}?text=${encodeURIComponent(teks)}`,
      "_blank",
    );
  } catch (err) {
    alert("Gagal: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fab fa-whatsapp me-1"></i>Kirim WA (Gambar)`;
  }
}

/* ── Cetak ── */
function cetakStruk() {
  window.print();
}

/* ===== MODAL DETAIL ===================================================== */
async function lihatDetail(id) {
  const modal = new bootstrap.Modal(document.getElementById("modalDetail"));
  document.getElementById("modalDetailBody").innerHTML =
    `<div class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></div>`;
  document.getElementById("modalDetailFooter").innerHTML =
    `<button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Tutup</button>`;
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
          <div class="mb-2"><span class="text-muted small">No. HP Pelanggan</span>
            <div>${
              d.NOHP
                ? `<span class="fw-semibold">${escapeHtml(d.NOHP)}</span> <i class="fab fa-whatsapp text-success ms-1"></i>`
                : '<span class="text-muted fst-italic small">Belum diisi</span>'
            }</div>
          </div>
          <div class="mb-2"><span class="text-muted small">Catatan</span><div>${escapeHtml(d.CATATAN ?? "-")}</div></div>
        </div>
      </div><hr>`;

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

      if (s.LAYANAN?.length) {
        html += `<h6 class="fw-bold mb-2 mt-3"><i class="fa-solid fa-tag me-2 text-warning"></i>Layanan Servis</h6>
          <div class="table-responsive mb-3"><table class="table table-sm table-bordered mb-0">
            <thead class="table-light"><tr><th class="text-center">#</th><th>Nama Layanan</th><th class="text-end">Biaya</th></tr></thead>
            <tbody>${s.LAYANAN.map(
              (l, i) => `<tr>
              <td class="text-center">${i + 1}</td>
              <td>${escapeHtml(l.NAMA_LAYANAN ?? l.NAMA ?? "-")}</td>
              <td class="text-end">${formatRupiah(l.BIAYA ?? l.BIAYAPOKOK)}</td>
            </tr>`,
            ).join("")}</tbody>
          </table></div>`;
      }
      if (s.SPAREPART?.length) {
        html += `<h6 class="fw-bold mb-2 mt-3"><i class="fa fa-gear me-2 text-secondary"></i>Sparepart</h6>
          <div class="table-responsive mb-3"><table class="table table-sm table-bordered mb-0">
            <thead class="table-light"><tr><th class="text-center">#</th><th>Nama</th><th class="text-center">Qty</th><th class="text-end">Harga</th><th class="text-end">Subtotal</th></tr></thead>
            <tbody>${s.SPAREPART.map(
              (sp, i) => `<tr>
              <td class="text-center">${i + 1}</td>
              <td>${escapeHtml(sp.NAMA_SPAREPART ?? sp.NAMA ?? "-")}</td>
              <td class="text-center">${sp.QTY}</td>
              <td class="text-end">${formatRupiah(sp.HARGASATUAN)}</td>
              <td class="text-end">${formatRupiah(sp.SUBTOTAL)}</td>
            </tr>`,
            ).join("")}</tbody>
          </table></div>`;
      }
      if (s.PROGRESS?.length) {
        html += `<h6 class="fw-bold mb-2 mt-3"><i class="fa-solid fa-timeline me-2 text-info"></i>Progress</h6>
          <ul class="list-group list-group-flush mb-2">${s.PROGRESS.map(
            (p) => `
            <li class="list-group-item px-0 py-2 d-flex gap-3 align-items-start">
              <div>${badgeStatus(p.STATUS)}</div>
              <div><div class="small text-muted">${formatTanggal(p.WAKTU)}</div><div>${escapeHtml(p.KETERANGAN ?? "-")}</div></div>
            </li>`,
          ).join("")}</ul>`;
      }
    } else if (!isServis && d.ITEMS?.length) {
      html += `<h6 class="fw-bold mb-2"><i class="fa fa-gear me-2 text-success"></i>Detail Pembelian</h6>
        <div class="table-responsive"><table class="table table-sm table-bordered mb-0">
          <thead class="table-light"><tr><th class="text-center">#</th><th>Sparepart</th><th class="text-center">Jumlah</th><th class="text-end">Harga</th><th class="text-end">Subtotal</th></tr></thead>
          <tbody>${d.ITEMS.map(
            (item, i) => `<tr>
            <td class="text-center">${i + 1}</td>
            <td>${escapeHtml(item.NAMA_SPAREPART ?? "-")}</td>
            <td class="text-center">${item.JUMLAH}</td>
            <td class="text-end">${formatRupiah(item.HARGA_SATUAN)}</td>
            <td class="text-end">${formatRupiah(item.SUB_TOTAL)}</td>
          </tr>`,
          ).join("")}</tbody>
        </table></div>`;
    }

    document.getElementById("modalDetailBody").innerHTML = html;
    document.getElementById("modalDetailLabel").textContent =
      "Detail Transaksi — " + d.NOTRANSAKSI;
    document.getElementById("modalDetailFooter").innerHTML = `
      <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss="modal">Tutup</button>
      <button type="button" class="btn btn-primary btn-sm"
        onclick="document.getElementById('modalDetail').querySelector('.btn-close').click(); setTimeout(()=>bukaStruk(${d.IDTRANSAKSI}),300)">
        <i class="fa fa-receipt me-1"></i>Cetak / Kirim Struk
      </button>`;
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
  return `<span class="badge ${map[status] || "bg-secondary"}">${escapeHtml(status ?? "-")}</span>`;
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

  let pages = `<li class="page-item ${currentPage === 1 ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
      <i class="fa fa-chevron-left" style="font-size:11px"></i></a></li>`;

  let sp = Math.max(1, currentPage - 2);
  let ep = Math.min(totalPages, sp + 4);
  if (ep - sp < 4) sp = Math.max(1, ep - 4);

  if (sp > 1) {
    pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1);return false;">1</a></li>`;
    if (sp > 2)
      pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
  }
  for (let p = sp; p <= ep; p++) {
    pages += `<li class="page-item ${p === currentPage ? "active" : ""}">
      <a class="page-link" href="#" onclick="goToPage(${p});return false;">${p}</a></li>`;
  }
  if (ep < totalPages) {
    if (ep < totalPages - 1)
      pages += `<li class="page-item disabled"><span class="page-link">…</span></li>`;
    pages += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages});return false;">${totalPages}</a></li>`;
  }
  pages += `<li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage + 1});return false;">
      <i class="fa fa-chevron-right" style="font-size:11px"></i></a></li>`;

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

/* ===== FILTER & SEARCH ===== */
function searchData() {
  applyFilter();
}
function filterData() {
  applyFilter();
}

function applyFilter() {
  const keyword = document.getElementById("searchInput").value.toLowerCase();
  const jenis = document.getElementById("filterJenis").value;
  const tglMulai = document.getElementById("filterTanggalMulai").value;
  const tglAkhir = document.getElementById("filterTanggalAkhir").value;

  filteredData = allData.filter((item) => {
    const matchKeyword =
      !keyword ||
      (item.NOTRANSAKSI ?? "").toLowerCase().includes(keyword) ||
      (item.NAMA_KASIR ?? "").toLowerCase().includes(keyword);
    const matchJenis = !jenis || item.JENISTRANSAKSI === jenis;
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

/* ===== UTILS ===== */
function formatRupiah(angka) {
  return "Rp " + Number(angka || 0).toLocaleString("id-ID");
}
function rupiah(val) {
  return "Rp " + (Number(val) || 0).toLocaleString("id-ID");
}

function formatTanggal(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function formatTanggalLong(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function esc(str) {
  return escapeHtml(str);
}

function renderError(msg) {
  document.getElementById("tableBody").innerHTML =
    `<tr><td colspan="8" class="text-center py-4 text-danger">
      <i class="fa fa-circle-exclamation me-2"></i>${msg}</td></tr>`;
  document.getElementById("paginationContainer").innerHTML = "";
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
