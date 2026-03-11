var BASE_URL = "http://localhost:3000";

(function ($) {
  "use strict";

  // Spinner
  setTimeout(function () {
    $("#spinner").removeClass("show");
  }, 1);

  // Sidebar Toggler
  $(".sidebar-toggler").click(function () {
    $(".sidebar, .content").toggleClass("open");
    return false;
  });

  // Session Guard
  $(document).ready(function () {
    if (!Session.guard(["admin"])) return;
    Session.setupAjax();
    var u = Session.getUser();
    if (u) {
      $("#navbar-nama").text(u.NAMA);
      $("#navbar-role").text(u.ROLE);
    }

    // Load logo dari backend
    $.get(BASE_URL + "/api/laporan/logo", function (res) {
      LOGO_BASE64 = res.logo;
      $(".logo-bengkel").attr("src", LOGO_BASE64);
    });
  });
})(jQuery);

/* ─── LOGO ───────────────────────────────────────── */
var LOGO_BASE64 = "";

/* ─── NAVIGASI VIEW ─────────────────────────────── */
function showView(name) {
  $("#view-menu, #view-sparepart, #view-servis").hide();
  $("#view-" + name).show();
}

/* ─── UTILS ─────────────────────────────────────── */
function fmtDate(dateStr) {
  if (!dateStr) return "";
  var s = String(dateStr).slice(0, 10);
  var p = s.split("-");
  if (p.length < 3) return dateStr;
  return p[2] + "-" + p[1] + "-" + p[0];
}

function todayFormatted() {
  var d = new Date();
  return (
    String(d.getDate()).padStart(2, "0") +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    d.getFullYear()
  );
}

function rupiah(num) {
  return "Rp" + Number(num).toLocaleString("id-ID");
}

/* ─── LAPORAN SPAREPART ──────────────────────────── */
function loadLaporanSparepart() {
  var awal = $("#sp-tgl-awal").val();
  var akhir = $("#sp-tgl-akhir").val();
  if (!awal || !akhir) {
    Swal.fire("Perhatian", "Isi periode terlebih dahulu.", "warning");
    return;
  }

  $("#sp-period-line").text(
    "Laporan Penjualan Sparepart Periode: " +
      fmtDate(awal) +
      " hingga " +
      fmtDate(akhir),
  );
  $("#sp-print-date").text("Dicetak Pada " + todayFormatted());

  $.ajax({
    url: BASE_URL + "/api/laporan/laporan-sparepart",
    method: "GET",
    data: { tgl_awal: awal, tgl_akhir: akhir },
    success: function (res) {
      renderSparepart(res.data || []);
    },
    error: function () {
      Swal.fire("Error", "Gagal memuat data laporan sparepart.", "error");
    },
  });
}

function renderSparepart(data) {
  var tbody = $("#sp-tbody").empty();
  var total = 0;

  if (!data.length) {
    tbody.append(
      '<tr><td colspan="7" class="center">Tidak ada data pada periode ini</td></tr>',
    );
    $("#sp-total").text("Rp0");
    return;
  }

  data.forEach(function (item, i) {
    var sub = Number(item.HARGASATUAN) * Number(item.QTY);
    total += sub;
    tbody.append(
      "<tr>" +
        '<td class="center">' +
        (i + 1) +
        "</td>" +
        '<td class="center">' +
        fmtDate(item.TANGGAL) +
        "</td>" +
        "<td>" +
        item.NAMA_SPAREPART +
        "</td>" +
        '<td class="center">' +
        (item.NAMA_KATEGORI || "-") +
        "</td>" +
        '<td class="num">' +
        rupiah(item.HARGASATUAN) +
        "</td>" +
        '<td class="center">' +
        item.QTY +
        "</td>" +
        '<td class="num">' +
        rupiah(sub) +
        "</td>" +
        "</tr>",
    );
  });

  $("#sp-total").text(rupiah(total));
}

/* ─── LAPORAN SERVIS ─────────────────────────────── */
function loadLaporanServis() {
  var awal = $("#sv-tgl-awal").val();
  var akhir = $("#sv-tgl-akhir").val();
  if (!awal || !akhir) {
    Swal.fire("Perhatian", "Isi periode terlebih dahulu.", "warning");
    return;
  }

  $("#sv-period-line").text(
    "Laporan Layanan Servis Periode: " +
      fmtDate(awal) +
      " hingga " +
      fmtDate(akhir),
  );
  $("#sv-print-date").text("Dicetak Pada " + todayFormatted());

  $.ajax({
    url: BASE_URL + "/api/laporan/laporan-servis",
    method: "GET",
    data: { tgl_awal: awal, tgl_akhir: akhir },
    success: function (res) {
      renderServis(res.data || []);
    },
    error: function () {
      Swal.fire("Error", "Gagal memuat data laporan servis.", "error");
    },
  });
}

function renderServis(data) {
  var tbody = $("#sv-tbody").empty();
  var total = 0;

  if (!data.length) {
    tbody.append(
      '<tr><td colspan="7" class="center">Tidak ada data pada periode ini</td></tr>',
    );
    $("#sv-total").text("Rp0");
    return;
  }

  data.forEach(function (item, i) {
    var sub = Number(item.BIAYA) * Number(item.JUMLAH);
    total += sub;
    tbody.append(
      "<tr>" +
        '<td class="center">' +
        (i + 1) +
        "</td>" +
        '<td class="center">' +
        fmtDate(item.TANGGAL) +
        "</td>" +
        '<td class="center">' +
        item.KODELAYANAN +
        "</td>" +
        "<td>" +
        item.NAMA_LAYANAN +
        "</td>" +
        '<td class="num">' +
        rupiah(item.BIAYA) +
        "</td>" +
        '<td class="center">' +
        item.JUMLAH +
        "</td>" +
        '<td class="num">' +
        rupiah(sub) +
        "</td>" +
        "</tr>",
    );
  });

  $("#sv-total").text(rupiah(total));
}

/* ─── EXPORT EXCEL ───────────────────────────────── */
function exportExcel(jenis) {
  var rows = [];
  var filename = "";
  var namaLaporan = "";
  var periode = "";

  var now = new Date();
  var tglCetak =
    String(now.getDate()).padStart(2, "0") +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    now.getFullYear();

  if (jenis === "sparepart") {
    var awal = $("#sp-tgl-awal").val();
    var akhir = $("#sp-tgl-akhir").val();
    var periodeStr = awal.replace(/-/g, "") + "-" + akhir.replace(/-/g, "");
    filename = "Laporan_Penjualan_Sparepart_" + periodeStr + ".xlsx";
    namaLaporan = "Laporan Penjualan Sparepart";
    periode = $("#sp-period-line").text();

    rows.push(["Bengkel Any Jaya"]);
    rows.push([
      "Kalitengah, Kec. Tanggulangin, Kabupaten Sidoarjo, Jawa Timur 61272",
    ]);
    rows.push(["Telp: +62 897-9980-073"]);
    rows.push([]);
    rows.push([namaLaporan]);
    rows.push([periode]);
    rows.push([]);
    rows.push([
      "No",
      "Tanggal",
      "Sparepart",
      "Kategori",
      "Harga Satuan (Rp)",
      "Jumlah Terjual",
      "Sub Total (Rp)",
    ]);

    $("#sp-tbody tr").each(function () {
      var cols = [];
      $(this)
        .find("td")
        .each(function () {
          cols.push($(this).text().trim());
        });
      if (cols.length > 1) rows.push(cols);
    });

    rows.push(["", "", "", "", "", "Total", $("#sp-total").text()]);
    rows.push([]);
    rows.push(["Dicetak Pada: " + tglCetak]);
    rows.push([]);
    rows.push(["", "", "", "", "", "Mengetahui, Pemilik"]);
    rows.push(["", "", "", "", "", "Bengkel Any Jaya"]);
    rows.push(["", "", "", "", "", ""]);
    rows.push(["", "", "", "", "", "Pamuji Slamet"]);
  } else {
    var awal = $("#sv-tgl-awal").val();
    var akhir = $("#sv-tgl-akhir").val();
    var periodeStr = awal.replace(/-/g, "") + "-" + akhir.replace(/-/g, "");
    filename = "Laporan_Pelayanan_Servis_" + periodeStr + ".xlsx";
    namaLaporan = "Laporan Pelayanan Servis";
    periode = $("#sv-period-line").text();

    rows.push(["Bengkel Any Jaya"]);
    rows.push([
      "Kalitengah, Kec. Tanggulangin, Kabupaten Sidoarjo, Jawa Timur 61272",
    ]);
    rows.push(["Telp: +62 897-9980-073"]);
    rows.push([]);
    rows.push([namaLaporan]);
    rows.push([periode]);
    rows.push([]);
    rows.push([
      "No",
      "Tanggal",
      "Kode Layanan",
      "Jenis Layanan",
      "Biaya (Rp)",
      "Jumlah",
      "SubTotal (Rp)",
    ]);

    $("#sv-tbody tr").each(function () {
      var cols = [];
      $(this)
        .find("td")
        .each(function () {
          cols.push($(this).text().trim());
        });
      if (cols.length > 1) rows.push(cols);
    });

    rows.push(["", "", "", "", "", "Total", $("#sv-total").text()]);
    rows.push([]);
    rows.push(["Dicetak Pada: " + tglCetak]);
    rows.push([]);
    rows.push(["", "", "", "", "", "Mengetahui, Pemilik"]);
    rows.push(["", "", "", "", "", "Bengkel Any Jaya"]);
    rows.push(["", "", "", "", "", ""]);
    rows.push(["", "", "", "", "", "Pamuji Slamet"]);
  }

  var ws = XLSX.utils.aoa_to_sheet(rows);
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  XLSX.writeFile(wb, filename);
}

/* ─── CETAK PDF ──────────────────────────────────── */
function cetakLaporan(jenis) {
  var elId = jenis === "sparepart" ? "preview-sparepart" : "preview-servis";
  var el = document.getElementById(elId);

  // Pastikan logo sudah ter-load sebagai base64
  if (LOGO_BASE64) {
    $(".logo-bengkel").attr("src", LOGO_BASE64);
  }

  Swal.fire({
    title: "Membuat PDF...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  var origBoxShadow = el.style.boxShadow;
  var origBorderRadius = el.style.borderRadius;
  el.style.boxShadow = "none";
  el.style.borderRadius = "0";

  // Tunggu sebentar agar logo ter-render dulu
  setTimeout(function () {
    html2canvas(el, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      imageTimeout: 0,
      logging: false,
    })
      .then(function (canvas) {
        el.style.boxShadow = origBoxShadow;
        el.style.borderRadius = origBorderRadius;

        var { jsPDF } = window.jspdf;
        var pdf = new jsPDF("p", "mm", "a4");
        var pdfW = pdf.internal.pageSize.getWidth();
        var pageH = pdf.internal.pageSize.getHeight();
        var pdfH = (canvas.height * pdfW) / canvas.width;

        if (pdfH <= pageH) {
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfW, pdfH);
        } else {
          var pageCanvas = document.createElement("canvas");
          var pageCtx = pageCanvas.getContext("2d");
          var ratio = canvas.width / pdfW;
          var pageHeightPx = pageH * ratio;
          pageCanvas.width = canvas.width;
          pageCanvas.height = pageHeightPx;
          var totalPages = Math.ceil(canvas.height / pageHeightPx);

          for (var i = 0; i < totalPages; i++) {
            if (i > 0) pdf.addPage();
            pageCtx.fillStyle = "#ffffff";
            pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            pageCtx.drawImage(canvas, 0, -i * pageHeightPx);
            pdf.addImage(
              pageCanvas.toDataURL("image/png"),
              "PNG",
              0,
              0,
              pdfW,
              pageH,
            );
          }
        }

        var awal =
          jenis === "sparepart"
            ? $("#sp-tgl-awal").val()
            : $("#sv-tgl-awal").val();
        var akhir =
          jenis === "sparepart"
            ? $("#sp-tgl-akhir").val()
            : $("#sv-tgl-akhir").val();
        var periodeStr = awal.replace(/-/g, "") + "-" + akhir.replace(/-/g, "");
        var namaFile =
          jenis === "sparepart"
            ? "Laporan_Penjualan_Sparepart_" + periodeStr + ".pdf"
            : "Laporan_Pelayanan_Servis_" + periodeStr + ".pdf";

        pdf.save(namaFile);
        Swal.close();
      })
      .catch(function (err) {
        el.style.boxShadow = origBoxShadow;
        el.style.borderRadius = origBorderRadius;
        console.error("PDF error:", err);
        Swal.fire("Error", "Gagal membuat PDF: " + err.message, "error");
      });
  }, 300); // delay 300ms agar logo render dulu
}

/* ─── LOGOUT ─────────────────────────────────────── */
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
