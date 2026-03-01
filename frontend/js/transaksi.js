(function ($) {
  "use strict";

  /*
    ══════════════════════════════════════════════════════════
     SKEMA DB — sipenja.sql
    ══════════════════════════════════════════════════════════
     TRANSAKSI      : IDTRANSAKSI, IDUSER(kasir→NAMA_KASIR), NOTRANSAKSI,
                      TANGGAL(datetime), JENISTRANSAKSI('SERVIS'|'PEMBELIAN'),
                      TOTAL(decimal), CATATAN(text)

     SERVIS         : IDSERVIS, IDUSER(mekanik→NAMA_MEKANIK), IDTRANSAKSI,
                      KODEANTRIAN, TANGGALMASUK, TANGGALSELESAI,
                      STATUS('Belum'|'Dalam Proses'|'Selesai'),
                      KELUHAN, NAMAPELANGGAN

     DETAILTRANSAKSISERVIS : IDSERVIS, IDLAYANANSERVIS, IDDETAILTRANSAKSISERVIS,
                             BIAYA, KETERANGAN
     LAYANANSERVIS  : IDLAYANANSERVIS, KODELAYANAN, NAMA, BIAYAPOKOK, DESKRIPSI

     SERVISSPAREPART: IDSERVIS, IDSPAREPART, IDSERVISSPAREPART,
                      QTY, HARGASATUAN, SUBTOTAL
     SPAREPART      : IDSPAREPART, IDKATEGORI, IDSUPPLIER,
                      KODESPAREPART, NAMA, HARGAJUAL, STOK, STOKMINIMUM

     PROGRESSSERVIS : IDPROGRESSERVIS, IDSERVIS, WAKTU(datetime),
                      STATUS('Belum'|'Dalam Proses'|'Selesai'), KETERANGAN

     TRANSAKSIPEMBELIANSPAREPART : IDTRANSAKSI, IDSPAREPART, IDBELISPAREPART,
                                   JUMLAH, HARGA_SATUAN, SUB_TOTAL

     USER           : IDUSER, NAMA, ROLE('admin'|'kasir'|'mekanik'), STATUS
    ══════════════════════════════════════════════════════════

     ENDPOINT YANG DIGUNAKAN:
       GET    /api/transaksi/get-all                       → daftar semua transaksi (TRANSAKSI + NAMA_KASIR)
       GET    /api/transaksi/get/:IDTRANSAKSI              → detail + sub-data sesuai jenis
       PUT    /api/pembelian-sparepart/update/:IDTRANSAKSI → update TRANSAKSI.CATATAN (jenis PEMBELIAN)
       PUT    /api/servis/update/:IDSERVIS                 → update CATATAN servis (jenis SERVIS, update via IDSERVIS)
         ↑ catatan: transaksiController.updateServis menerima CATATAN dan update ke tabel TRANSAKSI
       DELETE /api/pembelian-sparepart/delete/:IDTRANSAKSI → hapus transaksi PEMBELIAN + kembalikan stok
       DELETE /api/servis/delete/:IDSERVIS                 → hapus transaksi SERVIS + kembalikan stok
         ↑ catatan: delete servis dilakukan via IDSERVIS, bukan IDTRANSAKSI
    ══════════════════════════════════════════════════════════
    */

  const API = "http://localhost:3000/api"; // ← sesuaikan URL backend

  // ─── State ────────────────────────────────────────────
  let allData = [];
  let filteredData = [];
  let currentPage = 1;
  const PER_PAGE = 10;

  // ─── Init ─────────────────────────────────────────────
  $(document).ready(function () {
    spinnerOff();
    setDefaultDate();
    loadTransaksi();
    bindModalClose();
  });

  function spinnerOff() {
    setTimeout(function () {
      if ($("#spinner").length) $("#spinner").removeClass("show");
    }, 1);
  }

  function setDefaultDate() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
    $("#filter-start").val(y + "-" + m + "-01");
    $("#filter-end").val(y + "-" + m + "-" + String(lastDay).padStart(2, "0"));
  }

  // ─── Sidebar & Back-to-top ────────────────────────────
  $(".sidebar-toggler").click(function () {
    $(".sidebar, .content").toggleClass("open");
    return false;
  });

  $(window).scroll(function () {
    $(this).scrollTop() > 300
      ? $(".back-to-top").fadeIn("slow")
      : $(".back-to-top").fadeOut("slow");
  });
  $(".back-to-top").click(function () {
    $("html, body").animate({ scrollTop: 0 }, 1500, "easeInOutExpo");
    return false;
  });

  // ══════════════════════════════════════════════════════
  //  LOAD DATA — GET /api/transaksi/get-all
  //  Response: { success, data: [ { IDTRANSAKSI, IDUSER, NOTRANSAKSI, TANGGAL,
  //               JENISTRANSAKSI, TOTAL, CATATAN, NAMA_KASIR }, … ] }
  // ══════════════════════════════════════════════════════
  function loadTransaksi() {
    showLoading();
    $.ajax({
      url: API + "/transaksi/get-all",
      method: "GET",
      success: function (res) {
        if (res.success) {
          allData = res.data || [];
          filteredData = allData.slice();
          renderStats();
          renderTable();
        } else {
          showTableError("Gagal memuat data transaksi.");
        }
      },
      error: function () {
        showTableError("Tidak dapat terhubung ke server.");
      },
    });
  }

  // ══════════════════════════════════════════════════════
  //  STATS — dihitung dari TRANSAKSI.JENISTRANSAKSI & TRANSAKSI.TOTAL
  // ══════════════════════════════════════════════════════
  function renderStats() {
    var total = allData.length;
    var servis = allData.filter(function (d) {
      return d.JENISTRANSAKSI === "SERVIS";
    }).length;
    var pembelian = allData.filter(function (d) {
      return d.JENISTRANSAKSI === "PEMBELIAN";
    }).length;
    var pendapatan = allData.reduce(function (s, d) {
      return s + (Number(d.TOTAL) || 0);
    }, 0);

    $("#stat-total").text(total);
    $("#stat-servis").text(servis);
    $("#stat-pembelian").text(pembelian);
    $("#stat-pendapatan").text(rupiah(pendapatan));
  }

  // ══════════════════════════════════════════════════════
  //  FILTER — client-side filter dari allData
  //  Filter berdasarkan: JENISTRANSAKSI, TANGGAL, NOTRANSAKSI, NAMA_KASIR, CATATAN
  // ══════════════════════════════════════════════════════
  window.applyFilter = function () {
    var jenis = $("#filter-jenis").val(); // 'SERVIS' | 'PEMBELIAN' | ''
    var start = $("#filter-start").val(); // YYYY-MM-DD
    var end = $("#filter-end").val();
    var search = $("#filter-search").val().toLowerCase().trim();

    filteredData = allData.filter(function (d) {
      // Filter TRANSAKSI.JENISTRANSAKSI
      if (jenis && d.JENISTRANSAKSI !== jenis) return false;
      // Filter TRANSAKSI.TANGGAL
      var tgl = d.TANGGAL ? d.TANGGAL.slice(0, 10) : "";
      if (start && tgl && tgl < start) return false;
      if (end && tgl && tgl > end) return false;
      // Filter text: NOTRANSAKSI, NAMA_KASIR, CATATAN
      if (search) {
        var hay = [d.NOTRANSAKSI || "", d.NAMA_KASIR || "", d.CATATAN || ""]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(search)) return false;
      }
      return true;
    });

    currentPage = 1;
    renderTable();
  };

  window.resetFilter = function () {
    $("#filter-jenis").val("");
    $("#filter-search").val("");
    setDefaultDate();
    filteredData = allData.slice();
    currentPage = 1;
    renderTable();
  };

  // ══════════════════════════════════════════════════════
  //  RENDER TABLE
  // ══════════════════════════════════════════════════════
  function renderTable() {
    var start = (currentPage - 1) * PER_PAGE;
    var slice = filteredData.slice(start, start + PER_PAGE);

    $("#table-count").text("Menampilkan " + filteredData.length + " transaksi");

    if (!filteredData.length) {
      $("#table-body").html(
        '<tr class="empty-row"><td colspan="8">' +
          '<div class="empty-state">' +
          '<i class="fa-solid fa-receipt"></i>' +
          "<p>Tidak ada data transaksi</p>" +
          "</div></td></tr>",
      );
      renderPagination();
      return;
    }

    var html = "";
    $.each(slice, function (i, d) {
      var no = start + i + 1;

      // Badge JENISTRANSAKSI — 'SERVIS' | 'PEMBELIAN'
      var badge =
        d.JENISTRANSAKSI === "SERVIS"
          ? '<span class="jenis-badge servis"><i class="fa-solid fa-wrench"></i> Servis</span>'
          : '<span class="jenis-badge pembelian"><i class="fa-solid fa-bag-shopping"></i> Pembelian</span>';

      // TRANSAKSI.TOTAL
      var totalHtml = '<span class="total-val">' + rupiah(d.TOTAL) + "</span>";

      // TRANSAKSI.TANGGAL (datetime)
      var tglHtml =
        '<span class="tanggal-val">' + tglFmt(d.TANGGAL) + "</span>";

      // TRANSAKSI.CATATAN (nullable text)
      var catHtml = d.CATATAN
        ? '<span class="catatan-val" title="' +
          xa(d.CATATAN) +
          '">' +
          xh(d.CATATAN) +
          "</span>"
        : '<span style="color:var(--muted);font-size:.79rem">—</span>';

      // USER.NAMA via TRANSAKSI.IDUSER
      var kasirHtml =
        '<span class="kasir-name">' + xh(d.NAMA_KASIR || "—") + "</span>";

      html +=
        "<tr>" +
        '<td style="color:var(--muted);font-size:.8rem">' +
        no +
        "</td>" +
        '<td><span class="no-transaksi">' +
        xh(d.NOTRANSAKSI || "—") +
        "</span></td>" +
        "<td>" +
        badge +
        "</td>" +
        "<td>" +
        kasirHtml +
        "</td>" +
        '<td style="text-align:right">' +
        totalHtml +
        "</td>" +
        "<td>" +
        tglHtml +
        "</td>" +
        "<td>" +
        catHtml +
        "</td>" +
        "<td>" +
        '<div class="action-btns">' +
        '<button class="btn-icon view" title="Lihat Detail"' +
        ' onclick="viewDetail(' +
        d.IDTRANSAKSI +
        ')"><i class="fa-solid fa-eye"></i></button>' +
        '<button class="btn-icon edit" title="Edit Catatan"' +
        ' onclick="openEditModal(' +
        d.IDTRANSAKSI +
        ",'" +
        xa(d.NOTRANSAKSI) +
        "','" +
        xa(d.CATATAN || "") +
        "','" +
        d.JENISTRANSAKSI +
        "','" +
        xa(d.IDSERVIS || "") +
        "')\">" +
        '<i class="fa-solid fa-pen"></i></button>' +
        '<button class="btn-icon del" title="Hapus"' +
        ' onclick="confirmDelete(' +
        d.IDTRANSAKSI +
        ",'" +
        xa(d.NOTRANSAKSI) +
        "','" +
        d.JENISTRANSAKSI +
        "','" +
        xa(d.IDSERVIS || "") +
        "')\">" +
        '<i class="fa-solid fa-trash"></i></button>' +
        "</div>" +
        "</td>" +
        "</tr>";
    });

    $("#table-body").html(html);
    renderPagination();
  }

  // ── Pagination ─────────────────────────────────────────
  function renderPagination() {
    var total = filteredData.length;
    var pages = Math.ceil(total / PER_PAGE);
    var s = (currentPage - 1) * PER_PAGE + 1;
    var e = Math.min(currentPage * PER_PAGE, total);

    $("#page-info").text(
      total > 0
        ? "Menampilkan " + s + "–" + e + " dari " + total + " data"
        : "Tidak ada data",
    );

    if (pages <= 1) {
      $("#page-btns").html("");
      return;
    }

    var btns =
      '<button class="page-btn" ' +
      (currentPage === 1 ? "disabled" : "") +
      ' onclick="goPage(' +
      (currentPage - 1) +
      ')"><i class="fa fa-chevron-left"></i></button>';
    for (var p = 1; p <= pages; p++) {
      if (
        pages > 7 &&
        p > 2 &&
        p < pages - 1 &&
        Math.abs(p - currentPage) > 1
      ) {
        if (p === 3 || p === pages - 2)
          btns += '<button class="page-btn" disabled>…</button>';
        continue;
      }
      btns +=
        '<button class="page-btn ' +
        (p === currentPage ? "active" : "") +
        '" onclick="goPage(' +
        p +
        ')">' +
        p +
        "</button>";
    }
    btns +=
      '<button class="page-btn" ' +
      (currentPage === pages ? "disabled" : "") +
      ' onclick="goPage(' +
      (currentPage + 1) +
      ')"><i class="fa fa-chevron-right"></i></button>';
    $("#page-btns").html(btns);
  }

  window.goPage = function (p) {
    currentPage = p;
    renderTable();
    $("html, body").animate({ scrollTop: 0 }, 200);
  };

  // ══════════════════════════════════════════════════════
  //  VIEW DETAIL — GET /api/transaksi/get/:IDTRANSAKSI
  //
  //  Response shape:
  //  {
  //    success, data: {
  //      IDTRANSAKSI, IDUSER, NOTRANSAKSI, TANGGAL,
  //      JENISTRANSAKSI, TOTAL, CATATAN, NAMA_KASIR,
  //
  //      // jika JENISTRANSAKSI === 'SERVIS':
  //      SERVIS: {
  //        IDSERVIS, IDUSER, IDTRANSAKSI, KODEANTRIAN,
  //        TANGGALMASUK, TANGGALSELESAI,
  //        STATUS ('Belum'|'Dalam Proses'|'Selesai'),
  //        KELUHAN, NAMAPELANGGAN, NAMA_MEKANIK,
  //        LAYANAN:   [{ NAMA_LAYANAN|NAMA, KODELAYANAN, BIAYA, KETERANGAN }],
  //        SPAREPART: [{ NAMA_SPAREPART|NAMA, KODESPAREPART, QTY, HARGASATUAN, SUBTOTAL }],
  //        PROGRESS:  [{ WAKTU, STATUS, KETERANGAN }]
  //      },
  //
  //      // jika JENISTRANSAKSI === 'PEMBELIAN':
  //      ITEMS: [{ NAMA_SPAREPART|NAMA, KODESPAREPART, JUMLAH, HARGA_SATUAN, SUB_TOTAL }]
  //    }
  //  }
  // ══════════════════════════════════════════════════════
  window.viewDetail = function (idTransaksi) {
    $("#detail-body").html(
      '<div style="text-align:center;padding:40px;color:var(--muted)">' +
        '<span class="spinner-sm"></span> Memuat detail…</div>',
    );
    $("#modal-detail").addClass("show");

    $.ajax({
      url: API + "/transaksi/get/" + idTransaksi,
      method: "GET",
      success: function (res) {
        if (res.success) renderDetail(res.data);
        else $("#detail-body").html(errBox("Gagal memuat detail transaksi."));
      },
      error: function () {
        $("#detail-body").html(errBox("Koneksi ke server gagal."));
      },
    });
  };

  function renderDetail(d) {
    var isPembelian = d.JENISTRANSAKSI === "PEMBELIAN";

    // Judul & badge jenis
    $("#detail-title").text(d.NOTRANSAKSI || "Detail Transaksi");
    $("#detail-jenis-badge")
      .attr("class", "jenis-badge " + (isPembelian ? "pembelian" : "servis"))
      .html(
        isPembelian
          ? '<i class="fa-solid fa-bag-shopping"></i> Pembelian Sparepart'
          : '<i class="fa-solid fa-wrench"></i> Servis',
      );

    // ── Informasi Transaksi (tabel TRANSAKSI) ──
    var html =
      '<div class="detail-section">' +
      '<div class="detail-section-title">Informasi Transaksi</div>' +
      '<div class="detail-grid">' +
      di(
        "No. Transaksi",
        '<span class="d-value mono">' + xh(d.NOTRANSAKSI || "—") + "</span>",
      ) +
      di("Tanggal", tglFmt(d.TANGGAL)) + // TRANSAKSI.TANGGAL
      di("Kasir", xh(d.NAMA_KASIR || "—")) + // USER.NAMA via TRANSAKSI.IDUSER
      di("Catatan", xh(d.CATATAN || "—")) + // TRANSAKSI.CATATAN
      "</div></div>";

    // ══════════════════ SERVIS ══════════════════
    if (!isPembelian && d.SERVIS) {
      var s = d.SERVIS;

      // SERVIS.STATUS: 'Belum' | 'Dalam Proses' | 'Selesai'
      var stCls =
        s.STATUS === "Selesai"
          ? "selesai"
          : s.STATUS === "Dalam Proses"
            ? "proses"
            : "belum";

      // ── Data Servis (tabel SERVIS) ──
      html +=
        '<div class="detail-section">' +
        '<div class="detail-section-title">Data Servis</div>' +
        '<div class="detail-grid">' +
        di(
          "Kode Antrian",
          '<span class="d-value mono">' + xh(s.KODEANTRIAN || "—") + "</span>",
        ) + // SERVIS.KODEANTRIAN
        di(
          "Status",
          '<span class="status-badge ' +
            stCls +
            '">' +
            xh(s.STATUS || "—") +
            "</span>",
        ) + // SERVIS.STATUS
        di("Nama Pelanggan", xh(s.NAMAPELANGGAN || "—")) + // SERVIS.NAMAPELANGGAN
        di("Mekanik", xh(s.NAMA_MEKANIK || "—")) + // USER.NAMA (mekanik via SERVIS.IDUSER)
        '<div class="detail-item" style="grid-column:span 2">' +
        '<span class="d-label">Keluhan</span>' +
        '<span class="d-value">' +
        xh(s.KELUHAN || "—") +
        "</span>" + // SERVIS.KELUHAN
        "</div>" +
        di("Tanggal Masuk", tglFmt(s.TANGGALMASUK)) + // SERVIS.TANGGALMASUK
        di(
          "Tanggal Selesai",
          s.TANGGALSELESAI ? tglFmt(s.TANGGALSELESAI) : "—",
        ) + // SERVIS.TANGGALSELESAI
        "</div></div>";

      // ── Layanan (DETAILTRANSAKSISERVIS join LAYANANSERVIS) ──
      // Fields: LAYANANSERVIS.NAMA (→ NAMA_LAYANAN), KODELAYANAN
      //         DETAILTRANSAKSISERVIS.BIAYA, KETERANGAN
      if (s.LAYANAN && s.LAYANAN.length) {
        html +=
          '<div class="detail-section">' +
          '<div class="detail-section-title">Layanan Servis</div>' +
          '<table class="detail-items-table"><thead><tr>' +
          "<th>#</th><th>Layanan</th><th>Kode</th><th>Keterangan</th>" +
          '<th style="text-align:right">Biaya</th>' +
          "</tr></thead><tbody>";
        var layananTotal = 0;
        $.each(s.LAYANAN, function (i, l) {
          layananTotal += Number(l.BIAYA) || 0;
          html +=
            "<tr>" +
            '<td style="color:var(--muted)">' +
            (i + 1) +
            "</td>" +
            '<td style="font-weight:600">' +
            xh(l.NAMA_LAYANAN || l.NAMA || "—") +
            "</td>" + // LAYANANSERVIS.NAMA
            '<td style="font-family:monospace;font-size:.78rem">' +
            xh(l.KODELAYANAN || "—") +
            "</td>" + // LAYANANSERVIS.KODELAYANAN
            '<td style="color:#555">' +
            xh(l.KETERANGAN || "—") +
            "</td>" + // DETAILTRANSAKSISERVIS.KETERANGAN
            '<td style="text-align:right;font-family:monospace">' +
            rupiah(l.BIAYA) +
            "</td>" + // DETAILTRANSAKSISERVIS.BIAYA
            "</tr>";
        });
        html +=
          '<tr style="background:#f7f9fc">' +
          '<td colspan="4" style="text-align:right;font-weight:600;color:#555;font-size:.8rem">Subtotal Layanan</td>' +
          '<td style="text-align:right;font-family:monospace;font-weight:700">' +
          rupiah(layananTotal) +
          "</td>" +
          "</tr>";
        html += "</tbody></table></div>";
      }

      // ── Sparepart (SERVISSPAREPART join SPAREPART) ──
      // Fields: SPAREPART.NAMA (→ NAMA_SPAREPART), KODESPAREPART
      //         SERVISSPAREPART.QTY, HARGASATUAN, SUBTOTAL
      if (s.SPAREPART && s.SPAREPART.length) {
        html +=
          '<div class="detail-section">' +
          '<div class="detail-section-title">Sparepart Digunakan</div>' +
          '<table class="detail-items-table"><thead><tr>' +
          "<th>#</th><th>Sparepart</th><th>Kode</th>" +
          '<th style="text-align:center">Qty</th>' +
          '<th style="text-align:right">Harga Satuan</th>' +
          '<th style="text-align:right">Subtotal</th>' +
          "</tr></thead><tbody>";
        var spTotal = 0;
        $.each(s.SPAREPART, function (i, sp) {
          spTotal += Number(sp.SUBTOTAL) || 0;
          html +=
            "<tr>" +
            '<td style="color:var(--muted)">' +
            (i + 1) +
            "</td>" +
            '<td style="font-weight:600">' +
            xh(sp.NAMA_SPAREPART || sp.NAMA || "—") +
            "</td>" + // SPAREPART.NAMA
            '<td style="font-family:monospace;font-size:.78rem">' +
            xh(sp.KODESPAREPART || "—") +
            "</td>" + // SPAREPART.KODESPAREPART
            '<td style="text-align:center">' +
            (sp.QTY || 0) +
            "</td>" + // SERVISSPAREPART.QTY
            '<td style="text-align:right;font-family:monospace">' +
            rupiah(sp.HARGASATUAN) +
            "</td>" + // SERVISSPAREPART.HARGASATUAN
            '<td style="text-align:right;font-family:monospace">' +
            rupiah(sp.SUBTOTAL) +
            "</td>" + // SERVISSPAREPART.SUBTOTAL
            "</tr>";
        });
        html +=
          '<tr style="background:#f7f9fc">' +
          '<td colspan="5" style="text-align:right;font-weight:600;color:#555;font-size:.8rem">Subtotal Sparepart</td>' +
          '<td style="text-align:right;font-family:monospace;font-weight:700">' +
          rupiah(spTotal) +
          "</td>" +
          "</tr>";
        html += "</tbody></table></div>";
      }

      // ── Progress (PROGRESSSERVIS) ──
      // Fields: PROGRESSSERVIS.WAKTU, STATUS, KETERANGAN
      if (s.PROGRESS && s.PROGRESS.length) {
        html +=
          '<div class="detail-section">' +
          '<div class="detail-section-title">Riwayat Progress</div>' +
          '<div class="timeline">';
        $.each(s.PROGRESS, function (i, pg) {
          var dotCls =
            pg.STATUS === "Selesai"
              ? "selesai"
              : pg.STATUS === "Dalam Proses"
                ? "proses"
                : "belum";
          html +=
            '<div class="timeline-item">' +
            '<div class="timeline-dot ' +
            dotCls +
            '"></div>' +
            '<div class="timeline-time">' +
            tglFmt(pg.WAKTU) +
            "</div>" + // PROGRESSSERVIS.WAKTU
            '<div class="timeline-status">' +
            xh(pg.STATUS || "") +
            "</div>" + // PROGRESSSERVIS.STATUS
            '<div class="timeline-keterangan">' +
            xh(pg.KETERANGAN || "") +
            "</div>" + // PROGRESSSERVIS.KETERANGAN
            "</div>";
        });
        html += "</div></div>";
      }
    }

    // ══════════════════ PEMBELIAN ══════════════════
    // TRANSAKSIPEMBELIANSPAREPART join SPAREPART
    // Fields: SPAREPART.NAMA (→ NAMA_SPAREPART), KODESPAREPART
    //         TRANSAKSIPEMBELIANSPAREPART.JUMLAH, HARGA_SATUAN, SUB_TOTAL
    if (isPembelian && d.ITEMS && d.ITEMS.length) {
      html +=
        '<div class="detail-section">' +
        '<div class="detail-section-title">Items Pembelian Sparepart</div>' +
        '<table class="detail-items-table"><thead><tr>' +
        "<th>#</th><th>Sparepart</th><th>Kode</th>" +
        '<th style="text-align:center">Jumlah</th>' +
        '<th style="text-align:right">Harga Satuan</th>' +
        '<th style="text-align:right">Sub Total</th>' +
        "</tr></thead><tbody>";
      $.each(d.ITEMS, function (i, it) {
        html +=
          "<tr>" +
          '<td style="color:var(--muted)">' +
          (i + 1) +
          "</td>" +
          '<td style="font-weight:600">' +
          xh(it.NAMA_SPAREPART || it.NAMA || "—") +
          "</td>" + // SPAREPART.NAMA
          '<td style="font-family:monospace;font-size:.78rem">' +
          xh(it.KODESPAREPART || "—") +
          "</td>" + // SPAREPART.KODESPAREPART
          '<td style="text-align:center">' +
          (it.JUMLAH || 0) +
          "</td>" + // TRANSAKSIPEMBELIANSPAREPART.JUMLAH
          '<td style="text-align:right;font-family:monospace">' +
          rupiah(it.HARGA_SATUAN) +
          "</td>" + // .HARGA_SATUAN
          '<td style="text-align:right;font-family:monospace">' +
          rupiah(it.SUB_TOTAL) +
          "</td>" + // .SUB_TOTAL
          "</tr>";
      });
      html += "</tbody></table></div>";
    }

    // ── Total (TRANSAKSI.TOTAL) ──
    html +=
      '<div class="detail-total">' +
      '<span class="dt-label"><i class="fa-solid fa-coins me-2"></i>Total Transaksi</span>' +
      '<span class="dt-value">' +
      rupiah(d.TOTAL) +
      "</span>" +
      "</div>";

    $("#detail-body").html(html);
  }

  // helper baris detail-grid
  function di(label, val) {
    return (
      '<div class="detail-item"><span class="d-label">' +
      label +
      "</span>" +
      (String(val).trimStart().startsWith("<")
        ? val
        : '<span class="d-value">' + val + "</span>") +
      "</div>"
    );
  }

  // ══════════════════════════════════════════════════════
  //  EDIT CATATAN
  //
  //  SERVIS:    PUT /api/servis/update/:IDSERVIS  { CATATAN }
  //    → servisController.updateServis menerima CATATAN dan melakukan:
  //      UPDATE TRANSAKSI SET CATATAN = ? WHERE IDTRANSAKSI = ?
  //
  //  PEMBELIAN: PUT /api/pembelian-sparepart/update/:IDTRANSAKSI  { CATATAN }
  //    → transaksiPembelianSparepartController.updateTransaksiPembelianSparepart
  //      UPDATE TRANSAKSI SET CATATAN = ? WHERE IDTRANSAKSI = ?
  // ══════════════════════════════════════════════════════
  window.openEditModal = function (
    idTransaksi,
    noTransaksi,
    catatan,
    jenis,
    idServis,
  ) {
    $("#edit-id").val(idTransaksi); // TRANSAKSI.IDTRANSAKSI
    $("#edit-jenis").val(jenis); // 'SERVIS' | 'PEMBELIAN'
    $("#edit-idservis").val(idServis || ""); // SERVIS.IDSERVIS (khusus jenis SERVIS)
    $("#edit-no").val(noTransaksi); // TRANSAKSI.NOTRANSAKSI (readonly)
    $("#edit-catatan").val(catatan); // TRANSAKSI.CATATAN
    $("#modal-edit").addClass("show");
  };

  window.submitEdit = function () {
    var idTransaksi = $("#edit-id").val();
    var jenis = $("#edit-jenis").val();
    var idServis = $("#edit-idservis").val();
    var catatan = $.trim($("#edit-catatan").val()); // → TRANSAKSI.CATATAN

    Swal.fire({
      title: "Simpan Perubahan?",
      text: "Catatan transaksi akan diperbarui.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#009CFF",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
    }).then(function (result) {
      if (!result.isConfirmed) return;

      // Tentukan URL endpoint berdasarkan jenis transaksi
      // SERVIS:    PUT /api/servis/update/:IDSERVIS  (perlu IDSERVIS)
      // PEMBELIAN: PUT /api/pembelian-sparepart/update/:IDTRANSAKSI
      var url =
        jenis === "SERVIS"
          ? API + "/servis/update/" + idServis
          : API + "/pembelian-sparepart/update/" + idTransaksi;

      $.ajax({
        url: url,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ CATATAN: catatan }),
        success: function (res) {
          if (res.success) {
            closeModal("modal-edit");
            // Update data lokal tanpa reload penuh
            var target = allData.find(function (d) {
              return d.IDTRANSAKSI == idTransaksi;
            });
            if (target) target.CATATAN = catatan;
            filteredData = filteredData.map(function (d) {
              return d.IDTRANSAKSI == idTransaksi
                ? Object.assign({}, d, { CATATAN: catatan })
                : d;
            });
            renderTable();
            Swal.fire({
              title: "Berhasil!",
              text: "Catatan berhasil diperbarui.",
              icon: "success",
              confirmButtonColor: "#009CFF",
              timer: 2000,
              timerProgressBar: true,
            });
          } else {
            errAlert(res.message || "Gagal memperbarui catatan.");
          }
        },
        error: function (xhr) {
          errAlert(
            (xhr.responseJSON && xhr.responseJSON.message) ||
              "Terjadi kesalahan.",
          );
        },
      });
    });
  };

  // ══════════════════════════════════════════════════════
  //  DELETE TRANSAKSI
  //
  //  PEMBELIAN: DELETE /api/pembelian-sparepart/delete/:IDTRANSAKSI
  //    → menghapus TRANSAKSIPEMBELIANSPAREPART, mengembalikan SPAREPART.STOK, hapus TRANSAKSI
  //
  //  SERVIS:    DELETE /api/servis/delete/:IDSERVIS
  //    → mengembalikan SPAREPART.STOK dari SERVISSPAREPART
  //    → hapus PROGRESSSERVIS, SERVISSPAREPART, DETAILTRANSAKSISERVIS, SERVIS, TRANSAKSI
  //    (endpoint menerima IDSERVIS, bukan IDTRANSAKSI)
  // ══════════════════════════════════════════════════════
  window.confirmDelete = function (idTransaksi, noTransaksi, jenis, idServis) {
    Swal.fire({
      title: "Hapus Transaksi?",
      html:
        "Transaksi <strong>" +
        xh(noTransaksi) +
        "</strong> akan dihapus permanen." +
        '<br><small style="color:#ff4757">Stok sparepart akan dikembalikan otomatis.</small>',
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff4757",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    }).then(function (result) {
      if (!result.isConfirmed) return;

      // Tentukan URL berdasarkan jenis
      // SERVIS:    DELETE /api/servis/delete/:IDSERVIS
      // PEMBELIAN: DELETE /api/pembelian-sparepart/delete/:IDTRANSAKSI
      var url =
        jenis === "SERVIS"
          ? API + "/servis/delete/" + idServis
          : API + "/pembelian-sparepart/delete/" + idTransaksi;

      $.ajax({
        url: url,
        method: "DELETE",
        success: function (res) {
          if (res.success) {
            // Hapus dari data lokal
            allData = allData.filter(function (d) {
              return d.IDTRANSAKSI != idTransaksi;
            });
            filteredData = filteredData.filter(function (d) {
              return d.IDTRANSAKSI != idTransaksi;
            });
            renderStats();
            renderTable();
            Swal.fire({
              title: "Terhapus!",
              text: "Transaksi berhasil dihapus.",
              icon: "success",
              confirmButtonColor: "#009CFF",
              timer: 2000,
              timerProgressBar: true,
            });
          } else {
            errAlert(res.message || "Gagal menghapus transaksi.");
          }
        },
        error: function (xhr) {
          errAlert(
            (xhr.responseJSON && xhr.responseJSON.message) ||
              "Terjadi kesalahan saat menghapus.",
          );
        },
      });
    });
  };

  // ══════════════════════════════════════════════════════
  //  LOGOUT
  // ══════════════════════════════════════════════════════
  window.confirmLogout = function () {
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
        localStorage.removeItem("token");
        window.location.href = "login.html";
      }
    });
  };

  // ══════════════════════════════════════════════════════
  //  MODAL HELPERS
  // ══════════════════════════════════════════════════════
  window.closeModal = function (id) {
    $("#" + id).removeClass("show");
  };

  function bindModalClose() {
    $(document).on("click", ".modal-overlay", function (e) {
      if ($(e.target).hasClass("modal-overlay")) $(this).removeClass("show");
    });
    $(document).on("keydown", function (e) {
      if (e.key === "Escape") $(".modal-overlay.show").removeClass("show");
    });
  }

  // ══════════════════════════════════════════════════════
  //  TABLE HELPERS
  // ══════════════════════════════════════════════════════
  function showLoading() {
    $("#table-body").html(
      '<tr class="loading-row"><td colspan="8">' +
        '<span class="spinner-sm"></span> Memuat data…</td></tr>',
    );
    $("#table-count").text("Memuat data…");
  }

  function showTableError(msg) {
    $("#table-body").html(
      '<tr><td colspan="8"><div class="empty-state">' +
        '<i class="fa-solid fa-triangle-exclamation"></i><p>' +
        msg +
        "</p>" +
        "</div></td></tr>",
    );
    $("#table-count").text("Error");
  }

  // ══════════════════════════════════════════════════════
  //  UTILITIES
  // ══════════════════════════════════════════════════════

  // Format TRANSAKSI.TOTAL decimal(10,0) → "Rp 265.000"
  function rupiah(val) {
    return "Rp " + (Number(val) || 0).toLocaleString("id-ID");
  }

  // Format datetime (TANGGAL, TANGGALMASUK, TANGGALSELESAI, WAKTU) → "21 Feb 2026 22:54"
  function tglFmt(str) {
    if (!str) return "—";
    var d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return (
      d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
      " " +
      d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    );
  }

  // Escape HTML untuk innerHTML
  function xh(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Escape untuk onclick string attribute
  function xa(s) {
    return String(s || "")
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'");
  }

  function errAlert(msg) {
    Swal.fire({
      title: "Perhatian",
      text: msg,
      icon: "error",
      confirmButtonColor: "#009CFF",
    });
  }

  function errBox(msg) {
    return (
      '<div class="empty-state">' +
      '<i class="fa-solid fa-triangle-exclamation"></i><p>' +
      msg +
      "</p></div>"
    );
  }
})(jQuery);
