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
  strukData = null;

  // Tampilkan modal aksi dengan loading
  var modal = new bootstrap.Modal(document.getElementById("modalStruk"));
  document.getElementById("modalStrukLabel").textContent = "Struk Transaksi";
  document.getElementById("struk-action-btns").style.display = "none";
  document.getElementById("struk-loading").style.display = "block";
  document.getElementById("struk-error").style.display = "none";
  updateStrukNohpUI(null);
  modal.show();

  // Fetch data
  try {
    const res = await fetch(`${API_BASE_URL}/transaksi/struk/${idTransaksi}`, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Gagal memuat struk");
    strukData = json.data;
    updateStrukNohpUI(strukData.NOHP);
    document.getElementById("modalStrukLabel").textContent =
      "Struk — " + strukData.NOTRANSAKSI;
    document.getElementById("struk-loading").style.display = "none";
    document.getElementById("struk-action-btns").style.display = "flex";
  } catch (err) {
    document.getElementById("struk-loading").style.display = "none";
    document.getElementById("struk-error").textContent = err.message;
    document.getElementById("struk-error").style.display = "block";
  }
}

function tutupStrukPopup() {
  // kept for backward compat
}

function renderStrukContent(t) {
  const isServis = t.JENISTRANSAKSI === "SERVIS";

  // ── Build items list (thermal style: nomor. Nama, qty x harga → subtotal) ──
  let itemsHtml = "";
  let totalQty = 0;
  let itemNo = 0;

  function addItem(nama, qty, satuan, hargaSatuan, subtotal) {
    itemNo++;
    totalQty += Number(qty) || 0;
    const qtyLabel = satuan
      ? `${qty} ${satuan} x ${formatRibu(hargaSatuan)}`
      : `${qty} x ${formatRibu(hargaSatuan)}`;
    itemsHtml += `
      <div class="struk-item">
        <div class="struk-item-name">${itemNo}. ${esc(nama)}</div>
        <div class="struk-item-detail">
          <span>${qtyLabel}</span>
          <span>Rp ${formatRibu(subtotal)}</span>
        </div>
      </div>`;
  }

  if (isServis) {
    (t.LAYANAN || []).forEach((l) =>
      addItem(l.NAMA_LAYANAN, 1, "servis", l.BIAYA, l.BIAYA),
    );
    (t.SPAREPART || []).forEach((s) =>
      addItem(s.NAMA_SPAREPART, s.QTY, "pcs", s.HARGASATUAN, s.SUBTOTAL),
    );
  } else {
    (t.ITEMS || []).forEach((i) =>
      addItem(i.NAMA_SPAREPART, i.JUMLAH, "", i.HARGA_SATUAN, i.SUB_TOTAL),
    );
  }

  // ── Tanggal & jam ──
  const tgl = t.TANGGAL ? new Date(t.TANGGAL) : new Date();
  const tglStr = tgl.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const jamStr = tgl.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // ── Info servis (pelanggan, mekanik) ──
  let metaRightHtml = `
    <span class="val">${esc(t.NAMA_KASIR || "-")}</span>`;
  if (isServis && t.SERVIS) {
    metaRightHtml = `
      <span class="val">${esc(t.NAMA_KASIR || "-")}</span>
      <span class="val">${esc(t.SERVIS.NAMAPELANGGAN || "-")}</span>`;
    if (t.SERVIS.KELUHAN) {
      metaRightHtml += `<span class="val" style="font-size:11px">${esc(t.SERVIS.KELUHAN)}</span>`;
    }
  }

  document.getElementById("struk-print-area").innerHTML = `
    <div class="struk-logo">🏪</div>

    <div class="struk-header">
      <h5>${BENGKEL.nama}</h5>
      <p>${BENGKEL.alamat}</p>
      <p>No. Telp ${BENGKEL.telp}</p>
    </div>

    <hr class="struk-divider">

    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px">
      <span>${tglStr}<br>${jamStr}</span>
      <span style="text-align:right">kasir<br>${esc(t.NAMA_KASIR || "-")}${isServis && t.SERVIS ? "<br>" + esc(t.SERVIS.NAMAPELANGGAN || "") : ""}</span>
    </div>

    <div class="struk-no">No.${esc(t.NOTRANSAKSI)}</div>

    <hr class="struk-divider">

    <div class="struk-items">
      ${itemsHtml || '<div style="color:#999;font-size:12px">Tidak ada item</div>'}
    </div>

    <hr class="struk-divider">

    <div class="struk-total-section">
      <div class="struk-total-row">
        <span>Total QTY : ${totalQty}</span>
      </div>
      <br>
      <div class="struk-total-row">
        <span>Sub Total</span>
        <span>Rp ${formatRibu(t.TOTAL)}</span>
      </div>
      <div class="struk-total-row grand">
        <span>Total</span>
        <span>Rp ${formatRibu(t.TOTAL)}</span>
      </div>
      ${t.CATATAN ? `<div class="struk-total-row" style="font-size:12px;color:#555"><span>Catatan</span><span>${esc(t.CATATAN)}</span></div>` : ""}
    </div>

    <hr class="struk-divider">

    <div class="struk-footer">
      <p style="font-weight:700">Terimakasih Telah Berbelanja</p>
      <p>${BENGKEL.nama}</p>
      <p style="margin-top:4px;font-size:11px">${BENGKEL.telp}</p>
    </div>
  `;

  document.getElementById("modalStrukLabel").textContent =
    "Struk — " + t.NOTRANSAKSI;
}

/* ── Format angka tanpa "Rp" prefix (untuk inline di struk) ── */
function formatRibu(n) {
  return Number(n || 0).toLocaleString("id-ID");
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
    // Tombol WA tetap aktif — user bisa isi input manual sebelum klik
    if (btnWA) btnWA.disabled = false;
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

/* ── Konversi area struk ke canvas ── */
/* ── Struk: cetak & download (tanpa html2canvas) ─────────────────
   Pendekatan: bangun struk sebagai SVG murni menggunakan canvas 2D API.
   Tidak butuh library eksternal, tidak ada iframe, tidak ada file:// issue.
──────────────────────────────────────────────────────────── */

/**
 * Render isi struk ke HTMLCanvasElement menggunakan Canvas 2D API.
 * Tidak bergantung pada html2canvas — 100% client-side, aman di file://.
 */
function renderStrukKeCanvas() {
  if (!strukData) throw new Error("Data struk tidak tersedia.");

  const t = strukData;
  const isServis = t.JENISTRANSAKSI === "SERVIS";

  /* ── Kumpulkan semua baris teks ─────────────────────────────── */
  var lines = [];
  function add(left, right, bold) {
    lines.push({ left: left || "", right: right || "", bold: !!bold });
  }
  function separator() {
    lines.push({ sep: true });
  }
  function center(text, bold) {
    lines.push({ center: text, bold: !!bold });
  }

  // Header
  center(BENGKEL.nama, true);
  center(BENGKEL.alamat);
  center("No. Telp " + BENGKEL.telp);
  separator();

  // Tanggal & kasir
  var tgl = t.TANGGAL ? new Date(t.TANGGAL) : new Date();
  var tglStr = tgl.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  var jamStr = tgl.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  add(tglStr, "kasir");
  add(jamStr, esc(t.NAMA_KASIR || "-"));
  if (isServis && t.SERVIS) add("", esc(t.SERVIS.NAMAPELANGGAN || ""));
  add("No." + esc(t.NOTRANSAKSI), "");
  separator();

  // Items
  var itemNo = 0;
  var totalQty = 0;

  function addItem(nama, qty, satuan, harga, subtotal) {
    itemNo++;
    totalQty += Number(qty) || 0;
    var qtyLabel = satuan
      ? qty + " " + satuan + " x " + formatRibu(harga)
      : qty + " x " + formatRibu(harga);
    lines.push({ itemName: itemNo + ". " + esc(nama) });
    add("  " + qtyLabel, "Rp " + formatRibu(subtotal));
  }

  if (isServis) {
    (t.LAYANAN || []).forEach(function (l) {
      addItem(l.NAMA_LAYANAN, 1, "servis", l.BIAYA, l.BIAYA);
    });
    (t.SPAREPART || []).forEach(function (s) {
      addItem(s.NAMA_SPAREPART, s.QTY, "pcs", s.HARGASATUAN, s.SUBTOTAL);
    });
  } else {
    (t.ITEMS || []).forEach(function (i) {
      addItem(i.NAMA_SPAREPART, i.JUMLAH, "", i.HARGA_SATUAN, i.SUB_TOTAL);
    });
  }

  separator();
  add("Total QTY : " + totalQty, "");
  add("", "");
  add("Sub Total", "Rp " + formatRibu(t.TOTAL));
  add("Total", "Rp " + formatRibu(t.TOTAL), true);
  if (t.CATATAN) add("Catatan", esc(t.CATATAN));
  separator();
  center("Terimakasih Telah Berbelanja", true);
  center(BENGKEL.nama);
  center(BENGKEL.telp);

  /* ── Render ke canvas ───────────────────────────────────────── */
  var W = 560; // lebar canvas — lebih lebar = lebih besar saat cetak
  var SCALE = 2; // retina 2x
  var FONT_SZ = 15;
  var LINE_H = 23;
  var PAD_X = 20;
  var PAD_Y = 24;

  // First pass: hitung tinggi
  var totalH = PAD_Y * 2;
  lines.forEach(function (l) {
    if (l.sep) {
      totalH += 12;
    } else if (l.itemName) {
      totalH += LINE_H;
    } else {
      totalH += LINE_H;
    }
  });

  var canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = totalH * SCALE;
  var ctx = canvas.getContext("2d");
  ctx.scale(SCALE, SCALE);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, totalH);

  ctx.font = FONT_SZ + "px 'Courier New', monospace";
  ctx.fillStyle = "#111111";
  ctx.textBaseline = "top";

  var y = PAD_Y;

  lines.forEach(function (l) {
    if (l.sep) {
      // Dashed line
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(PAD_X, y + 5);
      ctx.lineTo(W - PAD_X, y + 5);
      ctx.stroke();
      ctx.setLineDash([]);
      y += 12;
    } else if (l.center !== undefined) {
      ctx.font =
        (l.bold ? "bold " : "") + FONT_SZ + "px 'Courier New', monospace";
      ctx.fillStyle = "#111";
      var tw = ctx.measureText(l.center).width;
      ctx.fillText(l.center, Math.max(PAD_X, (W - tw) / 2), y);
      y += LINE_H;
    } else if (l.itemName !== undefined) {
      ctx.font = "bold " + FONT_SZ + "px 'Courier New', monospace";
      ctx.fillStyle = "#111";
      ctx.fillText(l.itemName, PAD_X, y);
      y += LINE_H;
    } else {
      ctx.font =
        (l.bold ? "bold " : "") + FONT_SZ + "px 'Courier New', monospace";
      ctx.fillStyle = "#111";
      // Left text
      if (l.left) ctx.fillText(l.left, PAD_X, y);
      // Right text
      if (l.right) {
        var rw = ctx.measureText(l.right).width;
        ctx.fillText(l.right, W - PAD_X - rw, y);
      }
      y += LINE_H;
    }
  });

  return canvas;
}

/* ── Download gambar PNG ─────────────────────────────────────── */
function downloadStrukGambar() {
  if (!strukData) return;
  var btn = document.getElementById("btn-download-img");
  var orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Proses...';

  try {
    var canvas = renderStrukKeCanvas();
    canvas.toBlob(function (blob) {
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "struk-" + strukData.NOTRANSAKSI + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 5000);
      btn.disabled = false;
      btn.innerHTML = orig;
    }, "image/png");
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal Download",
      text: err.message,
      confirmButtonColor: "#0070F3",
    });
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ── Kirim WA ────────────────────────────────────────────────── */
function kirimWAStruk() {
  if (!strukData) return;

  // Ambil nomor dari strukData ATAU dari input field (jika user isi tapi belum simpan)
  var nohp = (strukData.NOHP || "").trim();
  var inputEl = document.getElementById("struk-nohp-input");
  if (!nohp && inputEl) nohp = inputEl.value.trim();

  if (!nohp) {
    Swal.fire({
      icon: "warning",
      title: "No. HP Kosong",
      text: "Masukkan dan simpan No. HP pelanggan terlebih dahulu.",
      confirmButtonColor: "#0070F3",
    });
    return;
  }

  var btn = document.getElementById("btn-kirim-wa");
  var orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Proses...';

  try {
    var canvas = renderStrukKeCanvas();
    canvas.toBlob(function (blob) {
      // Download gambar struk
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "struk-" + strukData.NOTRANSAKSI + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 5000);

      // Format nomor WA
      var nomor = nohp.replace(/[^0-9]/g, "");
      if (nomor.charAt(0) === "0") nomor = "62" + nomor.slice(1);

      var tgl = formatTanggalLong(strukData.TANGGAL);
      var teks =
        "Terima kasih telah melakukan transaksi di *" +
        BENGKEL.nama +
        "*, ini adalah struk Anda pada " +
        tgl +
        ".";

      setTimeout(function () {
        window.open(
          "https://wa.me/" + nomor + "?text=" + encodeURIComponent(teks),
          "_blank",
        );
      }, 600);

      btn.disabled = false;
      btn.innerHTML = orig;
    }, "image/png");
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal",
      text: err.message,
      confirmButtonColor: "#0070F3",
    });
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ── Cetak / PDF ─────────────────────────────────────────────── */
function downloadStrukPdf() {
  if (!strukData) return;
  var btn = document.getElementById("btn-download-pdf");
  var orig = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-sm"></span> Proses...';

  try {
    var canvas = renderStrukKeCanvas();
    var imgData = canvas.toDataURL("image/png");
    var noTrx = strukData.NOTRANSAKSI;

    var html =
      "<!DOCTYPE html><html><head>" +
      '<meta charset="utf-8"><title>Struk ' +
      noTrx +
      "</title>" +
      "<style>" +
      "* { margin:0; padding:0; box-sizing:border-box; }" +
      "body { background:#fff; display:flex; justify-content:center; padding:16px; }" +
      "img { width:80mm; max-width:100%; display:block; }" +
      "@media print { body { padding:0; margin:0; } @page { margin:4mm; size: 80mm auto; } }" +
      "</style></head><body>" +
      '<img src="' +
      imgData +
      '" onload="window.print();">' +
      "</body></html>";

    var blob = new Blob([html], { type: "text/html" });
    var blobUrl = URL.createObjectURL(blob);
    var win = window.open(blobUrl, "_blank");
    if (win) {
      setTimeout(function () {
        URL.revokeObjectURL(blobUrl);
      }, 30000);
    } else {
      // Popup diblokir — download file html langsung
      var a = document.createElement("a");
      a.href = blobUrl;
      a.download = "struk-" + noTrx + ".html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        URL.revokeObjectURL(blobUrl);
      }, 5000);
      Swal.fire({
        icon: "info",
        title: "File Diunduh",
        html:
          "File <b>struk-" +
          noTrx +
          ".html</b> sudah diunduh.<br>Buka lalu cetak (Ctrl+P).",
        confirmButtonColor: "#0070F3",
      });
    }
  } catch (err) {
    Swal.fire({
      icon: "error",
      title: "Gagal Cetak",
      text: err.message,
      confirmButtonColor: "#0070F3",
    });
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}

/* ── Cetak langsung ── */
function cetakStruk() {
  downloadStrukPdf();
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
        html += buildProgressTimeline(s.PROGRESS, formatTanggal);
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

function buildProgressTimeline(progressArr, formatWaktiFn) {
  if (!progressArr || !progressArr.length) return "";

  var statusKey = {
    Belum: "belum",
    "Dalam Proses": "proses",
    Selesai: "selesai",
  };

  var items = progressArr.map(function (p, i) {
    var isLast = i === progressArr.length - 1;
    var dotCls = statusKey[p.STATUS] || "belum";
    var waktu = formatWaktiFn ? formatWaktiFn(p.WAKTU) : p.WAKTU || "-";
    var ket =
      typeof escapeHtml === "function"
        ? escapeHtml(p.KETERANGAN || "-")
        : p.KETERANGAN || "-";
    var label =
      typeof escapeHtml === "function"
        ? escapeHtml(p.STATUS || "-")
        : p.STATUS || "-";

    return (
      '<div class="timeline-item">' +
      '<div class="timeline-item-left">' +
      '<div class="timeline-dot ' +
      dotCls +
      '"></div>' +
      (isLast ? "" : '<div class="timeline-line"></div>') +
      "</div>" +
      '<div class="timeline-content">' +
      '<div class="timeline-status">' +
      label +
      "</div>" +
      '<div class="timeline-time">' +
      waktu +
      "</div>" +
      '<div class="timeline-keterangan">' +
      ket +
      "</div>" +
      "</div>" +
      "</div>"
    );
  });

  return (
    '<div style="margin-bottom:8px">' +
    '<div class="timeline-heading">' +
    '<i class="fa-solid fa-timeline"></i> RIWAYAT PROGRESS' +
    "</div>" +
    '<div class="timeline">' +
    items.join("") +
    "</div>" +
    "</div>"
  );
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
