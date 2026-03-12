(function ($) {
  "use strict";

  const API = "http://localhost:3000/api";
  var chartInstance = null;

  // ─── Init ──────────────────────────────────────────────
  $(document).ready(function () {
    if (!Session.guard(["admin"])) return;
    Session.setupAjax();

    var u = Session.getUser();
    if (u) {
      $("#navbar-nama, #header-nama").text(u.NAMA);
      $("#navbar-role").text(u.ROLE);
    }

    initYearSelects();
    setDefaultPeriode();
    loadAll();

    // Tutup popup saat klik di luar
    $(document).on("click", function (e) {
      if (!$(e.target).closest(".periode-wrap").length) {
        $(".periode-popup").removeClass("show");
      }
    });

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

    setTimeout(function () {
      $("#spinner").removeClass("show");
    }, 400);
  });

  // ─── Tahun select ──────────────────────────────────────
  function initYearSelects() {
    var year = new Date().getFullYear();
    var opts = '<option value="">Tahun</option>';
    for (var y = year; y >= year - 4; y--) {
      opts +=
        '<option value="' +
        y +
        '"' +
        (y === year ? " selected" : "") +
        ">" +
        y +
        "</option>";
    }
    $("#pend-tahun, #keluar-tahun, #sp-tahun, #lay-tahun, #grafik-tahun").html(
      opts,
    );
  }

  // ─── Default periode = bulan ini ──────────────────────
  function setDefaultPeriode() {
    var now = new Date();
    var m = now.getMonth() + 1;
    var y = now.getFullYear();
    // Set bulan select ke bulan ini
    $("#pend-bulan, #keluar-bulan, #sp-bulan, #lay-bulan, #grafik-bulan").val(
      m,
    );
  }

  // ─── Load semua data ───────────────────────────────────
  function loadAll() {
    loadStats();
    loadPendapatan();
    loadPengeluaran();
    loadTopSparepart();
    loadTopLayanan();
    loadGrafik();
  }

  // ─── Stats ─────────────────────────────────────────────
  function loadStats() {
    $.get(API + "/dashboard/stats", function (res) {
      if (!res.success) return;
      var d = res.data;
      animateCount("stat-sparepart", d.total_sparepart);
      animateCount("stat-layanan", d.total_layanan);
      animateCount("stat-transaksi", d.total_transaksi);
    });
  }

  function animateCount(id, target) {
    var el = $("#" + id);
    el.html("0");
    var start = 0;
    var duration = 800;
    var step = Math.ceil(target / (duration / 16));
    var timer = setInterval(function () {
      start = Math.min(start + step, target);
      el.text(start.toLocaleString("id-ID"));
      if (start >= target) clearInterval(timer);
    }, 16);
  }

  // ─── Pendapatan ────────────────────────────────────────
  function loadPendapatan(params) {
    params = params || buildParams("pend");
    $.get(API + "/dashboard/pendapatan?" + params, function (res) {
      if (!res.success) return;
      $("#keu-pendapatan").text(rupiah(res.data.total));
      $("#keu-pendapatan-periode").text(
        "Periode: " +
          fmtTgl(res.data.tgl_awal) +
          " — " +
          fmtTgl(res.data.tgl_akhir),
      );
    });
  }

  window.applyPendapatan = function () {
    var params = buildParams("pend");
    loadPendapatan(params);
    $("#pp-pendapatan").removeClass("show");
  };

  // ─── Pengeluaran ───────────────────────────────────────
  function loadPengeluaran(params) {
    params = params || buildParams("keluar");
    $.get(API + "/dashboard/pengeluaran?" + params, function (res) {
      if (!res.success) return;
      $("#keu-pengeluaran").text(rupiah(res.data.total));
      $("#keu-pengeluaran-periode").text(
        "Periode: " +
          fmtTgl(res.data.tgl_awal) +
          " — " +
          fmtTgl(res.data.tgl_akhir),
      );
    });
  }

  window.applyPengeluaran = function () {
    var params = buildParams("keluar");
    loadPengeluaran(params);
    $("#pp-pengeluaran").removeClass("show");
  };

  // ─── Top Sparepart ─────────────────────────────────────
  function loadTopSparepart(params) {
    params = params || buildParams("sp");
    $.get(API + "/dashboard/top-sparepart?" + params, function (res) {
      if (!res.success) return;
      var html = "";
      if (!res.data.length) {
        html =
          '<tr><td colspan="4" style="text-align:center;padding:20px;color:#aaa">Tidak ada data</td></tr>';
      } else {
        $.each(res.data, function (i, d) {
          var rankCls =
            i === 0
              ? "rank-1"
              : i === 1
                ? "rank-2"
                : i === 2
                  ? "rank-3"
                  : "rank-num";
          html +=
            "<tr>" +
            "<td class='center " +
            rankCls +
            "'>" +
            (i + 1) +
            "</td>" +
            "<td style='font-family:monospace;font-size:.78rem'>" +
            xh(d.KODESPAREPART || "—") +
            "</td>" +
            "<td style='font-weight:600'>" +
            xh(d.NAMA || "—") +
            "</td>" +
            "<td class='center' style='font-weight:700;color:#009CFF'>" +
            (d.terjual || 0) +
            "</td>" +
            "</tr>";
        });
      }
      $("#tbody-sparepart").html(html);
    });
  }

  window.applyTopSparepart = function () {
    var params = buildParams("sp");
    loadTopSparepart(params);
    $("#pp-sparepart").removeClass("show");
  };

  // ─── Top Layanan ───────────────────────────────────────
  function loadTopLayanan(params) {
    params = params || buildParams("lay");
    $.get(API + "/dashboard/top-layanan?" + params, function (res) {
      if (!res.success) return;
      var html = "";
      if (!res.data.length) {
        html =
          '<tr><td colspan="4" style="text-align:center;padding:20px;color:#aaa">Tidak ada data</td></tr>';
      } else {
        $.each(res.data, function (i, d) {
          var rankCls =
            i === 0
              ? "rank-1"
              : i === 1
                ? "rank-2"
                : i === 2
                  ? "rank-3"
                  : "rank-num";
          html +=
            "<tr>" +
            "<td class='center " +
            rankCls +
            "'>" +
            (i + 1) +
            "</td>" +
            "<td style='font-family:monospace;font-size:.78rem'>" +
            xh(d.KODELAYANAN || "—") +
            "</td>" +
            "<td style='font-weight:600'>" +
            xh(d.NAMA || "—") +
            "</td>" +
            "<td class='center' style='font-weight:700;color:#28a745'>" +
            (d.terselesaikan || 0) +
            "</td>" +
            "</tr>";
        });
      }
      $("#tbody-layanan").html(html);
    });
  }

  window.applyTopLayanan = function () {
    var params = buildParams("lay");
    loadTopLayanan(params);
    $("#pp-layanan").removeClass("show");
  };

  // ─── Grafik ────────────────────────────────────────────
  function loadGrafik(params) {
    params = params || buildParams("grafik");
    $.get(API + "/dashboard/grafik?" + params, function (res) {
      if (!res.success) return;
      renderChart(res.data.pendapatan, res.data.pengeluaran);
    });
  }

  window.applyGrafik = function () {
    var params = buildParams("grafik");
    loadGrafik(params);
    $("#pp-grafik").removeClass("show");
  };

  function renderChart(pendapatan, pengeluaran) {
    // Kumpulkan semua label bulan
    var labelsSet = {};
    pendapatan.forEach(function (r) {
      labelsSet[r.bulan] = true;
    });
    pengeluaran.forEach(function (r) {
      labelsSet[r.bulan] = true;
    });
    var labels = Object.keys(labelsSet).sort();

    // Map ke array
    var pendMap = {};
    pendapatan.forEach(function (r) {
      pendMap[r.bulan] = Number(r.total);
    });
    var keluarMap = {};
    pengeluaran.forEach(function (r) {
      keluarMap[r.bulan] = Number(r.total);
    });

    var pendData = labels.map(function (l) {
      return pendMap[l] || 0;
    });
    var keluarData = labels.map(function (l) {
      return keluarMap[l] || 0;
    });

    // Format label bulan jadi "Mar 2026"
    var labelsFmt = labels.map(function (l) {
      var parts = l.split("-");
      var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
      return d.toLocaleDateString("id-ID", { month: "short", year: "numeric" });
    });

    var ctx = document.getElementById("chart-penjualan").getContext("2d");
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labelsFmt,
        datasets: [
          {
            label: "Pendapatan",
            data: pendData,
            backgroundColor: "rgba(0,156,255,0.75)",
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: "Pengeluaran",
            data: keluarData,
            backgroundColor: "rgba(255,71,87,0.65)",
            borderRadius: 6,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            labels: {
              font: { family: "Heebo", size: 12 },
              boxWidth: 12,
              borderRadius: 4,
            },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                return " " + ctx.dataset.label + ": " + rupiah(ctx.parsed.y);
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#f0f2f5" },
            ticks: {
              font: { family: "Heebo", size: 11 },
              callback: function (v) {
                if (v >= 1000000) return "Rp" + (v / 1000000).toFixed(0) + "jt";
                if (v >= 1000) return "Rp" + (v / 1000).toFixed(0) + "rb";
                return "Rp" + v;
              },
            },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "Heebo", size: 11 } },
          },
        },
      },
    });
  }

  // ─── Toggle Popup ──────────────────────────────────────
  window.togglePeriode = function (id) {
    var target = $("#" + id);
    var isOpen = target.hasClass("show");
    $(".periode-popup").removeClass("show");
    if (!isOpen) target.addClass("show");
  };

  // ─── Build query params ────────────────────────────────
  function buildParams(prefix) {
    var tglAwal = $("#" + prefix + "-tgl-awal").val();
    var tglAkhir = $("#" + prefix + "-tgl-akhir").val();
    var bulan = $("#" + prefix + "-bulan").val();
    var tahun = $("#" + prefix + "-tahun").val();

    var p = new URLSearchParams();
    if (tglAwal && tglAkhir) {
      p.set("tgl_awal", tglAwal);
      p.set("tgl_akhir", tglAkhir);
    } else if (bulan && tahun) {
      p.set("bulan", bulan);
      p.set("tahun", tahun);
    }
    return p.toString();
  }

  // ─── Utils ─────────────────────────────────────────────
  function rupiah(val) {
    return (
      "Rp " +
      (Number(val) || 0).toLocaleString("id-ID", { minimumFractionDigits: 0 })
    );
  }

  function fmtTgl(str) {
    if (!str) return "—";
    var d = new Date(str + "T00:00:00");
    return d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
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
