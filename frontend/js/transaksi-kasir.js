/* ===== KONFIGURASI ===== */
const API_BASE_URL = "http://localhost:3000/api";

const BENGKEL = {
  nama: "Bengkel Any Jaya",
  alamat: "Kalitengah, Kec. Tanggulangin, Kab. Sidoarjo, Jawa Timur 61272",
  telp: "+62 897-9980-073",
};

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

/* ===== STATE ===== */
var layananTerpilih = [];
var sparepartTerpilih = [];
var strukData = null; // data struk aktif di modal

/* ===== INIT ===== */
(function ($) {
  "use strict";

  setTimeout(function () {
    if ($("#spinner").length > 0) $("#spinner").removeClass("show");
  }, 1);

  $(document).ready(function () {
    if (!Session.guard(["kasir"])) return;
    Session.setupAjax();

    var _u = Session.getUser();
    if (_u) {
      $("#navbar-nama").text(_u.NAMA);
      $("#navbar-role").text(_u.ROLE);
    }

    $("#inputTanggal").val(new Date().toISOString().split("T")[0]);
    loadMekanik();

    $("#btnCariLayanan").on("click", function () {
      cariLayanan();
    });
    $("#btnCariSparepart").on("click", function () {
      cariSparepart();
    });
    $("#inputCariLayanan").on("keypress", function (e) {
      if (e.which === 13) cariLayanan();
    });
    $("#inputCariSparepart").on("keypress", function (e) {
      if (e.which === 13) cariSparepart();
    });

    $(document).on("click", function (e) {
      if (
        !$(e.target).closest(
          "#inputCariLayanan, #hasilCariLayanan, #btnCariLayanan",
        ).length
      )
        $("#hasilCariLayanan").addClass("d-none");
      if (
        !$(e.target).closest(
          "#inputCariSparepart, #hasilCariSparepart, #btnCariSparepart",
        ).length
      )
        $("#hasilCariSparepart").addClass("d-none");
    });

    $("#inputNohp").on("input", function () {
      this.value = this.value.replace(/[^0-9+]/g, "");
    });
  });

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
    $("#sidebarOverlay").toggleClass("show");
    return false;
  });
  $("#sidebarOverlay").click(function () {
    $(".sidebar, .content").removeClass("open");
    $(this).removeClass("show");
  });
})(jQuery);

/* ===== LOAD MEKANIK ===== */
function loadMekanik() {
  fetch(API_BASE_URL + "/user/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var list = (res.data || []).filter(function (u) {
        return u.ROLE === "mekanik" && u.STATUS === "AKTIF";
      });
      var $sel = $("#selectMekanik");
      $sel.find("option:not(:first)").remove();
      if (!list.length) {
        $sel.append("<option disabled>Tidak ada mekanik aktif</option>");
        return;
      }
      list.forEach(function (m) {
        $sel.append('<option value="' + m.IDUSER + '">' + m.NAMA + "</option>");
      });
    })
    .catch(function () {
      $("#selectMekanik").after(
        '<small class="text-danger d-block mt-1">Gagal memuat daftar mekanik</small>',
      );
    });
}

/* ===== JENIS TRANSAKSI CHANGE ===== */
function onJenisTransaksiChange() {
  var jenis = $("#selectJenisTransaksi").val();
  $("#sectionServis, #sectionSparepart").addClass("d-none");
  $("#btnTambahTransaksi").hide();
  layananTerpilih = [];
  sparepartTerpilih = [];
  renderTabelLayanan();
  renderTabelSparepart();

  if (jenis) {
    $("#wrapNohp").show();
  } else {
    $("#wrapNohp").hide();
    $("#inputNohp").val("");
  }

  if (jenis === "servis") {
    $("#sectionServis").removeClass("d-none");
    $("#btnTambahTransaksi").show();
  }
  if (jenis === "sparepart") {
    $("#sectionSparepart").removeClass("d-none");
    $("#btnTambahTransaksi").show();
  }
}

/* ===== HELPER NOHP ===== */
function getNohp() {
  var raw = ($("#inputNohp").val() || "").trim().replace(/[^0-9+]/g, "");
  return raw.length >= 9 ? raw : null;
}

/* ===== CARI LAYANAN ===== */
function cariLayanan() {
  var keyword = $("#inputCariLayanan").val().trim().toLowerCase();
  var $box = $("#hasilCariLayanan").empty().removeClass("d-none");
  $box.html('<div class="hasil-item text-muted">Mencari...</div>');

  fetch(API_BASE_URL + "/layanan-servis/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var list = (res.data || res).filter(function (item) {
        return !keyword || item.NAMA.toLowerCase().includes(keyword);
      });
      $box.empty();
      if (!list.length) {
        $box.append('<div class="hasil-item text-muted">Tidak ditemukan</div>');
        return;
      }
      list.forEach(function (item) {
        $('<div class="hasil-item">')
          .html(
            '<span class="fw-semibold">' +
              item.NAMA +
              "</span>" +
              '<span class="text-muted ms-2">' +
              formatRupiah(item.BIAYAPOKOK) +
              "</span>" +
              '<small class="text-secondary ms-1">(' +
              (item.KODELAYANAN || "") +
              ")</small>",
          )
          .on("click", function () {
            pilihLayanan(item);
            $box.addClass("d-none");
            $("#inputCariLayanan").val("");
          })
          .appendTo($box);
      });
    })
    .catch(function () {
      $box.html(
        '<div class="hasil-item text-danger">Gagal memuat data layanan</div>',
      );
    });
}

function pilihLayanan(item) {
  if (
    layananTerpilih.find(function (l) {
      return l.IDLAYANANSERVIS === item.IDLAYANANSERVIS;
    })
  ) {
    Swal.fire("Info", "Layanan sudah ditambahkan.", "info");
    return;
  }
  layananTerpilih.push(item);
  renderTabelLayanan();
}

function hapusLayanan(id) {
  layananTerpilih = layananTerpilih.filter(function (l) {
    return l.IDLAYANANSERVIS !== id;
  });
  renderTabelLayanan();
}

function renderTabelLayanan() {
  var $tbody = $("#tbodyLayanan").empty();
  if (!layananTerpilih.length) {
    $tbody.append(
      '<tr><td colspan="4" class="text-center text-muted">Belum ada layanan dipilih</td></tr>',
    );
    $("#totalServis").text("Rp0");
    return;
  }
  var total = 0;
  layananTerpilih.forEach(function (item, i) {
    total += Number(item.BIAYAPOKOK);
    $tbody.append(
      "<tr><td>" +
        (i + 1) +
        "</td><td>" +
        item.NAMA +
        "</td><td>" +
        formatRupiah(item.BIAYAPOKOK) +
        "</td>" +
        "<td><button class='btn btn-danger btn-sm btn-qty' onclick='hapusLayanan(" +
        item.IDLAYANANSERVIS +
        ")'>" +
        "<i class='fa-solid fa-trash-can'></i></button></td></tr>",
    );
  });
  $("#totalServis").text(formatRupiah(total));
}

/* ===== CARI SPAREPART ===== */
function cariSparepart() {
  var keyword = $("#inputCariSparepart").val().trim().toLowerCase();
  var $box = $("#hasilCariSparepart").empty().removeClass("d-none");
  $box.html('<div class="hasil-item text-muted">Mencari...</div>');

  fetch(API_BASE_URL + "/sparepart/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var list = (res.data || res).filter(function (item) {
        return !keyword || item.NAMA.toLowerCase().includes(keyword);
      });
      $box.empty();
      if (!list.length) {
        $box.append('<div class="hasil-item text-muted">Tidak ditemukan</div>');
        return;
      }
      list.forEach(function (item) {
        var stokLabel =
          item.STOK <= 0
            ? '<span class="badge bg-danger ms-1">Stok Habis</span>'
            : '<span class="text-muted ms-2">Stok: ' + item.STOK + "</span>";
        $(
          '<div class="hasil-item' +
            (item.STOK <= 0 ? " disabled-item" : "") +
            '">',
        )
          .html(
            '<span class="fw-semibold">' +
              item.NAMA +
              "</span>" +
              '<span class="text-muted ms-2">' +
              formatRupiah(item.HARGAJUAL) +
              "</span>" +
              stokLabel,
          )
          .on("click", function () {
            if (item.STOK <= 0) {
              Swal.fire("Peringatan", "Stok sparepart habis.", "warning");
              return;
            }
            pilihSparepart(item);
            $box.addClass("d-none");
            $("#inputCariSparepart").val("");
          })
          .appendTo($box);
      });
    })
    .catch(function () {
      $box.html(
        '<div class="hasil-item text-danger">Gagal memuat data sparepart</div>',
      );
    });
}

function pilihSparepart(item) {
  var existing = sparepartTerpilih.find(function (s) {
    return s.IDSPAREPART === item.IDSPAREPART;
  });
  if (existing) {
    if (existing.qty < existing.STOK) existing.qty++;
    else {
      Swal.fire(
        "Info",
        "Jumlah melebihi stok tersedia (" + item.STOK + ").",
        "info",
      );
      return;
    }
  } else {
    sparepartTerpilih.push(Object.assign({}, item, { qty: 1 }));
  }
  renderTabelSparepart();
}

function ubahQtySparepart(id, delta) {
  var idx = sparepartTerpilih.findIndex(function (s) {
    return s.IDSPAREPART === id;
  });
  if (idx === -1) return;
  var item = sparepartTerpilih[idx];
  var newQty = item.qty + delta;
  if (newQty <= 0) {
    sparepartTerpilih.splice(idx, 1);
  } else if (newQty > item.STOK) {
    Swal.fire("Info", "Jumlah melebihi stok (" + item.STOK + ").", "info");
    return;
  } else {
    sparepartTerpilih[idx].qty = newQty;
  }
  renderTabelSparepart();
}

function renderTabelSparepart() {
  var $tbody = $("#tbodySparepart").empty();
  if (!sparepartTerpilih.length) {
    $tbody.append(
      '<tr><td colspan="6" class="text-center text-muted">Belum ada sparepart dipilih</td></tr>',
    );
    $("#totalSparepart").text("Rp0");
    return;
  }
  var total = 0;
  sparepartTerpilih.forEach(function (item, i) {
    var subtotal = Number(item.HARGAJUAL) * item.qty;
    total += subtotal;
    $tbody.append(
      "<tr><td>" +
        (i + 1) +
        "</td><td>" +
        item.NAMA +
        "</td><td>" +
        item.qty +
        "</td>" +
        "<td>" +
        formatRupiah(item.HARGAJUAL) +
        "</td><td>" +
        formatRupiah(subtotal) +
        "</td>" +
        "<td class='text-center'>" +
        "<button class='btn btn-danger btn-qty me-1' onclick='ubahQtySparepart(" +
        item.IDSPAREPART +
        ", -1)'><i class='fa-solid fa-minus'></i></button>" +
        "<button class='btn btn-success btn-qty' onclick='ubahQtySparepart(" +
        item.IDSPAREPART +
        ", 1)'><i class='fa-solid fa-plus'></i></button>" +
        "</td></tr>",
    );
  });
  $("#totalSparepart").text(formatRupiah(total));
}

/* ===== TAMBAH TRANSAKSI ===== */
function tambahTransaksi() {
  var jenis = $("#selectJenisTransaksi").val();
  var tanggal = $("#inputTanggal").val();
  if (!jenis)
    return Swal.fire("Peringatan", "Pilih jenis transaksi.", "warning");
  if (!tanggal)
    return Swal.fire("Peringatan", "Pilih tanggal transaksi.", "warning");
  var user = Session.getUser();
  if (!user || !user.IDUSER)
    return Swal.fire("Peringatan", "Sesi tidak valid.", "warning");
  if (jenis === "servis") prosesServis(user.IDUSER);
  if (jenis === "sparepart") prosesPembelian(user.IDUSER);
}

function prosesServis(IDUSER_KASIR) {
  var nama = $("#inputNamaPelanggan").val().trim();
  var mekanik = $("#selectMekanik").val();
  var keluhan = $("#inputKeluhanServis").val().trim();
  if (!nama)
    return Swal.fire("Peringatan", "Masukkan nama pelanggan.", "warning");
  if (!mekanik) return Swal.fire("Peringatan", "Pilih mekanik.", "warning");
  if (!keluhan)
    return Swal.fire("Peringatan", "Masukkan keluhan pelanggan.", "warning");
  if (!layananTerpilih.length)
    return Swal.fire(
      "Peringatan",
      "Pilih minimal satu layanan servis.",
      "warning",
    );

  kirimTransaksi({
    IDUSER_KASIR: IDUSER_KASIR,
    IDUSER_MEKANIK: parseInt(mekanik),
    JENISTRANSAKSI: "SERVIS",
    NAMAPELANGGAN: nama,
    KELUHAN: keluhan,
    CATATAN: keluhan,
    NOHP: getNohp(),
    LAYANAN: layananTerpilih.map(function (l) {
      return { IDLAYANANSERVIS: l.IDLAYANANSERVIS };
    }),
  });
}

function prosesPembelian(IDUSER_KASIR) {
  if (!sparepartTerpilih.length)
    return Swal.fire("Peringatan", "Pilih minimal satu sparepart.", "warning");
  kirimTransaksi({
    IDUSER_KASIR: IDUSER_KASIR,
    JENISTRANSAKSI: "PEMBELIAN",
    CATATAN: $("#inputCatatanSparepart").val().trim() || null,
    NOHP: getNohp(),
    ITEMS: sparepartTerpilih.map(function (s) {
      return { IDSPAREPART: s.IDSPAREPART, JUMLAH: s.qty };
    }),
  });
}

function kirimTransaksi(payload) {
  setBtnLoading(true);

  fetch(API_BASE_URL + "/transaksi/create", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      setBtnLoading(false);
      if (!res.success) throw new Error(res.message || "Terjadi kesalahan.");

      var idTransaksi = res.data.IDTRANSAKSI;
      var noTransaksi = res.data.NOTRANSAKSI;

      // Tawaran buka struk setelah transaksi berhasil
      Swal.fire({
        title: "Transaksi Berhasil!",
        html:
          '<div style="font-size:.95rem;color:#374151">No. Transaksi: <strong>' +
          noTransaksi +
          "</strong></div>",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#1a56db",
        cancelButtonColor: "#6b7280",
        confirmButtonText:
          '<i class="fa fa-receipt me-1"></i> Cetak / Kirim Struk',
        cancelButtonText: "Tutup",
      }).then(function (result) {
        resetForm();
        if (result.isConfirmed) {
          bukaModalStruk(idTransaksi);
        }
      });
    })
    .catch(function (err) {
      setBtnLoading(false);
      Swal.fire(
        "Gagal",
        err.message || "Tidak dapat terhubung ke server.",
        "error",
      );
    });
}

/* ===================================================
   MODAL STRUK — sama persis dengan riwayat-transaksi-kasir
=================================================== */
async function bukaModalStruk(idTransaksi) {
  strukData = null;
  document.getElementById("struk-print-area").innerHTML =
    '<div class="text-center py-4"><div class="spinner-border spinner-border-sm text-primary" role="status"></div></div>';
  updateStrukNohpUI(null);
  document.getElementById("btn-kirim-wa").disabled = true;

  const modal = new bootstrap.Modal(document.getElementById("modalStruk"));
  modal.show();

  try {
    const res = await fetch(API_BASE_URL + "/transaksi/struk/" + idTransaksi, {
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || "Gagal memuat struk");
    strukData = json.data;
    renderStrukContent(strukData);
    updateStrukNohpUI(strukData.NOHP);
  } catch (err) {
    document.getElementById("struk-print-area").innerHTML =
      '<div class="text-center py-4 text-danger"><i class="fa fa-circle-exclamation me-2"></i>' +
      err.message +
      "</div>";
  }
}

function renderStrukContent(t) {
  const isServis = t.JENISTRANSAKSI === "SERVIS";
  let itemsHtml = "";

  if (isServis) {
    const layanan = t.LAYANAN || [];
    const sparepart = t.SPAREPART || [];
    if (layanan.length) {
      itemsHtml +=
        '<div class="section-title">Layanan Servis</div><table><thead><tr><th>Layanan</th><th>Ket.</th><th class="text-right">Biaya</th></tr></thead><tbody>';
      layanan.forEach((l) => {
        itemsHtml +=
          "<tr><td>" +
          esc(l.NAMA_LAYANAN) +
          "</td><td>" +
          esc(l.KETERANGAN || "-") +
          "</td><td class='text-right'>" +
          rupiah(l.BIAYA) +
          "</td></tr>";
      });
      itemsHtml += "</tbody></table>";
    }
    if (sparepart.length) {
      itemsHtml +=
        '<div class="section-title">Sparepart</div><table><thead><tr><th>Nama</th><th class="text-right">Qty</th><th class="text-right">Harga</th><th class="text-right">Sub</th></tr></thead><tbody>';
      sparepart.forEach((s) => {
        itemsHtml +=
          "<tr><td>" +
          esc(s.NAMA_SPAREPART) +
          "</td><td class='text-right'>" +
          s.QTY +
          "</td><td class='text-right'>" +
          rupiah(s.HARGASATUAN) +
          "</td><td class='text-right'>" +
          rupiah(s.SUBTOTAL) +
          "</td></tr>";
      });
      itemsHtml += "</tbody></table>";
    }
  } else {
    const items = t.ITEMS || [];
    if (items.length) {
      itemsHtml +=
        '<div class="section-title">Item Pembelian</div><table><thead><tr><th>Sparepart</th><th class="text-right">Qty</th><th class="text-right">Harga</th><th class="text-right">Sub</th></tr></thead><tbody>';
      items.forEach((i) => {
        itemsHtml +=
          "<tr><td>" +
          esc(i.NAMA_SPAREPART) +
          "</td><td class='text-right'>" +
          i.JUMLAH +
          "</td><td class='text-right'>" +
          rupiah(i.HARGA_SATUAN) +
          "</td><td class='text-right'>" +
          rupiah(i.SUB_TOTAL) +
          "</td></tr>";
      });
      itemsHtml += "</tbody></table>";
    }
  }

  let servisInfoHtml = "";
  if (isServis && t.SERVIS) {
    const s = t.SERVIS;
    servisInfoHtml =
      '<div class="section-title">Info Kendaraan</div><div class="struk-meta">' +
      '<span class="lbl">Pelanggan</span><span class="val">' +
      esc(s.NAMAPELANGGAN) +
      "</span>" +
      '<span class="lbl">Keluhan</span><span class="val">' +
      esc(s.KELUHAN || "-") +
      "</span>" +
      '<span class="lbl">No. Antrian</span><span class="val">' +
      esc(s.KODEANTRIAN || "-") +
      "</span>" +
      '<span class="lbl">Mekanik</span><span class="val">' +
      esc(s.NAMA_MEKANIK || "-") +
      "</span></div>";
  }

  document.getElementById("struk-print-area").innerHTML =
    '<div class="struk-header">' +
    '<i class="fa fa-wrench" style="font-size:20px;color:#333;margin-bottom:6px"></i>' +
    "<h5>" +
    BENGKEL.nama +
    "</h5><p>" +
    BENGKEL.alamat +
    "</p><p>Telp: " +
    BENGKEL.telp +
    "</p></div>" +
    '<div class="struk-meta">' +
    '<span class="lbl">No. Transaksi</span><span class="val">' +
    esc(t.NOTRANSAKSI) +
    "</span>" +
    '<span class="lbl">Tanggal</span><span class="val">' +
    formatTanggalLong(t.TANGGAL) +
    "</span>" +
    '<span class="lbl">Kasir</span><span class="val">' +
    esc(t.NAMA_KASIR || "-") +
    "</span>" +
    '<span class="lbl">Jenis</span><span class="val">' +
    (isServis ? "Servis Kendaraan" : "Pembelian Sparepart") +
    "</span></div>" +
    servisInfoHtml +
    itemsHtml +
    '<div class="struk-total">' +
    (t.CATATAN
      ? '<div class="catatan-row"><span>Catatan</span><span>' +
        esc(t.CATATAN) +
        "</span></div>"
      : "") +
    '<div class="grand-row"><span>TOTAL</span><span>' +
    rupiah(t.TOTAL) +
    "</span></div></div>" +
    '<div class="struk-footer"><p style="font-weight:700;font-size:13px">Terima kasih!</p>' +
    "<p>Simpan struk ini sebagai bukti pembayaran.</p>" +
    "<p>Pertanyaan? Hubungi kami di " +
    BENGKEL.telp +
    "</p></div>";

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
  const saved = document.getElementById("struk-nohp-saved");
  const feedback = document.getElementById("struk-nohp-feedback");
  if (saved) saved.style.display = "none";
  if (feedback) feedback.style.display = "none";
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
      API_BASE_URL + "/transaksi/nohp/" + strukData.IDTRANSAKSI,
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
  } catch (err) {
    feedback.textContent = "Gagal menyimpan: " + err.message;
    feedback.style.display = "block";
  } finally {
    btnSimpan.disabled = false;
    btnSimpan.textContent = "Simpan";
  }
}

/* ── Canvas helper ── */
async function strukToCanvas() {
  const el = document.getElementById("struk-print-area");
  const nohpBox = document.getElementById("struk-nohp-box");
  if (nohpBox) nohpBox.style.visibility = "hidden";
  const canvas = await html2canvas(el, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
    logging: false,
  });
  if (nohpBox) nohpBox.style.visibility = "";
  return canvas;
}

/* ── Download Gambar ── */
async function downloadStrukGambar() {
  if (!strukData) return;
  const btn = document.getElementById("btn-download-img");
  btn.disabled = true;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span>Proses...';
  try {
    const canvas = await strukToCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "struk-" + strukData.NOTRANSAKSI + ".png";
    a.click();
  } catch (err) {
    alert("Gagal membuat gambar: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa fa-image me-1"></i>Download Gambar';
  }
}

/* ── Kirim WA ── */
async function kirimWAStruk() {
  if (!strukData || !strukData.NOHP) return;
  const btn = document.getElementById("btn-kirim-wa");
  btn.disabled = true;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span>Proses...';
  try {
    const canvas = await strukToCanvas();
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "struk-" + strukData.NOTRANSAKSI + ".png";
    a.click();
    await new Promise((r) => setTimeout(r, 800));
    let nomor = strukData.NOHP.replace(/\D/g, "");
    if (nomor.startsWith("0")) nomor = "62" + nomor.slice(1);
    const teks =
      "Terima kasih telah melakukan transaksi di *" +
      BENGKEL.nama +
      "*, ini adalah struk Anda pada " +
      formatTanggalLong(strukData.TANGGAL) +
      ".";
    window.open(
      "https://wa.me/" + nomor + "?text=" + encodeURIComponent(teks),
      "_blank",
    );
  } catch (err) {
    alert("Gagal: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fab fa-whatsapp me-1"></i>Kirim WA (Gambar)';
  }
}

/* ── Cetak ── */
function cetakStruk() {
  window.print();
}

/* ===== RESET FORM ===== */
function resetForm() {
  $("#selectJenisTransaksi").val("");
  $("#sectionServis, #sectionSparepart").addClass("d-none");
  $("#btnTambahTransaksi").hide();
  $("#inputNamaPelanggan, #inputKeluhanServis, #inputCatatanSparepart").val("");
  $("#selectMekanik").val("");
  $("#inputNohp").val("");
  $("#wrapNohp").hide();
  layananTerpilih = [];
  sparepartTerpilih = [];
  renderTabelLayanan();
  renderTabelSparepart();
  $("#inputTanggal").val(new Date().toISOString().split("T")[0]);
}

/* ===== BANTUAN ===== */
function tampilkanBantuan() {
  // Isi modal sudah static di HTML — cukup buka modal
  new bootstrap.Modal(document.getElementById("modalBantuan")).show();
}

/* ===== UTILS ===== */
function formatRupiah(angka) {
  return "Rp" + Number(angka || 0).toLocaleString("id-ID");
}
function rupiah(val) {
  return "Rp " + (Number(val) || 0).toLocaleString("id-ID");
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
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function setBtnLoading(loading) {
  var $btn = $("#btnTambahTransaksi");
  if (loading) {
    $btn
      .prop("disabled", true)
      .html(
        '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...',
      );
  } else {
    $btn.prop("disabled", false).text("Tambahkan Transaksi");
  }
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
