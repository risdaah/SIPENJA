(function ($) {
  "use strict";

  const API = "http://localhost:3000/api";

  $(document).ready(function () {
    if (!Session.guard(["admin"])) return;
    Session.setupAjax();
    var u = Session.getUser();
    if (u) {
      $("#navbar-nama").text(u.NAMA);
      $("#navbar-role").text(u.ROLE);
    }

    var params = new URLSearchParams(window.location.search);
    var id = params.get("id");

    if (!id) {
      Swal.fire("Error", "ID transaksi tidak ditemukan.", "error").then(
        function () {
          window.location.href = "transaksi.html";
        },
      );
      return;
    }

    loadDetail(id);

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

  function loadDetail(id) {
    $.ajax({
      url: API + "/transaksi/get/" + id,
      method: "GET",
      success: function (res) {
        if (!res.success) {
          Swal.fire("Error", "Transaksi tidak ditemukan.", "error").then(
            function () {
              window.location.href = "transaksi.html";
            },
          );
          return;
        }
        renderDetail(res.data);
        setTimeout(function () {
          $("#spinner").removeClass("show");
        }, 1);
      },
      error: function () {
        Swal.fire("Error", "Gagal terhubung ke server.", "error");
      },
    });
  }

  function renderDetail(d) {
    var isPembelian = d.JENISTRANSAKSI === "PEMBELIAN";

    // Title & badge
    $("#page-title").text(d.NOTRANSAKSI || "Detail Transaksi");
    var badgeClass = isPembelian ? "pembelian" : "servis";
    var badgeHtml = isPembelian
      ? '<i class="fa-solid fa-bag-shopping"></i> Pembelian Sparepart'
      : '<i class="fa-solid fa-wrench"></i> Servis';
    $("#page-jenis-badge")
      .attr("class", "jenis-badge " + badgeClass)
      .html(badgeHtml);

    // Tombol edit
    $("#btn-go-edit").attr("href", "edit-transaksi.html?id=" + d.IDTRANSAKSI);
    $("#action-bar").show();

    // Info Transaksi
    var infoHtml =
      infoItem(
        "No. Transaksi",
        '<span class="info-val mono">' + xh(d.NOTRANSAKSI || "—") + "</span>",
      ) +
      infoItem("Tanggal", tglFmt(d.TANGGAL)) +
      infoItem("Kasir", xh(d.NAMA_KASIR || "—")) +
      infoItem("Catatan", xh(d.CATATAN || "—"));
    $("#info-grid").html(infoHtml);

    // ── SERVIS ──
    if (!isPembelian && d.SERVIS) {
      var s = d.SERVIS;
      var stCls =
        s.STATUS === "Selesai"
          ? "selesai"
          : s.STATUS === "Dalam Proses"
            ? "proses"
            : "belum";

      $("#card-servis").show();
      $("#info-servis").html(
        infoItem(
          "Kode Antrian",
          '<span class="info-val mono">' + xh(s.KODEANTRIAN || "—") + "</span>",
        ) +
          infoItem(
            "Status",
            '<span class="status-badge ' +
              stCls +
              '">' +
              xh(s.STATUS || "—") +
              "</span>",
          ) +
          infoItem("Nama Pelanggan", xh(s.NAMAPELANGGAN || "—")) +
          infoItem("Mekanik", xh(s.NAMA_MEKANIK || "—")) +
          infoItem("Tanggal Masuk", tglFmt(s.TANGGALMASUK)) +
          infoItem(
            "Tanggal Selesai",
            s.TANGGALSELESAI ? tglFmt(s.TANGGALSELESAI) : "—",
          ) +
          '<div class="info-item" style="grid-column:span 2">' +
          '<span class="info-label">Keluhan</span>' +
          '<span class="info-val">' +
          xh(s.KELUHAN || "—") +
          "</span></div>",
      );

      // Layanan
      if (s.LAYANAN && s.LAYANAN.length) {
        $("#card-layanan").show();
        var layTotal = 0;
        var layHtml = "";
        $.each(s.LAYANAN, function (i, l) {
          layTotal += Number(l.BIAYA) || 0;
          layHtml +=
            "<tr>" +
            "<td style='color:#aaa'>" +
            (i + 1) +
            "</td>" +
            "<td style='font-weight:600'>" +
            xh(l.NAMA_LAYANAN || l.NAMA || "—") +
            "</td>" +
            "<td style='font-family:monospace;font-size:.78rem'>" +
            xh(l.KODELAYANAN || "—") +
            "</td>" +
            "<td style='color:#555'>" +
            xh(l.KETERANGAN || "—") +
            "</td>" +
            "<td class='num'>" +
            rupiah(l.BIAYA) +
            "</td>" +
            "</tr>";
        });
        layHtml +=
          "<tr class='subtotal-row'>" +
          "<td colspan='4' style='text-align:right'>Subtotal Layanan</td>" +
          "<td class='num'>" +
          rupiah(layTotal) +
          "</td></tr>";
        $("#tbody-layanan").html(layHtml);
      }

      // Sparepart
      if (s.SPAREPART && s.SPAREPART.length) {
        $("#card-sparepart").show();
        var spTotal = 0;
        var spHtml = "";
        $.each(s.SPAREPART, function (i, sp) {
          spTotal += Number(sp.SUBTOTAL) || 0;
          spHtml +=
            "<tr>" +
            "<td style='color:#aaa'>" +
            (i + 1) +
            "</td>" +
            "<td style='font-weight:600'>" +
            xh(sp.NAMA_SPAREPART || sp.NAMA || "—") +
            "</td>" +
            "<td style='font-family:monospace;font-size:.78rem'>" +
            xh(sp.KODESPAREPART || "—") +
            "</td>" +
            "<td class='center'>" +
            (sp.QTY || 0) +
            "</td>" +
            "<td class='num'>" +
            rupiah(sp.HARGASATUAN) +
            "</td>" +
            "<td class='num'>" +
            rupiah(sp.SUBTOTAL) +
            "</td>" +
            "</tr>";
        });
        spHtml +=
          "<tr class='subtotal-row'>" +
          "<td colspan='5' style='text-align:right'>Subtotal Sparepart</td>" +
          "<td class='num'>" +
          rupiah(spTotal) +
          "</td></tr>";
        $("#tbody-sparepart").html(spHtml);
      }

      // Progress / Riwayat
      if (s.PROGRESS && s.PROGRESS.length) {
        $("#card-progress").show();
        var pgHtml = "";
        $.each(s.PROGRESS, function (i, pg) {
          var dotCls =
            pg.STATUS === "Selesai"
              ? "selesai"
              : pg.STATUS === "Dalam Proses"
                ? "proses"
                : "belum";
          pgHtml +=
            "<div class='timeline-item'>" +
            "<div class='timeline-dot " +
            dotCls +
            "'></div>" +
            "<div class='timeline-time'>" +
            "<div class='tgl'>" +
            tglFmtTanggal(pg.WAKTU) +
            "</div>" +
            "<div class='jam'>" +
            tglFmtJam(pg.WAKTU) +
            "</div>" +
            "</div>" +
            "<div class='timeline-status'>" +
            xh(pg.STATUS || "") +
            "</div>" +
            "<div class='timeline-keterangan'>" +
            xh(pg.KETERANGAN || "") +
            "</div>" +
            "</div>";
        });
        $("#timeline").html(pgHtml);
      }
    }

    // ── PEMBELIAN ──
    if (isPembelian && d.ITEMS && d.ITEMS.length) {
      $("#card-items").show();
      var itemHtml = "";
      $.each(d.ITEMS, function (i, it) {
        itemHtml +=
          "<tr>" +
          "<td style='color:#aaa'>" +
          (i + 1) +
          "</td>" +
          "<td style='font-weight:600'>" +
          xh(it.NAMA_SPAREPART || it.NAMA || "—") +
          "</td>" +
          "<td style='font-family:monospace;font-size:.78rem'>" +
          xh(it.KODESPAREPART || "—") +
          "</td>" +
          "<td class='center'>" +
          (it.JUMLAH || 0) +
          "</td>" +
          "<td class='num'>" +
          rupiah(it.HARGA_SATUAN) +
          "</td>" +
          "<td class='num'>" +
          rupiah(it.SUB_TOTAL) +
          "</td>" +
          "</tr>";
      });
      $("#tbody-items").html(itemHtml);
    }

    // Total
    $("#total-display").text(rupiah(d.TOTAL));
    $("#total-bar").show();
  }

  // ─── Utils ────────────────────────────────────────────
  function infoItem(label, val) {
    return (
      '<div class="info-item">' +
      '<span class="info-label">' +
      label +
      "</span>" +
      (String(val).trimStart().startsWith("<")
        ? val
        : '<span class="info-val">' + val + "</span>") +
      "</div>"
    );
  }

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

  function tglFmtTanggal(str) {
    if (!str) return "—";
    var d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function tglFmtJam(str) {
    if (!str) return "";
    var d = new Date(str);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function xh(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})(jQuery);

/* ═══ LOGOUT ═══ */
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
