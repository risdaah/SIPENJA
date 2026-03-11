(function ($) {
  "use strict";

  const API = "http://localhost:3000/api";

  function getAuthHeaders() {
    return {
      "Content-Type": "application/json",
      Authorization: "Bearer " + Session.getToken(),
    };
  }

  // ─── State ────────────────────────────────────────────
  var allData = [];
  var filteredData = [];
  var currentPage = 1;
  var PER_PAGE = 10;

  // State edit modal
  var editState = {
    idTransaksi: null,
    idServis: null,
    jenis: null,
    pendingLayanan: [], // { IDLAYANANSERVIS, NAMA_LAYANAN } — belum disimpan
    pendingSparepart: [], // { IDSPAREPART, NAMA_SPAREPART, QTY } — belum disimpan
  };

  // Master data untuk dropdown
  var masterLayanan = [];
  var masterSparepart = [];

  // ─── Init ─────────────────────────────────────────────
  $(document).ready(function () {
    if (!Session.guard(["admin"])) return;
    Session.setupAjax();
    var _u = Session.getUser();
    if (_u) {
      $("#navbar-nama").text(_u.NAMA);
      $("#navbar-role").text(_u.ROLE);
    }

    spinnerOff();
    populateTahun();
    setDefaultBulanTahun();
    loadTransaksi();
    loadMasterData();
    bindModalClose();

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
      $("html, body").animate({ scrollTop: 0 }, 800);
      return false;
    });
  });

  function spinnerOff() {
    setTimeout(function () {
      if ($("#spinner").length) $("#spinner").removeClass("show");
    }, 1);
  }

  // ── Load master layanan & sparepart untuk dropdown ──
  function loadMasterData() {
    $.ajax({
      url: API + "/layanan-servis/get-all",
      method: "GET",
      success: function (res) {
        if (res.success) {
          masterLayanan = res.data || [];
          renderLayananDropdown();
        }
      },
    });
    $.ajax({
      url: API + "/sparepart/get-all",
      method: "GET",
      success: function (res) {
        if (res.success) {
          masterSparepart = res.data || [];
          renderSparepartDropdown();
        }
      },
    });
  }

  function renderLayananDropdown() {
    var html = '<option value="">— Pilih layanan —</option>';
    $.each(masterLayanan, function (i, l) {
      html +=
        '<option value="' +
        l.IDLAYANANSERVIS +
        '" data-nama="' +
        xa(l.NAMA) +
        '">' +
        xh(l.NAMA) +
        " — " +
        rupiah(l.BIAYAPOKOK) +
        "</option>";
    });
    $("#add-layanan-select").html(html);
  }

  function renderSparepartDropdown() {
    var html = '<option value="">— Pilih sparepart —</option>';
    $.each(masterSparepart, function (i, s) {
      html +=
        '<option value="' +
        s.IDSPAREPART +
        '" data-nama="' +
        xa(s.NAMA) +
        '" data-harga="' +
        s.HARGAJUAL +
        '" data-stok="' +
        s.STOK +
        '">' +
        xh(s.NAMA) +
        " (Stok: " +
        s.STOK +
        ") — " +
        rupiah(s.HARGAJUAL) +
        "</option>";
    });
    $("#add-sparepart-select").html(html);
  }

  // ── Isi dropdown tahun ──
  function populateTahun() {
    var now = new Date().getFullYear();
    var html = '<option value="">Semua</option>';
    for (var y = now; y >= now - 4; y--) {
      html += '<option value="' + y + '">' + y + "</option>";
    }
    $("#filter-tahun").html(html);
  }

  function setDefaultBulanTahun() {
    var now = new Date();
    $("#filter-bulan").val(now.getMonth() + 1);
    $("#filter-tahun").val(now.getFullYear());
  }

  // ══════════════════════════════════════════════════════
  //  LOAD DATA
  // ══════════════════════════════════════════════════════
  function loadTransaksi() {
    showLoading();
    $.ajax({
      url: API + "/transaksi/get-all",
      method: "GET",
      success: function (res) {
        if (res.success) {
          allData = res.data || [];
          applyFilter();
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
  //  FILTER
  // ══════════════════════════════════════════════════════
  window.applyFilter = function () {
    var jenis = $("#filter-jenis").val();
    var bulan = $("#filter-bulan").val();
    var tahun = $("#filter-tahun").val();
    var start = $("#filter-start").val();
    var end = $("#filter-end").val();
    var search = $("#filter-search").val().toLowerCase().trim();
    var useRange = start || end;

    filteredData = allData.filter(function (d) {
      if (jenis && d.JENISTRANSAKSI !== jenis) return false;
      var tgl = d.TANGGAL ? d.TANGGAL.slice(0, 10) : "";
      if (useRange) {
        if (start && tgl && tgl < start) return false;
        if (end && tgl && tgl > end) return false;
      } else {
        if (bulan || tahun) {
          var dt = tgl ? new Date(tgl) : null;
          if (!dt) return false;
          if (bulan && dt.getMonth() + 1 !== parseInt(bulan)) return false;
          if (tahun && dt.getFullYear() !== parseInt(tahun)) return false;
        }
      }
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
    $("#filter-start").val("");
    $("#filter-end").val("");
    $("#filter-search").val("");
    setDefaultBulanTahun();
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
      var badge =
        d.JENISTRANSAKSI === "SERVIS"
          ? '<span class="jenis-badge servis"><i class="fa-solid fa-wrench"></i> Servis</span>'
          : '<span class="jenis-badge pembelian"><i class="fa-solid fa-bag-shopping"></i> Pembelian</span>';
      var catHtml = d.CATATAN
        ? '<span class="catatan-val" title="' +
          xa(d.CATATAN) +
          '">' +
          xh(d.CATATAN) +
          "</span>"
        : '<span style="color:var(--muted);font-size:.79rem">—</span>';

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
        '<td><span class="kasir-name">' +
        xh(d.NAMA_KASIR || "—") +
        "</span></td>" +
        '<td style="text-align:right"><span class="total-val">' +
        rupiah(d.TOTAL) +
        "</span></td>" +
        '<td><span class="tanggal-val">' +
        tglFmt(d.TANGGAL) +
        "</span></td>" +
        "<td>" +
        catHtml +
        "</td>" +
        "<td>" +
        '<div class="action-btns">' +
        '<button class="btn-icon view" title="Lihat Detail" onclick="viewDetail(' +
        d.IDTRANSAKSI +
        ')">' +
        '<i class="fa-solid fa-eye"></i></button>' +
        '<button class="btn-icon edit" title="Edit Transaksi" onclick="openEditModal(' +
        d.IDTRANSAKSI +
        ')">' +
        '<i class="fa-solid fa-pen"></i></button>' +
        '<button class="btn-icon del" title="Hapus" onclick="confirmDelete(' +
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
  //  VIEW DETAIL
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

    $("#detail-title").text(d.NOTRANSAKSI || "Detail Transaksi");
    $("#detail-jenis-badge")
      .attr("class", "jenis-badge " + (isPembelian ? "pembelian" : "servis"))
      .html(
        isPembelian
          ? '<i class="fa-solid fa-bag-shopping"></i> Pembelian Sparepart'
          : '<i class="fa-solid fa-wrench"></i> Servis',
      );

    var html =
      '<div class="detail-section">' +
      '<div class="detail-section-title">Informasi Transaksi</div>' +
      '<div class="detail-grid">' +
      di(
        "No. Transaksi",
        '<span class="d-value mono">' + xh(d.NOTRANSAKSI || "—") + "</span>",
      ) +
      di("Tanggal", tglFmt(d.TANGGAL)) +
      di("Kasir", xh(d.NAMA_KASIR || "—")) +
      di("Catatan", xh(d.CATATAN || "—")) +
      "</div></div>";

    if (!isPembelian && d.SERVIS) {
      var s = d.SERVIS;
      var stCls =
        s.STATUS === "Selesai"
          ? "selesai"
          : s.STATUS === "Dalam Proses"
            ? "proses"
            : "belum";

      html +=
        '<div class="detail-section">' +
        '<div class="detail-section-title">Data Servis</div>' +
        '<div class="detail-grid">' +
        di(
          "Kode Antrian",
          '<span class="d-value mono">' + xh(s.KODEANTRIAN || "—") + "</span>",
        ) +
        di(
          "Status",
          '<span class="status-badge ' +
            stCls +
            '">' +
            xh(s.STATUS || "—") +
            "</span>",
        ) +
        di("Nama Pelanggan", xh(s.NAMAPELANGGAN || "—")) +
        di("Mekanik", xh(s.NAMA_MEKANIK || "—")) +
        '<div class="detail-item" style="grid-column:span 2">' +
        '<span class="d-label">Keluhan</span>' +
        '<span class="d-value">' +
        xh(s.KELUHAN || "—") +
        "</span></div>" +
        di("Tanggal Masuk", tglFmt(s.TANGGALMASUK)) +
        di(
          "Tanggal Selesai",
          s.TANGGALSELESAI ? tglFmt(s.TANGGALSELESAI) : "—",
        ) +
        "</div></div>";

      if (s.LAYANAN && s.LAYANAN.length) {
        var layananTotal = 0;
        html +=
          '<div class="detail-section">' +
          '<div class="detail-section-title">Layanan Servis</div>' +
          '<table class="detail-items-table"><thead><tr>' +
          "<th>#</th><th>Layanan</th><th>Kode</th><th>Keterangan</th>" +
          '<th style="text-align:right">Biaya</th>' +
          "</tr></thead><tbody>";
        $.each(s.LAYANAN, function (i, l) {
          layananTotal += Number(l.BIAYA) || 0;
          html +=
            "<tr>" +
            '<td style="color:var(--muted)">' +
            (i + 1) +
            "</td>" +
            '<td style="font-weight:600">' +
            xh(l.NAMA_LAYANAN || l.NAMA || "—") +
            "</td>" +
            '<td style="font-family:monospace;font-size:.78rem">' +
            xh(l.KODELAYANAN || "—") +
            "</td>" +
            '<td style="color:#555">' +
            xh(l.KETERANGAN || "—") +
            "</td>" +
            '<td style="text-align:right;font-family:monospace">' +
            rupiah(l.BIAYA) +
            "</td>" +
            "</tr>";
        });
        html +=
          '<tr style="background:#f7f9fc">' +
          '<td colspan="4" style="text-align:right;font-weight:600;color:#555;font-size:.8rem">Subtotal Layanan</td>' +
          '<td style="text-align:right;font-family:monospace;font-weight:700">' +
          rupiah(layananTotal) +
          "</td>" +
          "</tr></tbody></table></div>";
      }

      if (s.SPAREPART && s.SPAREPART.length) {
        var spTotal = 0;
        html +=
          '<div class="detail-section">' +
          '<div class="detail-section-title">Sparepart Digunakan</div>' +
          '<table class="detail-items-table"><thead><tr>' +
          "<th>#</th><th>Sparepart</th><th>Kode</th>" +
          '<th style="text-align:center">Qty</th>' +
          '<th style="text-align:right">Harga Satuan</th>' +
          '<th style="text-align:right">Subtotal</th>' +
          "</tr></thead><tbody>";
        $.each(s.SPAREPART, function (i, sp) {
          spTotal += Number(sp.SUBTOTAL) || 0;
          html +=
            "<tr>" +
            '<td style="color:var(--muted)">' +
            (i + 1) +
            "</td>" +
            '<td style="font-weight:600">' +
            xh(sp.NAMA_SPAREPART || sp.NAMA || "—") +
            "</td>" +
            '<td style="font-family:monospace;font-size:.78rem">' +
            xh(sp.KODESPAREPART || "—") +
            "</td>" +
            '<td style="text-align:center">' +
            (sp.QTY || 0) +
            "</td>" +
            '<td style="text-align:right;font-family:monospace">' +
            rupiah(sp.HARGASATUAN) +
            "</td>" +
            '<td style="text-align:right;font-family:monospace">' +
            rupiah(sp.SUBTOTAL) +
            "</td>" +
            "</tr>";
        });
        html +=
          '<tr style="background:#f7f9fc">' +
          '<td colspan="5" style="text-align:right;font-weight:600;color:#555;font-size:.8rem">Subtotal Sparepart</td>' +
          '<td style="text-align:right;font-family:monospace;font-weight:700">' +
          rupiah(spTotal) +
          "</td>" +
          "</tr></tbody></table></div>";
      }

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
            "</div>" +
            '<div class="timeline-status">' +
            xh(pg.STATUS || "") +
            "</div>" +
            '<div class="timeline-keterangan">' +
            xh(pg.KETERANGAN || "") +
            "</div>" +
            "</div>";
        });
        html += "</div></div>";
      }
    }

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
          "</td>" +
          '<td style="font-family:monospace;font-size:.78rem">' +
          xh(it.KODESPAREPART || "—") +
          "</td>" +
          '<td style="text-align:center">' +
          (it.JUMLAH || 0) +
          "</td>" +
          '<td style="text-align:right;font-family:monospace">' +
          rupiah(it.HARGA_SATUAN) +
          "</td>" +
          '<td style="text-align:right;font-family:monospace">' +
          rupiah(it.SUB_TOTAL) +
          "</td>" +
          "</tr>";
      });
      html += "</tbody></table></div>";
    }

    html +=
      '<div class="detail-total">' +
      '<span class="dt-label"><i class="fa-solid fa-coins me-2"></i>Total Transaksi</span>' +
      '<span class="dt-value">' +
      rupiah(d.TOTAL) +
      "</span>" +
      "</div>";

    $("#detail-body").html(html);
  }

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
  //  EDIT DETAIL TRANSAKSI — OPEN MODAL
  // ══════════════════════════════════════════════════════
  window.openEditModal = function (idTransaksi) {
    // Reset state
    editState = {
      idTransaksi: idTransaksi,
      idServis: null,
      jenis: null,
      pendingLayanan: [],
      pendingSparepart: [],
    };
    $("#edit-layanan-body").html(
      '<tr><td colspan="4" style="text-align:center;padding:16px"><span class="spinner-sm"></span></td></tr>',
    );
    $("#edit-sparepart-body").html(
      '<tr><td colspan="6" style="text-align:center;padding:16px"><span class="spinner-sm"></span></td></tr>',
    );
    $("#edit-items-body").html(
      '<tr><td colspan="6" style="text-align:center;padding:16px"><span class="spinner-sm"></span></td></tr>',
    );
    $("#edit-servis-section").hide();
    $("#edit-pembelian-section").hide();
    $("#edit-total-display").text("Rp 0");
    $("#modal-edit").addClass("show");

    $.ajax({
      url: API + "/transaksi/get/" + idTransaksi,
      method: "GET",
      success: function (res) {
        if (!res.success) {
          errAlert("Gagal memuat data transaksi.");
          return;
        }
        var d = res.data;
        var isPembelian = d.JENISTRANSAKSI === "PEMBELIAN";

        editState.jenis = d.JENISTRANSAKSI;
        editState.idServis = d.SERVIS ? d.SERVIS.IDSERVIS : null;

        $("#edit-id").val(idTransaksi);
        $("#edit-jenis").val(d.JENISTRANSAKSI);
        $("#edit-idservis").val(editState.idServis || "");
        $("#edit-no-display").text(d.NOTRANSAKSI || "—");
        $("#edit-catatan").val(d.CATATAN || "");

        var badgeClass = isPembelian ? "pembelian" : "servis";
        var badgeHtml = isPembelian
          ? '<i class="fa-solid fa-bag-shopping"></i> Pembelian'
          : '<i class="fa-solid fa-wrench"></i> Servis';
        $("#edit-jenis-badge")
          .attr("class", "jenis-badge " + badgeClass)
          .html(badgeHtml);

        if (!isPembelian && d.SERVIS) {
          var servisSelesai = d.SERVIS.STATUS === "Selesai";
          $("#edit-servis-section").show();
          renderEditLayanan(d.SERVIS.LAYANAN || [], servisSelesai);
          renderEditSparepart(d.SERVIS.SPAREPART || [], servisSelesai);
          if (servisSelesai) {
            $("#add-layanan-row, #add-sparepart-row").hide();
            $("#btn-submit-edit").prop("disabled", false); // masih bisa edit catatan
          } else {
            $("#add-layanan-row, #add-sparepart-row").show();
          }
          recalcEditTotal(d.SERVIS.LAYANAN || [], d.SERVIS.SPAREPART || []);
        }

        if (isPembelian) {
          $("#edit-pembelian-section").show();
          renderEditItems(d.ITEMS || []);
          recalcEditTotalPembelian(d.ITEMS || []);
        }
      },
      error: function () {
        errAlert("Koneksi ke server gagal.");
      },
    });
  };

  // ── Render layanan rows dalam edit modal ──
  function renderEditLayanan(rows, disabled) {
    if (!rows.length) {
      $("#edit-layanan-body").html(
        '<tr><td colspan="4" style="text-align:center;color:var(--muted);padding:12px">Belum ada layanan</td></tr>',
      );
      return;
    }
    var html = "";
    $.each(rows, function (i, l) {
      var disAttr = disabled ? "disabled" : "";
      html +=
        "<tr data-id='" +
        l.IDDETAILTRANSAKSISERVIS +
        "'>" +
        "<td>" +
        (i + 1) +
        "</td>" +
        "<td style='font-weight:600'>" +
        xh(l.NAMA_LAYANAN || l.NAMA || "—") +
        "</td>" +
        "<td style='text-align:right'>" +
        "<input type='number' class='inline-input' " +
        disAttr +
        " value='" +
        (l.BIAYA || 0) +
        "' min='0' " +
        "onchange='updateLayananBiaya(" +
        l.IDDETAILTRANSAKSISERVIS +
        ", this.value)'>" +
        "</td>" +
        "<td style='text-align:center'>" +
        (!disabled
          ? "<button class='btn-inline-del' onclick='deleteLayananItem(" +
            l.IDDETAILTRANSAKSISERVIS +
            ", this)'><i class='fa-solid fa-trash'></i></button>"
          : "") +
        "</td></tr>";
    });
    // Tambahkan pending rows
    $.each(editState.pendingLayanan, function (i, pl) {
      html +=
        "<tr class='pending-row'>" +
        "<td><span style='color:#009CFF;font-size:.72rem'>baru</span></td>" +
        "<td style='font-weight:600'>" +
        xh(pl.NAMA_LAYANAN) +
        "</td>" +
        "<td style='text-align:right;color:var(--muted)'>—</td>" +
        "<td style='text-align:center'><button class='btn-inline-del' onclick='removePendingLayanan(" +
        i +
        ", this)'><i class='fa-solid fa-xmark'></i></button></td></tr>";
    });
    $("#edit-layanan-body").html(html);
  }

  // ── Render sparepart rows dalam edit modal ──
  function renderEditSparepart(rows, disabled) {
    if (!rows.length && !editState.pendingSparepart.length) {
      $("#edit-sparepart-body").html(
        '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:12px">Belum ada sparepart</td></tr>',
      );
      return;
    }
    var html = "";
    $.each(rows, function (i, sp) {
      var disAttr = disabled ? "disabled" : "";
      html +=
        "<tr data-id='" +
        sp.IDSERVISSPAREPART +
        "'>" +
        "<td>" +
        (i + 1) +
        "</td>" +
        "<td style='font-weight:600'>" +
        xh(sp.NAMA_SPAREPART || sp.NAMA || "—") +
        "</td>" +
        "<td style='text-align:center'>" +
        "<input type='number' class='inline-input qty-inline' " +
        disAttr +
        " value='" +
        (sp.QTY || 1) +
        "' min='1' " +
        "onchange='updateSparepartQty(" +
        sp.IDSERVISSPAREPART +
        ", this)'>" +
        "</td>" +
        "<td style='text-align:right;font-family:monospace'>" +
        rupiah(sp.HARGASATUAN) +
        "</td>" +
        "<td style='text-align:right;font-family:monospace' id='sp-sub-" +
        sp.IDSERVISSPAREPART +
        "'>" +
        rupiah(sp.SUBTOTAL) +
        "</td>" +
        "<td style='text-align:center'>" +
        (!disabled
          ? "<button class='btn-inline-del' onclick='deleteSparepartItem(" +
            sp.IDSERVISSPAREPART +
            ", this)'><i class='fa-solid fa-trash'></i></button>"
          : "") +
        "</td></tr>";
    });
    $.each(editState.pendingSparepart, function (i, ps) {
      html +=
        "<tr class='pending-row'>" +
        "<td><span style='color:#009CFF;font-size:.72rem'>baru</span></td>" +
        "<td style='font-weight:600'>" +
        xh(ps.NAMA_SPAREPART) +
        "</td>" +
        "<td style='text-align:center'>" +
        ps.QTY +
        "</td>" +
        "<td style='text-align:right;font-family:monospace'>—</td>" +
        "<td style='text-align:right;font-family:monospace'>—</td>" +
        "<td style='text-align:center'><button class='btn-inline-del' onclick='removePendingSparepart(" +
        i +
        ", this)'><i class='fa-solid fa-xmark'></i></button></td></tr>";
    });
    $("#edit-sparepart-body").html(html);
  }

  // ── Render items pembelian dalam edit modal ──
  function renderEditItems(rows) {
    if (!rows.length) {
      $("#edit-items-body").html(
        '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:12px">Tidak ada item</td></tr>',
      );
      return;
    }
    var html = "";
    $.each(rows, function (i, it) {
      html +=
        "<tr data-id='" +
        it.IDBELISPAREPART +
        "'>" +
        "<td>" +
        (i + 1) +
        "</td>" +
        "<td style='font-weight:600'>" +
        xh(it.NAMA_SPAREPART || "—") +
        "</td>" +
        "<td style='text-align:center'>" +
        "<input type='number' class='inline-input qty-inline' value='" +
        it.JUMLAH +
        "' min='1' " +
        "onchange='updateItemJumlah(" +
        it.IDBELISPAREPART +
        ", this)'>" +
        "</td>" +
        "<td style='text-align:right;font-family:monospace'>" +
        rupiah(it.HARGA_SATUAN) +
        "</td>" +
        "<td style='text-align:right;font-family:monospace' id='item-sub-" +
        it.IDBELISPAREPART +
        "'>" +
        rupiah(it.SUB_TOTAL) +
        "</td>" +
        "<td style='text-align:center'>" +
        "<button class='btn-inline-del' onclick='deleteItemPembelian(" +
        it.IDBELISPAREPART +
        ", this)'>" +
        "<i class='fa-solid fa-trash'></i></button></td></tr>";
    });
    $("#edit-items-body").html(html);
  }

  // ── Recalc total display ──
  function recalcEditTotal(layanan, sparepart) {
    var total = 0;
    $.each(layanan, function (i, l) {
      total += Number(l.BIAYA) || 0;
    });
    $.each(sparepart, function (i, sp) {
      total += Number(sp.SUBTOTAL) || 0;
    });
    $("#edit-total-display").text(rupiah(total));
  }

  function recalcEditTotalPembelian(items) {
    var total = 0;
    $.each(items, function (i, it) {
      total += Number(it.SUB_TOTAL) || 0;
    });
    $("#edit-total-display").text(rupiah(total));
  }

  function recalcDisplayTotal() {
    var total = 0;
    $("#edit-layanan-body tr:not(.pending-row)").each(function () {
      var v = $(this).find(".inline-input").val();
      if (v) total += Number(v) || 0;
    });
    $("#edit-sparepart-body tr:not(.pending-row)").each(function () {
      var subTd = $(this).find("td:eq(4)");
      var text = subTd.text().replace(/[^0-9]/g, "");
      total += Number(text) || 0;
    });
    $("#edit-items-body tr").each(function () {
      var subTd = $(this).find("td:eq(4)");
      var text = subTd.text().replace(/[^0-9]/g, "");
      total += Number(text) || 0;
    });
    $("#edit-total-display").text(rupiah(total));
  }

  // ══════════════════════════════════════════════════════
  //  INLINE ACTIONS — SERVIS
  // ══════════════════════════════════════════════════════

  // Update biaya layanan
  window.updateLayananBiaya = function (idDetail, biaya) {
    $.ajax({
      url: API + "/servis/update-layanan/" + idDetail,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ BIAYA: Number(biaya) }),
      success: function (res) {
        if (res.success) {
          recalcDisplayTotal();
          toastOk("Biaya layanan diperbarui.");
          // Refresh allData total
          refreshTotalInList(editState.idTransaksi);
        } else {
          errAlert(res.message || "Gagal update biaya.");
        }
      },
      error: function (xhr) {
        errAlert(
          (xhr.responseJSON && xhr.responseJSON.message) ||
            "Gagal update biaya.",
        );
      },
    });
  };

  // Hapus layanan item
  window.deleteLayananItem = function (idDetail, btn) {
    Swal.fire({
      title: "Hapus layanan ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff4757",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    }).then(function (r) {
      if (!r.isConfirmed) return;
      $.ajax({
        url: API + "/servis/delete-layanan/" + idDetail,
        method: "DELETE",
        success: function (res) {
          if (res.success) {
            $(btn).closest("tr").remove();
            recalcDisplayTotal();
            toastOk("Layanan dihapus.");
            refreshTotalInList(editState.idTransaksi);
          } else {
            errAlert(res.message || "Gagal hapus layanan.");
          }
        },
        error: function (xhr) {
          errAlert(
            (xhr.responseJSON && xhr.responseJSON.message) ||
              "Gagal hapus layanan.",
          );
        },
      });
    });
  };

  // Update qty sparepart servis
  window.updateSparepartQty = function (idSp, input) {
    var qty = parseInt($(input).val());
    if (!qty || qty < 1) {
      $(input).val(1);
      qty = 1;
    }
    $.ajax({
      url: API + "/servis/update-sparepart/" + idSp,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ QTY: qty }),
      success: function (res) {
        if (res.success && res.data) {
          $("#sp-sub-" + idSp).text(rupiah(res.data.SUBTOTAL));
          recalcDisplayTotal();
          toastOk("Qty sparepart diperbarui.");
          refreshTotalInList(editState.idTransaksi);
        } else {
          errAlert(res.message || "Gagal update qty.");
        }
      },
      error: function (xhr) {
        errAlert(
          (xhr.responseJSON && xhr.responseJSON.message) || "Gagal update qty.",
        );
      },
    });
  };

  // Hapus sparepart servis
  window.deleteSparepartItem = function (idSp, btn) {
    Swal.fire({
      title: "Hapus sparepart ini?",
      text: "Stok akan dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff4757",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    }).then(function (r) {
      if (!r.isConfirmed) return;
      $.ajax({
        url: API + "/servis/delete-sparepart/" + idSp,
        method: "DELETE",
        success: function (res) {
          if (res.success) {
            $(btn).closest("tr").remove();
            recalcDisplayTotal();
            toastOk("Sparepart dihapus, stok dikembalikan.");
            refreshTotalInList(editState.idTransaksi);
          } else {
            errAlert(res.message || "Gagal hapus sparepart.");
          }
        },
        error: function (xhr) {
          errAlert(
            (xhr.responseJSON && xhr.responseJSON.message) ||
              "Gagal hapus sparepart.",
          );
        },
      });
    });
  };

  // ── Tambah layanan (pending, kirim saat simpan) ──
  window.addLayanan = function () {
    var sel = $("#add-layanan-select");
    var id = sel.val();
    var nm = sel.find("option:selected").data("nama");
    if (!id) {
      errAlert("Pilih layanan terlebih dahulu.");
      return;
    }

    // Cek duplikat
    var isDup = false;
    $("#edit-layanan-body tr:not(.pending-row)").each(function () {
      if ($(this).data("id") == id) isDup = true;
    });
    if (
      editState.pendingLayanan.find(function (x) {
        return x.IDLAYANANSERVIS == id;
      })
    )
      isDup = true;
    if (isDup) {
      errAlert("Layanan ini sudah ditambahkan.");
      return;
    }

    editState.pendingLayanan.push({ IDLAYANANSERVIS: id, NAMA_LAYANAN: nm });
    var existing = [];
    $("#edit-layanan-body tr:not(.pending-row)").each(function () {
      existing.push({ IDDETAILTRANSAKSISERVIS: $(this).data("id") });
    });
    renderEditLayanan(
      existing.map(function (x) {
        return {
          IDDETAILTRANSAKSISERVIS: x.IDDETAILTRANSAKSISERVIS,
          NAMA_LAYANAN: $(
            "#edit-layanan-body tr[data-id='" +
              x.IDDETAILTRANSAKSISERVIS +
              "'] td:eq(1)",
          ).text(),
          BIAYA: $(
            "#edit-layanan-body tr[data-id='" +
              x.IDDETAILTRANSAKSISERVIS +
              "'] .inline-input",
          ).val(),
        };
      }),
      false,
    );
    sel.val("");
    toastOk(nm + " ditambahkan (belum disimpan).");
  };

  window.removePendingLayanan = function (idx, btn) {
    editState.pendingLayanan.splice(idx, 1);
    $(btn).closest("tr").remove();
  };

  // ── Tambah sparepart (pending) ──
  window.addSparepart = function () {
    var sel = $("#add-sparepart-select");
    var id = sel.val();
    var nm = sel.find("option:selected").data("nama");
    var qty = parseInt($("#add-sparepart-qty").val()) || 1;
    var stok = parseInt(sel.find("option:selected").data("stok")) || 0;

    if (!id) {
      errAlert("Pilih sparepart terlebih dahulu.");
      return;
    }
    if (qty < 1) {
      errAlert("Qty minimal 1.");
      return;
    }
    if (qty > stok) {
      errAlert("Stok tidak cukup! Stok tersedia: " + stok);
      return;
    }

    editState.pendingSparepart.push({
      IDSPAREPART: id,
      NAMA_SPAREPART: nm,
      QTY: qty,
    });
    var rows = [];
    $("#edit-sparepart-body tr:not(.pending-row)").each(function () {
      rows.push({
        IDSERVISSPAREPART: $(this).data("id"),
        NAMA_SPAREPART: $(this).find("td:eq(1)").text(),
        QTY: $(this).find(".qty-inline").val(),
        HARGASATUAN: 0,
        SUBTOTAL: 0,
      });
    });
    renderEditSparepart(rows, false);
    sel.val("");
    $("#add-sparepart-qty").val(1);
    toastOk(nm + " x" + qty + " ditambahkan (belum disimpan).");
  };

  window.removePendingSparepart = function (idx, btn) {
    editState.pendingSparepart.splice(idx, 1);
    $(btn).closest("tr").remove();
  };

  // ══════════════════════════════════════════════════════
  //  INLINE ACTIONS — PEMBELIAN
  // ══════════════════════════════════════════════════════

  window.updateItemJumlah = function (idItem, input) {
    var jml = parseInt($(input).val());
    if (!jml || jml < 1) {
      $(input).val(1);
      jml = 1;
    }
    $.ajax({
      url: API + "/transaksi-pembelian-sparepart/update-item/" + idItem,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ JUMLAH: jml }),
      success: function (res) {
        if (res.success && res.data) {
          $("#item-sub-" + idItem).text(rupiah(res.data.SUB_TOTAL));
          recalcDisplayTotal();
          toastOk("Jumlah item diperbarui.");
          refreshTotalInList(editState.idTransaksi);
        } else {
          errAlert(res.message || "Gagal update jumlah.");
        }
      },
      error: function (xhr) {
        errAlert(
          (xhr.responseJSON && xhr.responseJSON.message) ||
            "Gagal update jumlah.",
        );
      },
    });
  };

  window.deleteItemPembelian = function (idItem, btn) {
    Swal.fire({
      title: "Hapus item ini?",
      text: "Stok akan dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ff4757",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    }).then(function (r) {
      if (!r.isConfirmed) return;
      $.ajax({
        url: API + "/transaksi-pembelian-sparepart/delete-item/" + idItem,
        method: "DELETE",
        success: function (res) {
          if (res.success) {
            $(btn).closest("tr").remove();
            recalcDisplayTotal();
            toastOk("Item dihapus, stok dikembalikan.");
            refreshTotalInList(editState.idTransaksi);
          } else {
            errAlert(res.message || "Gagal hapus item.");
          }
        },
        error: function (xhr) {
          errAlert(
            (xhr.responseJSON && xhr.responseJSON.message) ||
              "Gagal hapus item.",
          );
        },
      });
    });
  };

  // ══════════════════════════════════════════════════════
  //  SUBMIT EDIT — simpan catatan + pending items
  // ══════════════════════════════════════════════════════
  window.submitEdit = function () {
    var idTransaksi = $("#edit-id").val();
    var jenis = $("#edit-jenis").val();
    var idServis = $("#edit-idservis").val();
    var catatan = $.trim($("#edit-catatan").val());

    Swal.fire({
      title: "Simpan Perubahan?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#009CFF",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
    }).then(function (result) {
      if (!result.isConfirmed) return;

      var promises = [];

      // 1. Simpan catatan
      var urlCatatan =
        jenis === "SERVIS"
          ? API + "/servis/update/" + idServis
          : API + "/transaksi-pembelian-sparepart/update/" + idTransaksi;

      promises.push(
        $.ajax({
          url: urlCatatan,
          method: "PUT",
          contentType: "application/json",
          data: JSON.stringify({ CATATAN: catatan || null }),
        }),
      );

      // 2. Kirim pending layanan baru
      if (jenis === "SERVIS" && editState.pendingLayanan.length) {
        var items = editState.pendingLayanan.map(function (x) {
          return { IDLAYANANSERVIS: x.IDLAYANANSERVIS };
        });
        promises.push(
          $.ajax({
            url: API + "/servis/add-layanan/" + idServis,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ ITEMS: items }),
          }),
        );
      }

      // 3. Kirim pending sparepart baru
      if (jenis === "SERVIS" && editState.pendingSparepart.length) {
        var spItems = editState.pendingSparepart.map(function (x) {
          return { IDSPAREPART: x.IDSPAREPART, QTY: x.QTY };
        });
        promises.push(
          $.ajax({
            url: API + "/servis/add-sparepart/" + idServis,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({ ITEMS: spItems }),
          }),
        );
      }

      Promise.all(
        promises.map(function (p) {
          return Promise.resolve(p).catch(function (e) {
            return { error: e };
          });
        }),
      ).then(function (results) {
        var allOk = results.every(function (r) {
          return !r.error && r.success !== false;
        });
        if (allOk) {
          closeModal("modal-edit");
          editState.pendingLayanan = [];
          editState.pendingSparepart = [];
          // Update catatan di list
          allData.forEach(function (d) {
            if (d.IDTRANSAKSI == idTransaksi) d.CATATAN = catatan;
          });
          filteredData.forEach(function (d) {
            if (d.IDTRANSAKSI == idTransaksi) d.CATATAN = catatan;
          });
          renderTable();
          Swal.fire({
            title: "Berhasil!",
            text: "Transaksi berhasil diperbarui.",
            icon: "success",
            confirmButtonColor: "#009CFF",
            timer: 2000,
            timerProgressBar: true,
          });
        } else {
          var errMsg = results
            .map(function (r) {
              return r.error
                ? (r.error.responseJSON && r.error.responseJSON.message) ||
                    "Error"
                : r.success
                  ? ""
                  : r.message || "";
            })
            .filter(Boolean)
            .join("; ");
          errAlert("Sebagian gagal: " + (errMsg || "Terjadi kesalahan."));
        }
      });
    });
  };

  // ── Refresh total di list setelah inline edit ──
  function refreshTotalInList(idTransaksi) {
    $.ajax({
      url: API + "/transaksi/get/" + idTransaksi,
      method: "GET",
      success: function (res) {
        if (!res.success) return;
        var newTotal = res.data.TOTAL;
        allData.forEach(function (d) {
          if (d.IDTRANSAKSI == idTransaksi) d.TOTAL = newTotal;
        });
        filteredData.forEach(function (d) {
          if (d.IDTRANSAKSI == idTransaksi) d.TOTAL = newTotal;
        });
        renderTable();
      },
    });
  }

  // ══════════════════════════════════════════════════════
  //  DELETE TRANSAKSI
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

      var url =
        jenis === "SERVIS"
          ? API + "/servis/delete/" + idServis
          : API + "/transaksi-pembelian-sparepart/delete/" + idTransaksi;

      $.ajax({
        url: url,
        method: "DELETE",
        success: function (res) {
          if (res.success) {
            allData = allData.filter(function (d) {
              return d.IDTRANSAKSI != idTransaksi;
            });
            filteredData = filteredData.filter(function (d) {
              return d.IDTRANSAKSI != idTransaksi;
            });
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
  function rupiah(val) {
    return "Rp " + (Number(val) || 0).toLocaleString("id-ID");
  }

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

  function xh(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

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

  function toastOk(msg) {
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: msg,
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
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

/* ===== LOGOUT ===== */
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
    if (result.isConfirmed) Session.logout();
  });
};
