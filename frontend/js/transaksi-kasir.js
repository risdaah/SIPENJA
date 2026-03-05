/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = "http://localhost:3000/api";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

/* ===================================================
   STATE
=================================================== */
var layananTerpilih = []; // [{IDLAYANANSERVIS, NAMA, BIAYAPOKOK}]
var sparepartTerpilih = []; // [{IDSPAREPART, NAMA, HARGAJUAL, STOK, qty}]

/* ===================================================
   INIT
=================================================== */
(function ($) {
  "use strict";

  // Spinner
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

    // Set tanggal hari ini
    $("#inputTanggal").val(new Date().toISOString().split("T")[0]);

    // Muat daftar mekanik
    loadMekanik();

    // ── Tombol Cari — pakai delegasi agar pasti terpasang ──
    $("#btnCariLayanan").on("click", function () {
      cariLayanan();
    });
    $("#btnCariSparepart").on("click", function () {
      cariSparepart();
    });

    // Enter pada input cari
    $("#inputCariLayanan").on("keypress", function (e) {
      if (e.which === 13) cariLayanan();
    });
    $("#inputCariSparepart").on("keypress", function (e) {
      if (e.which === 13) cariSparepart();
    });

    // Tutup dropdown saat klik luar
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
  });

  // Back to top
  $(window).scroll(function () {
    $(this).scrollTop() > 300
      ? $(".back-to-top").fadeIn("slow")
      : $(".back-to-top").fadeOut("slow");
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // Sidebar Toggler
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

/* ===================================================
   LOAD MEKANIK
   GET /api/user/get-all → filter ROLE=mekanik & STATUS=AKTIF
=================================================== */
function loadMekanik() {
  fetch(API_BASE_URL + "/user/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    })
    .then(function (res) {
      if (!res.success) throw new Error(res.message || "Gagal memuat mekanik");

      var list = res.data.filter(function (u) {
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
    .catch(function (err) {
      console.error("loadMekanik error:", err);
      $("#selectMekanik").after(
        '<small class="text-danger d-block mt-1">Gagal memuat daftar mekanik</small>',
      );
    });
}

/* ===================================================
   JENIS TRANSAKSI CHANGE
=================================================== */
function onJenisTransaksiChange() {
  var jenis = $("#selectJenisTransaksi").val();

  $("#sectionServis, #sectionSparepart").addClass("d-none");
  $("#btnTambahTransaksi").hide();

  layananTerpilih = [];
  sparepartTerpilih = [];
  renderTabelLayanan();
  renderTabelSparepart();

  if (jenis === "servis") {
    $("#sectionServis").removeClass("d-none");
    $("#btnTambahTransaksi").show();
  } else if (jenis === "sparepart") {
    $("#sectionSparepart").removeClass("d-none");
    $("#btnTambahTransaksi").show();
  }
}

/* ===================================================
   CARI LAYANAN SERVIS
   GET /api/layanan-servis/get-all
   Field: IDLAYANANSERVIS, NAMA, BIAYAPOKOK, KODELAYANAN
=================================================== */
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
      "<tr>" +
        "<td>" +
        (i + 1) +
        "</td>" +
        "<td>" +
        item.NAMA +
        "</td>" +
        "<td>" +
        formatRupiah(item.BIAYAPOKOK) +
        "</td>" +
        "<td>" +
        '<button class="btn btn-danger btn-sm btn-qty" onclick="hapusLayanan(' +
        item.IDLAYANANSERVIS +
        ')">' +
        '<i class="fa-solid fa-trash-can"></i>' +
        "</button>" +
        "</td>" +
        "</tr>",
    );
  });
  $("#totalServis").text(formatRupiah(total));
}

/* ===================================================
   CARI SPAREPART
   GET /api/sparepart/get-all
   Field: IDSPAREPART, NAMA, HARGAJUAL, STOK, KODESPAREPART
=================================================== */
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
      "<tr>" +
        "<td>" +
        (i + 1) +
        "</td>" +
        "<td>" +
        item.NAMA +
        "</td>" +
        "<td>" +
        item.qty +
        "</td>" +
        "<td>" +
        formatRupiah(item.HARGAJUAL) +
        "</td>" +
        "<td>" +
        formatRupiah(subtotal) +
        "</td>" +
        "<td class='text-center'>" +
        '<button class="btn btn-danger btn-qty me-1" onclick="ubahQtySparepart(' +
        item.IDSPAREPART +
        ', -1)">' +
        '<i class="fa-solid fa-minus"></i>' +
        "</button>" +
        '<button class="btn btn-success btn-qty" onclick="ubahQtySparepart(' +
        item.IDSPAREPART +
        ', 1)">' +
        '<i class="fa-solid fa-plus"></i>' +
        "</button>" +
        "</td>" +
        "</tr>",
    );
  });
  $("#totalSparepart").text(formatRupiah(total));
}

/* ===================================================
   TAMBAH TRANSAKSI
   Satu endpoint: POST /api/transaksi/create
   Field wajib: IDUSER_KASIR, JENISTRANSAKSI
=================================================== */
function tambahTransaksi() {
  var jenis = $("#selectJenisTransaksi").val();
  var tanggal = $("#inputTanggal").val();

  if (!jenis)
    return Swal.fire("Peringatan", "Pilih jenis transaksi.", "warning");
  if (!tanggal)
    return Swal.fire("Peringatan", "Pilih tanggal transaksi.", "warning");

  var user = Session.getUser();
  if (!user || !user.IDUSER)
    return Swal.fire(
      "Peringatan",
      "Sesi tidak valid, silakan login ulang.",
      "warning",
    );

  if (jenis === "servis") prosesServis(user.IDUSER);
  if (jenis === "sparepart") prosesPembelian(user.IDUSER);
}

/* ───────────────────────────────────────────────────
   FLOW SERVIS
   POST /api/transaksi/create
   {
     IDUSER_KASIR, IDUSER_MEKANIK,
     JENISTRANSAKSI: 'SERVIS',
     NAMAPELANGGAN, KELUHAN, CATATAN,
     LAYANAN: [{ IDLAYANANSERVIS }]
   }
─────────────────────────────────────────────────── */
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

  var payload = {
    IDUSER_KASIR: IDUSER_KASIR,
    IDUSER_MEKANIK: parseInt(mekanik),
    JENISTRANSAKSI: "SERVIS",
    NAMAPELANGGAN: nama,
    KELUHAN: keluhan,
    CATATAN: keluhan,
    LAYANAN: layananTerpilih.map(function (l) {
      return { IDLAYANANSERVIS: l.IDLAYANANSERVIS };
    }),
  };

  kirimTransaksi(payload, "Transaksi servis berhasil ditambahkan.");
}

/* ───────────────────────────────────────────────────
   FLOW PEMBELIAN SPAREPART
   POST /api/transaksi/create
   {
     IDUSER_KASIR,
     JENISTRANSAKSI: 'PEMBELIAN',
     CATATAN,
     ITEMS: [{ IDSPAREPART, JUMLAH }]
   }
─────────────────────────────────────────────────── */
function prosesPembelian(IDUSER_KASIR) {
  var catatan = $("#inputCatatanSparepart").val().trim();

  if (!sparepartTerpilih.length)
    return Swal.fire("Peringatan", "Pilih minimal satu sparepart.", "warning");

  var payload = {
    IDUSER_KASIR: IDUSER_KASIR,
    JENISTRANSAKSI: "PEMBELIAN",
    CATATAN: catatan || null,
    ITEMS: sparepartTerpilih.map(function (s) {
      return { IDSPAREPART: s.IDSPAREPART, JUMLAH: s.qty };
    }),
  };

  kirimTransaksi(
    payload,
    "Transaksi pembelian sparepart berhasil ditambahkan.",
  );
}

/* ───────────────────────────────────────────────────
   KIRIM KE API
─────────────────────────────────────────────────── */
function kirimTransaksi(payload, successMsg) {
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
      Swal.fire({
        title: "Berhasil!",
        text: successMsg,
        icon: "success",
      }).then(resetForm);
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
   RESET FORM
=================================================== */
function resetForm() {
  $("#selectJenisTransaksi").val("");
  $("#sectionServis, #sectionSparepart").addClass("d-none");
  $("#btnTambahTransaksi").hide();
  $("#inputNamaPelanggan, #inputKeluhanServis, #inputCatatanSparepart").val("");
  $("#selectMekanik").val("");
  layananTerpilih = [];
  sparepartTerpilih = [];
  renderTabelLayanan();
  renderTabelSparepart();
  $("#inputTanggal").val(new Date().toISOString().split("T")[0]);
}

/* ===================================================
   MODAL BANTUAN
=================================================== */
function tampilkanBantuan() {
  var jenis = $("#selectJenisTransaksi").val();
  var html;

  if (jenis === "servis") {
    html =
      "<ol>" +
      "<li>Pilih <strong>Jenis Transaksi</strong> → <em>Servis Kendaraan</em></li>" +
      "<li>Masukkan <strong>Nama Pelanggan</strong></li>" +
      "<li>Pilih <strong>Mekanik</strong> yang ditugaskan</li>" +
      "<li>Ketik nama layanan lalu klik <strong>Cari</strong>, klik layanan dari daftar</li>" +
      "<li>Klik <span class='badge bg-danger'><i class='fa-solid fa-trash-can'></i></span> untuk hapus layanan</li>" +
      "<li>Isi <strong>Catatan Keluhan</strong></li>" +
      "<li>Klik <strong class='text-primary'>Tambahkan Transaksi</strong></li>" +
      "</ol>";
  } else if (jenis === "sparepart") {
    html =
      "<ol>" +
      "<li>Pilih <strong>Jenis Transaksi</strong> → <em>Pembelian Sparepart</em></li>" +
      "<li>Ketik nama sparepart lalu klik <strong>Cari</strong>, klik item dari daftar</li>" +
      "<li>Gunakan <span class='badge bg-danger'>-</span> / <span class='badge bg-success'>+</span> untuk atur jumlah</li>" +
      "<li>Isi <strong>Catatan</strong> bila perlu</li>" +
      "<li>Klik <strong class='text-primary'>Tambahkan Transaksi</strong></li>" +
      "</ol>";
  } else {
    html =
      "<p class='text-muted'>Pilih <strong>Jenis Transaksi</strong> terlebih dahulu.</p>";
  }

  $("#modalBantuanBody").html(html);
  new bootstrap.Modal(document.getElementById("modalBantuan")).show();
}

/* ===================================================
   UTILS
=================================================== */
function formatRupiah(angka) {
  return "Rp" + Number(angka || 0).toLocaleString("id-ID");
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
