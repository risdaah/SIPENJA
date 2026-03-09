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

  // ── Isi dropdown tahun (5 tahun ke belakang + tahun ini) ──
  function populateTahun() {
    var now = new Date().getFullYear();
    var html = '<option value="">Semua</option>';
    for (var y = now; y >= now - 4; y--) {
      html += '<option value="' + y + '">' + y + "</option>";
    }
    $("#filter-tahun").html(html);
  }

  // ── Default: bulan & tahun saat ini, range tanggal kosong ──
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
  //  FILTER — client-side
  //  Priority: jika range tanggal diisi → pakai range
  //            jika bulan/tahun diisi → pakai bulan/tahun
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
      // Filter jenis
      if (jenis && d.JENISTRANSAKSI !== jenis) return false;

      var tgl = d.TANGGAL ? d.TANGGAL.slice(0, 10) : "";

      if (useRange) {
        // Filter range tanggal
        if (start && tgl && tgl < start) return false;
        if (end && tgl && tgl > end) return false;
      } else {
        // Filter bulan & tahun
        if (bulan || tahun) {
          var dt = tgl ? new Date(tgl) : null;
          if (!dt) return false;
          if (bulan && dt.getMonth() + 1 !== parseInt(bulan)) return false;
          if (tahun && dt.getFullYear() !== parseInt(tahun)) return false;
        }
      }

      // Filter teks
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
        '<button class="btn-icon edit" title="Edit Catatan" onclick="openEditModal(' +
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

    // ── Info Transaksi ──
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

    // ══ SERVIS ══
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

      // Layanan
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

      // Sparepart
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

      // Progress timeline
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

    // ══ PEMBELIAN ══
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

    // Total
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
  //  EDIT CATATAN
  //  SERVIS:    PUT /api/servis/update/:IDSERVIS
  //  PEMBELIAN: PUT /api/transaksi-pembelian-sparepart/update/:IDTRANSAKSI
  // ══════════════════════════════════════════════════════
  window.openEditModal = function (
    idTransaksi,
    noTransaksi,
    catatan,
    jenis,
    idServis,
  ) {
    $("#edit-id").val(idTransaksi);
    $("#edit-jenis").val(jenis);
    $("#edit-idservis").val(idServis || "");
    $("#edit-no").val(noTransaksi);
    $("#edit-catatan").val(catatan);
    $("#modal-edit").addClass("show");
  };

  window.submitEdit = function () {
    var idTransaksi = $("#edit-id").val();
    var jenis = $("#edit-jenis").val();
    var idServis = $("#edit-idservis").val();
    var catatan = $.trim($("#edit-catatan").val());

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

      var url =
        jenis === "SERVIS"
          ? API + "/servis/update/" + idServis
          : API + "/transaksi-pembelian-sparepart/update/" + idTransaksi;

      $.ajax({
        url: url,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({ CATATAN: catatan || null }),
        success: function (res) {
          if (res.success) {
            closeModal("modal-edit");
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
  //  SERVIS:    DELETE /api/servis/delete/:IDSERVIS
  //  PEMBELIAN: DELETE /api/transaksi-pembelian-sparepart/delete/:IDTRANSAKSI
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
