(function ($) {
  "use strict";

  const API = "http://localhost:3000/api";

  // ─── State ────────────────────────────────────────────
  var state = {
    idTransaksi: null,
    idServis: null,
    jenis: null,
    isSelesai: false,
    pendingLayanan: [], // { IDLAYANANSERVIS, NAMA_LAYANAN }
    pendingSparepart: [], // { IDSPAREPART, NAMA_SPAREPART, QTY }
  };

  var masterLayanan = [];
  var masterSparepart = [];

  // ─── Init ─────────────────────────────────────────────
  $(document).ready(function () {
    if (!Session.guard(["admin"])) return;
    Session.setupAjax();
    var u = Session.getUser();
    if (u) {
      $("#navbar-nama").text(u.NAMA);
      $("#navbar-role").text(u.ROLE);
    }

    // Ambil ID dari URL ?id=123
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

    state.idTransaksi = id;

    // Load data transaksi + master data paralel
    Promise.all([
      loadTransaksi(id),
      loadMasterLayanan(),
      loadMasterSparepart(),
    ]).then(function () {
      spinnerOff();
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
  });

  function spinnerOff() {
    setTimeout(function () {
      $("#spinner").removeClass("show");
    }, 1);
  }

  // ─── Load Transaksi ────────────────────────────────────
  function loadTransaksi(id) {
    return $.ajax({
      url: API + "/transaksi/get/" + id,
      method: "GET",
    })
      .then(function (res) {
        if (!res.success) {
          Swal.fire("Error", "Transaksi tidak ditemukan.", "error").then(
            function () {
              window.location.href = "transaksi.html";
            },
          );
          return;
        }
        renderPage(res.data);
      })
      .catch(function () {
        Swal.fire("Error", "Gagal terhubung ke server.", "error");
      });
  }

  function renderPage(d) {
    var isPembelian = d.JENISTRANSAKSI === "PEMBELIAN";
    state.jenis = d.JENISTRANSAKSI;
    state.idServis = d.SERVIS ? d.SERVIS.IDSERVIS : null;
    state.isSelesai = d.SERVIS && d.SERVIS.STATUS === "Selesai";

    // Badge jenis
    var badgeClass = isPembelian ? "pembelian" : "servis";
    var badgeHtml = isPembelian
      ? '<i class="fa-solid fa-bag-shopping"></i> Pembelian'
      : '<i class="fa-solid fa-wrench"></i> Servis';
    $("#page-jenis-badge")
      .attr("class", "jenis-badge " + badgeClass)
      .html(badgeHtml);

    // Info grid
    var infoHtml =
      infoItem(
        "No. Transaksi",
        '<span class="info-val mono">' + xh(d.NOTRANSAKSI || "—") + "</span>",
      ) +
      infoItem("Tanggal", tglFmt(d.TANGGAL)) +
      infoItem("Kasir", xh(d.NAMA_KASIR || "—"));

    if (!isPembelian && d.SERVIS) {
      var stCls =
        d.SERVIS.STATUS === "Selesai"
          ? "selesai"
          : d.SERVIS.STATUS === "Dalam Proses"
            ? "proses"
            : "belum";
      infoHtml +=
        infoItem("Pelanggan", xh(d.SERVIS.NAMAPELANGGAN || "—")) +
        infoItem(
          "Status",
          '<span class="status-badge ' +
            stCls +
            '">' +
            xh(d.SERVIS.STATUS || "—") +
            "</span>",
        );
    }
    $("#info-grid").html(infoHtml);

    // Catatan
    $("#edit-catatan").val(d.CATATAN || "");

    // Tampilkan section sesuai jenis
    if (!isPembelian && d.SERVIS) {
      $("#card-layanan, #card-sparepart").show();

      if (state.isSelesai) {
        // Servis selesai — tidak bisa edit item, hanya catatan
        var noticeHtml =
          '<div class="selesai-notice" style="margin:14px 22px 0">' +
          '<i class="fa-solid fa-circle-check"></i>' +
          "Servis sudah selesai. Layanan dan sparepart tidak dapat diubah.</div>";
        $(
          "#card-layanan .edit-card-body, #card-sparepart .edit-card-body",
        ).prepend(noticeHtml);
        renderLayanan(d.SERVIS.LAYANAN || [], true);
        renderSparepart(d.SERVIS.SPAREPART || [], true);
      } else {
        $("#row-add-layanan, #row-add-sparepart").show();
        renderLayanan(d.SERVIS.LAYANAN || [], false);
        renderSparepart(d.SERVIS.SPAREPART || [], false);
      }

      recalcTotal();
    }

    if (isPembelian) {
      $("#card-items").show();
      renderItems(d.ITEMS || []);
      recalcTotal();
    }

    $("#total-bar").show();
  }

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

  // ─── Load Master Data ──────────────────────────────────
  function loadMasterLayanan() {
    return $.ajax({
      url: API + "/layanan-servis/get-all",
      method: "GET",
    }).then(function (res) {
      if (res.success) {
        masterLayanan = res.data || [];
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
        $("#sel-layanan").html(html);
      }
    });
  }

  function loadMasterSparepart() {
    return $.ajax({
      url: API + "/sparepart/get-all",
      method: "GET",
    }).then(function (res) {
      if (res.success) {
        masterSparepart = res.data || [];
        var html = '<option value="">— Pilih sparepart —</option>';
        $.each(masterSparepart, function (i, s) {
          html +=
            '<option value="' +
            s.IDSPAREPART +
            '" data-nama="' +
            xa(s.NAMA) +
            '" data-stok="' +
            s.STOK +
            '" data-harga="' +
            s.HARGAJUAL +
            '">' +
            xh(s.NAMA) +
            " (Stok: " +
            s.STOK +
            ") — " +
            rupiah(s.HARGAJUAL) +
            "</option>";
        });
        $("#sel-sparepart").html(html);
      }
    });
  }

  // ─── Render Layanan ────────────────────────────────────
  function renderLayanan(rows, disabled) {
    var html = "";
    if (!rows.length && !state.pendingLayanan.length) {
      html =
        '<tr><td colspan="4" style="text-align:center;padding:20px;color:#aaa">Belum ada layanan</td></tr>';
      $("#tbody-layanan").html(html);
      return;
    }

    $.each(rows, function (i, l) {
      var disAttr = disabled ? "disabled" : "";
      html +=
        "<tr data-id='" +
        l.IDDETAILTRANSAKSISERVIS +
        "'>" +
        "<td style='color:#aaa'>" +
        (i + 1) +
        "</td>" +
        "<td style='font-weight:600'>" +
        xh(l.NAMA_LAYANAN || l.NAMA || "—") +
        "</td>" +
        "<td class='num'><input type='number' class='inline-input' " +
        disAttr +
        " value='" +
        (l.BIAYA || 0) +
        "' min='0'" +
        " onchange='updateLayananBiaya(" +
        l.IDDETAILTRANSAKSISERVIS +
        ", this.value)'></td>" +
        "<td class='center'>" +
        (!disabled
          ? "<button class='btn-inline-del' onclick='hapusLayanan(" +
            l.IDDETAILTRANSAKSISERVIS +
            ", this)'>" +
            "<i class='fa-solid fa-trash'></i></button>"
          : "") +
        "</td></tr>";
    });

    $.each(state.pendingLayanan, function (i, pl) {
      html +=
        "<tr class='pending-row'>" +
        "<td><span class='pending-badge'>baru</span></td>" +
        "<td style='font-weight:600'>" +
        xh(pl.NAMA_LAYANAN) +
        "</td>" +
        "<td class='num' style='color:#aaa'>—</td>" +
        "<td class='center'><button class='btn-inline-del' onclick='removePendingLayanan(" +
        i +
        ", this)'>" +
        "<i class='fa-solid fa-xmark'></i></button></td></tr>";
    });

    $("#tbody-layanan").html(html);
    recalcTotal();
  }

  // ─── Render Sparepart ──────────────────────────────────
  function renderSparepart(rows, disabled) {
    var html = "";
    if (!rows.length && !state.pendingSparepart.length) {
      html =
        '<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa">Belum ada sparepart</td></tr>';
      $("#tbody-sparepart").html(html);
      return;
    }

    $.each(rows, function (i, sp) {
      var disAttr = disabled ? "disabled" : "";
      html +=
        "<tr data-id='" +
        sp.IDSERVISSPAREPART +
        "'>" +
        "<td style='color:#aaa'>" +
        (i + 1) +
        "</td>" +
        "<td style='font-weight:600'>" +
        xh(sp.NAMA_SPAREPART || sp.NAMA || "—") +
        "</td>" +
        "<td class='center'><input type='number' class='inline-input qty-inline' " +
        disAttr +
        " value='" +
        (sp.QTY || 1) +
        "' min='1'" +
        " onchange='updateSparepartQty(" +
        sp.IDSERVISSPAREPART +
        ", this)'></td>" +
        "<td class='num'>" +
        rupiah(sp.HARGASATUAN) +
        "</td>" +
        "<td class='num' id='sp-sub-" +
        sp.IDSERVISSPAREPART +
        "'>" +
        rupiah(sp.SUBTOTAL) +
        "</td>" +
        "<td class='center'>" +
        (!disabled
          ? "<button class='btn-inline-del' onclick='hapusSparepart(" +
            sp.IDSERVISSPAREPART +
            ", this)'>" +
            "<i class='fa-solid fa-trash'></i></button>"
          : "") +
        "</td></tr>";
    });

    $.each(state.pendingSparepart, function (i, ps) {
      html +=
        "<tr class='pending-row'>" +
        "<td><span class='pending-badge'>baru</span></td>" +
        "<td style='font-weight:600'>" +
        xh(ps.NAMA_SPAREPART) +
        "</td>" +
        "<td class='center'>" +
        ps.QTY +
        "</td>" +
        "<td class='num' style='color:#aaa'>—</td>" +
        "<td class='num' style='color:#aaa'>—</td>" +
        "<td class='center'><button class='btn-inline-del' onclick='removePendingSparepart(" +
        i +
        ", this)'>" +
        "<i class='fa-solid fa-xmark'></i></button></td></tr>";
    });

    $("#tbody-sparepart").html(html);
    recalcTotal();
  }

  // ─── Render Items Pembelian ────────────────────────────
  function renderItems(rows) {
    if (!rows.length) {
      $("#tbody-items").html(
        '<tr><td colspan="6" style="text-align:center;padding:20px;color:#aaa">Tidak ada item</td></tr>',
      );
      return;
    }
    var html = "";
    $.each(rows, function (i, it) {
      html +=
        "<tr data-id='" +
        it.IDBELISPAREPART +
        "'>" +
        "<td style='color:#aaa'>" +
        (i + 1) +
        "</td>" +
        "<td style='font-weight:600'>" +
        xh(it.NAMA_SPAREPART || "—") +
        "</td>" +
        "<td class='center'><input type='number' class='inline-input qty-inline' value='" +
        it.JUMLAH +
        "' min='1'" +
        " onchange='updateItemJumlah(" +
        it.IDBELISPAREPART +
        ", this)'></td>" +
        "<td class='num'>" +
        rupiah(it.HARGA_SATUAN) +
        "</td>" +
        "<td class='num' id='item-sub-" +
        it.IDBELISPAREPART +
        "'>" +
        rupiah(it.SUB_TOTAL) +
        "</td>" +
        "<td class='center'><button class='btn-inline-del' onclick='hapusItemPembelian(" +
        it.IDBELISPAREPART +
        ", this)'>" +
        "<i class='fa-solid fa-trash'></i></button></td></tr>";
    });
    $("#tbody-items").html(html);
    recalcTotal();
  }

  // ─── Recalc Total ──────────────────────────────────────
  function recalcTotal() {
    var total = 0;
    // Dari layanan
    $("#tbody-layanan tr:not(.pending-row)").each(function () {
      var v = $(this).find(".inline-input").val();
      if (v !== undefined) total += Number(v) || 0;
    });
    // Dari sparepart
    $("#tbody-sparepart tr:not(.pending-row)").each(function () {
      var id = $(this).data("id");
      if (id) {
        var txt = $("#sp-sub-" + id)
          .text()
          .replace(/[^0-9]/g, "");
        total += Number(txt) || 0;
      }
    });
    // Dari items pembelian
    $("#tbody-items tr").each(function () {
      var id = $(this).data("id");
      if (id) {
        var txt = $("#item-sub-" + id)
          .text()
          .replace(/[^0-9]/g, "");
        total += Number(txt) || 0;
      }
    });
    $("#total-display").text(rupiah(total));
  }

  // ─── Tambah Layanan (Pending) ──────────────────────────
  window.addLayanan = function () {
    var sel = $("#sel-layanan");
    var id = sel.val();
    var nm = sel.find("option:selected").data("nama");
    if (!id) {
      errAlert("Pilih layanan terlebih dahulu.");
      return;
    }

    // Cek duplikat di existing rows
    var dup = false;
    $("#tbody-layanan tr:not(.pending-row)").each(function () {
      // tidak ada cara cek by IDLAYANANSERVIS di existing, skip duplikat di pending saja
    });
    if (
      state.pendingLayanan.find(function (x) {
        return x.IDLAYANANSERVIS == id;
      })
    ) {
      errAlert("Layanan ini sudah ditambahkan.");
      return;
    }

    state.pendingLayanan.push({ IDLAYANANSERVIS: id, NAMA_LAYANAN: nm });

    // Ambil baris existing untuk re-render
    var existing = getExistingLayananRows();
    renderLayanan(existing, false);
    sel.val("");
    toastOk(nm + " ditambahkan (belum disimpan).");
  };

  window.removePendingLayanan = function (idx) {
    state.pendingLayanan.splice(idx, 1);
    var existing = getExistingLayananRows();
    renderLayanan(existing, false);
  };

  function getExistingLayananRows() {
    var rows = [];
    $("#tbody-layanan tr:not(.pending-row)").each(function () {
      rows.push({
        IDDETAILTRANSAKSISERVIS: $(this).data("id"),
        NAMA_LAYANAN: $(this).find("td:eq(1)").text(),
        BIAYA: $(this).find(".inline-input").val() || 0,
      });
    });
    return rows;
  }

  // ─── Tambah Sparepart (Pending) ────────────────────────
  window.addSparepart = function () {
    var sel = $("#sel-sparepart");
    var id = sel.val();
    var nm = sel.find("option:selected").data("nama");
    var qty = parseInt($("#inp-sp-qty").val()) || 1;
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
    if (
      state.pendingSparepart.find(function (x) {
        return x.IDSPAREPART == id;
      })
    ) {
      errAlert("Sparepart ini sudah ditambahkan.");
      return;
    }

    state.pendingSparepart.push({
      IDSPAREPART: id,
      NAMA_SPAREPART: nm,
      QTY: qty,
    });
    var existing = getExistingSparepartRows();
    renderSparepart(existing, false);
    sel.val("");
    $("#inp-sp-qty").val(1);
    toastOk(nm + " x" + qty + " ditambahkan (belum disimpan).");
  };

  window.removePendingSparepart = function (idx) {
    state.pendingSparepart.splice(idx, 1);
    var existing = getExistingSparepartRows();
    renderSparepart(existing, false);
  };

  function getExistingSparepartRows() {
    var rows = [];
    $("#tbody-sparepart tr:not(.pending-row)").each(function () {
      var id = $(this).data("id");
      rows.push({
        IDSERVISSPAREPART: id,
        NAMA_SPAREPART: $(this).find("td:eq(1)").text(),
        QTY: $(this).find(".qty-inline").val() || 1,
        HARGASATUAN: 0,
        SUBTOTAL: 0,
      });
    });
    return rows;
  }

  // ─── Update Biaya Layanan (langsung ke server) ─────────
  window.updateLayananBiaya = function (idDetail, biaya) {
    $.ajax({
      url: API + "/servis/update-layanan/" + idDetail,
      method: "PUT",
      contentType: "application/json",
      data: JSON.stringify({ BIAYA: Number(biaya) }),
      success: function (res) {
        if (res.success) {
          recalcTotal();
          toastOk("Biaya diperbarui.");
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

  // ─── Hapus Layanan ─────────────────────────────────────
  window.hapusLayanan = function (idDetail, btn) {
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
            recalcTotal();
            toastOk("Layanan dihapus.");
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

  // ─── Update Qty Sparepart (langsung ke server) ─────────
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
          recalcTotal();
          toastOk("Qty diperbarui.");
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

  // ─── Hapus Sparepart ───────────────────────────────────
  window.hapusSparepart = function (idSp, btn) {
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
            recalcTotal();
            toastOk("Sparepart dihapus, stok dikembalikan.");
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

  // ─── Update Jumlah Item Pembelian ──────────────────────
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
          recalcTotal();
          toastOk("Jumlah diperbarui.");
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

  // ─── Hapus Item Pembelian ──────────────────────────────
  window.hapusItemPembelian = function (idItem, btn) {
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
            recalcTotal();
            toastOk("Item dihapus, stok dikembalikan.");
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

  // ─── Submit Simpan ─────────────────────────────────────
  window.submitSave = function () {
    var catatan = $.trim($("#edit-catatan").val());
    var idTransaksi = state.idTransaksi;
    var jenis = state.jenis;
    var idServis = state.idServis;

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

      $("#btn-save").prop("disabled", true);

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
      if (jenis === "SERVIS" && state.pendingLayanan.length) {
        promises.push(
          $.ajax({
            url: API + "/servis/add-layanan/" + idServis,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              ITEMS: state.pendingLayanan.map(function (x) {
                return { IDLAYANANSERVIS: x.IDLAYANANSERVIS };
              }),
            }),
          }),
        );
      }

      // 3. Kirim pending sparepart baru
      if (jenis === "SERVIS" && state.pendingSparepart.length) {
        promises.push(
          $.ajax({
            url: API + "/servis/add-sparepart/" + idServis,
            method: "POST",
            contentType: "application/json",
            data: JSON.stringify({
              ITEMS: state.pendingSparepart.map(function (x) {
                return { IDSPAREPART: x.IDSPAREPART, QTY: x.QTY };
              }),
            }),
          }),
        );
      }

      Promise.all(
        promises.map(function (p) {
          return Promise.resolve(p).catch(function (e) {
            return { _error: e };
          });
        }),
      ).then(function (results) {
        var failed = results.filter(function (r) {
          return r._error || r.success === false;
        });
        if (!failed.length) {
          Swal.fire({
            title: "Berhasil!",
            text: "Transaksi berhasil diperbarui.",
            icon: "success",
            confirmButtonColor: "#009CFF",
            timer: 2000,
            timerProgressBar: true,
          }).then(function () {
            window.location.href = "transaksi.html";
          });
        } else {
          $("#btn-save").prop("disabled", false);
          var errMsg = failed
            .map(function (r) {
              if (r._error)
                return (
                  (r._error.responseJSON && r._error.responseJSON.message) ||
                  "Error"
                );
              return r.message || "Gagal";
            })
            .join("; ");
          errAlert("Sebagian gagal: " + errMsg);
        }
      });
    });
  };

  // ─── Utils ────────────────────────────────────────────
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
