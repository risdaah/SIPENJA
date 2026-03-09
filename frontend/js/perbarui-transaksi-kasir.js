/* ===== KONFIGURASI BASE URL API ===== */
const API_BASE_URL = "http://localhost:3000/api";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: "Bearer " + Session.getToken(),
  };
}

/* ===================================================
   INIT
=================================================== */
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

  $(document).ready(function () {
    if (!Session.guard(["kasir"])) return;
    Session.setupAjax();
    var _u = Session.getUser();
    if (_u) {
      $("#navbar-nama").text(_u.NAMA);
      $("#navbar-role").text(_u.ROLE);
    }
    loadTransaksi();

    document
      .getElementById("filterJenis")
      .addEventListener("change", function () {
        filterTabel(this.value);
      });
  });
})(jQuery);

/* ===================================================
   STATE
=================================================== */
var semuaTransaksi = [];

/* ===================================================
   LOAD SEMUA TRANSAKSI
=================================================== */
function loadTransaksi() {
  var user = Session.getUser();
  if (!user) return;

  var tbody = document.getElementById("tableBody");
  tbody.innerHTML =
    '<tr><td colspan="7" class="text-center py-4 text-muted">' +
    '<div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>' +
    "Memuat data...</td></tr>";

  fetch(API_BASE_URL + "/transaksi/get-by-kasir/" + user.IDUSER, {
    headers: getAuthHeaders(),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      semuaTransaksi = res.data || [];
      renderTable(semuaTransaksi);
    })
    .catch(function () {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center py-4 text-danger">Gagal memuat data transaksi.</td></tr>';
    });
}

/* ===================================================
   FILTER TABEL
=================================================== */
function filterTabel(jenis) {
  var list = jenis
    ? semuaTransaksi.filter(function (t) {
        return t.JENISTRANSAKSI === jenis;
      })
    : semuaTransaksi;
  renderTable(list);
}

/* ===================================================
   RENDER TABEL
=================================================== */
function renderTable(list) {
  var tbody = document.getElementById("tableBody");
  if (!list.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-4 text-muted">Tidak ada transaksi.</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map(function (t, i) {
      var jenisBadge =
        t.JENISTRANSAKSI === "SERVIS"
          ? '<span class="badge badge-jenis-servis">Servis</span>'
          : '<span class="badge badge-jenis-pembelian">Pembelian</span>';

      return (
        "<tr>" +
        '<td class="text-center">' +
        (i + 1) +
        "</td>" +
        '<td class="text-center fw-semibold">' +
        escapeHtml(t.NOTRANSAKSI) +
        "</td>" +
        "<td>" +
        escapeHtml(t.NAMA_KASIR || "-") +
        "</td>" +
        '<td class="text-center">' +
        jenisBadge +
        "</td>" +
        '<td class="text-end">' +
        formatRupiah(t.TOTAL) +
        "</td>" +
        '<td class="text-center">' +
        formatTanggal(t.TANGGAL) +
        "</td>" +
        '<td class="text-center">' +
        '<button class="btn btn-warning btn-sm btn-square" title="Edit" ' +
        'onclick="bukaModalEdit(' +
        t.IDTRANSAKSI +
        ", '" +
        t.JENISTRANSAKSI +
        "')\">" +
        '<i class="fa fa-pen-to-square"></i>' +
        "</button>" +
        "</td>" +
        "</tr>"
      );
    })
    .join("");
}

/* ===================================================
   ROUTING MODAL
=================================================== */
function bukaModalEdit(idTransaksi, jenis) {
  if (jenis === "SERVIS") {
    bukaModalEditServis(idTransaksi);
  } else {
    bukaModalEditPembelian(idTransaksi);
  }
}

/* ===================================================
   MODAL EDIT SERVIS
   GET  /api/transaksi/get/:id
   PUT  /api/servis/update/:idServis        (data umum)
   POST /api/servis/add-layanan/:idServis   (tambah layanan)
   POST /api/servis/add-sparepart/:idServis (tambah sparepart)
=================================================== */
var layananBaru = [];
var sparepartBaru = [];
var layananRowCount = 0;
var sparepartRowCount = 0;

function bukaModalEditServis(idTransaksi) {
  // Reset state
  layananBaru = [];
  sparepartBaru = [];
  layananRowCount = 0;
  sparepartRowCount = 0;

  var body = document.getElementById("modalEditServisBody");
  body.innerHTML =
    '<div class="text-center py-4">' +
    '<div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat...</div>';

  new bootstrap.Modal(document.getElementById("modalEditServis")).show();

  fetch(API_BASE_URL + "/transaksi/get/" + idTransaksi, {
    headers: getAuthHeaders(),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var t = res.data;
      var s = t.SERVIS;

      if (!s) {
        body.innerHTML =
          '<div class="text-danger">Data servis tidak ditemukan.</div>';
        return;
      }

      document.getElementById("editServisIdTransaksi").value = idTransaksi;
      document.getElementById("editServisIdServis").value = s.IDSERVIS;

      var statusSelesai = s.STATUS === "Selesai";
      var da = statusSelesai ? "disabled" : "";

      // ── Layanan yang sudah ada ──
      var layananExisting =
        (s.LAYANAN || [])
          .map(function (l) {
            return (
              "<tr><td>" +
              escapeHtml(l.NAMA_LAYANAN || "-") +
              "</td>" +
              '<td class="text-end">' +
              formatRupiah(l.BIAYA) +
              "</td></tr>"
            );
          })
          .join("") ||
        '<tr><td colspan="2" class="text-muted fst-italic">Belum ada layanan</td></tr>';

      // ── Sparepart yang sudah ada ──
      var sparepartExisting =
        (s.SPAREPART || [])
          .map(function (sp) {
            return (
              "<tr><td>" +
              escapeHtml(sp.NAMA_SPAREPART || "-") +
              "</td>" +
              '<td class="text-center">' +
              sp.QTY +
              "</td>" +
              '<td class="text-end">' +
              formatRupiah(sp.SUBTOTAL) +
              "</td></tr>"
            );
          })
          .join("") ||
        '<tr><td colspan="3" class="text-muted fst-italic">Belum ada sparepart</td></tr>';

      body.innerHTML =
        // ── Info header ──
        '<div class="alert alert-light border mb-3"><div class="row g-2">' +
        '<div class="col-sm-6"><span class="text-muted small">No. Transaksi</span>' +
        '<div class="fw-semibold">' +
        escapeHtml(t.NOTRANSAKSI) +
        "</div></div>" +
        '<div class="col-sm-6"><span class="text-muted small">Tanggal</span>' +
        "<div>" +
        formatTanggal(t.TANGGAL) +
        "</div></div>" +
        '<div class="col-sm-6"><span class="text-muted small">Kasir</span>' +
        "<div>" +
        escapeHtml(t.NAMA_KASIR || "-") +
        "</div></div>" +
        '<div class="col-sm-6"><span class="text-muted small">Status Servis</span>' +
        "<div>" +
        badgeStatus(s.STATUS) +
        "</div></div>" +
        "</div></div>" +
        (statusSelesai
          ? '<div class="alert alert-warning mb-3"><i class="fa fa-triangle-exclamation me-2"></i>' +
            "Servis sudah <strong>Selesai</strong>, data tidak dapat diubah.</div>"
          : "") +
        // ── Data umum ──
        '<div class="mb-3"><label class="form-label fw-semibold">Nama Pelanggan <span class="text-danger">*</span></label>' +
        '<input type="text" class="form-control" id="editNamaPelanggan" value="' +
        escapeHtml(s.NAMAPELANGGAN) +
        '" ' +
        da +
        "></div>" +
        '<div class="mb-3"><label class="form-label fw-semibold">Keluhan <span class="text-danger">*</span></label>' +
        '<textarea class="form-control" id="editKeluhan" rows="2" ' +
        da +
        ">" +
        escapeHtml(s.KELUHAN || "") +
        "</textarea></div>" +
        '<div class="mb-4"><label class="form-label fw-semibold">Catatan <small class="text-muted fw-normal">(opsional)</small></label>' +
        '<textarea class="form-control" id="editCatatanServis" rows="2" ' +
        da +
        ">" +
        escapeHtml(t.CATATAN || "") +
        "</textarea></div>" +
        "<hr>" +
        // ── Layanan yang sudah ada ──
        '<h6 class="fw-semibold mb-2"><i class="fa-solid fa-tag me-1 text-warning"></i>Layanan Terdaftar</h6>' +
        '<div class="table-responsive mb-3"><table class="table table-sm table-bordered mb-0">' +
        '<thead class="table-light"><tr><th>Nama Layanan</th><th class="text-end">Biaya</th></tr></thead>' +
        "<tbody>" +
        layananExisting +
        "</tbody></table></div>" +
        // ── Tambah layanan baru ──
        (!statusSelesai
          ? '<div class="mb-4">' +
            '<div class="d-flex justify-content-between align-items-center mb-2">' +
            '<label class="form-label fw-semibold mb-0"><i class="fa-solid fa-plus-circle me-1 text-warning"></i>Tambah Layanan Baru</label>' +
            '<button class="btn btn-warning btn-sm" onclick="tambahBarisLayananEdit()"><i class="fa-solid fa-plus me-1"></i>Tambah</button>' +
            "</div>" +
            '<div id="listTambahLayanan"></div>' +
            "</div>"
          : "") +
        "<hr>" +
        // ── Sparepart yang sudah ada ──
        '<h6 class="fw-semibold mb-2"><i class="fa fa-gear me-1 text-secondary"></i>Sparepart Terdaftar</h6>' +
        '<div class="table-responsive mb-3"><table class="table table-sm table-bordered mb-0">' +
        '<thead class="table-light"><tr><th>Sparepart</th><th class="text-center">Qty</th><th class="text-end">Subtotal</th></tr></thead>' +
        "<tbody>" +
        sparepartExisting +
        "</tbody></table></div>" +
        // ── Tambah sparepart baru ──
        (!statusSelesai
          ? '<div class="mb-2">' +
            '<div class="d-flex justify-content-between align-items-center mb-2">' +
            '<label class="form-label fw-semibold mb-0"><i class="fa-solid fa-plus-circle me-1 text-secondary"></i>Tambah Sparepart Baru</label>' +
            '<button class="btn btn-secondary btn-sm" onclick="tambahBarisSparepartEdit()"><i class="fa-solid fa-plus me-1"></i>Tambah</button>' +
            "</div>" +
            '<div id="listTambahSparepart"></div>' +
            "</div>"
          : "");

      document.getElementById("btnSimpanEditServis").style.display =
        statusSelesai ? "none" : "inline-block";
    })
    .catch(function () {
      body.innerHTML =
        '<div class="text-danger">Gagal memuat data transaksi.</div>';
    });
}

/* ── Tambah baris cari layanan ── */
function tambahBarisLayananEdit() {
  var rowId = "layEditRow" + ++layananRowCount;
  var html =
    '<div class="input-group mb-2 position-relative" id="' +
    rowId +
    '">' +
    '<input type="text" class="form-control form-control-sm" placeholder="Ketik nama layanan..." ' +
    "oninput=\"cariLayananEdit(this, '" +
    rowId +
    "')\">" +
    '<button class="btn btn-outline-danger btn-sm" onclick="hapusBarisEdit(\'' +
    rowId +
    "', false)\">" +
    '<i class="fa-solid fa-trash-can"></i></button>' +
    '<div class="dropdown-hasil-inline d-none" id="hasil' +
    rowId +
    '"></div>' +
    "</div>";
  document
    .getElementById("listTambahLayanan")
    .insertAdjacentHTML("beforeend", html);
}

function cariLayananEdit(input, rowId) {
  var keyword = input.value.trim().toLowerCase();
  var box = document.getElementById("hasil" + rowId);
  if (!keyword) {
    box.classList.add("d-none");
    box.innerHTML = "";
    return;
  }

  fetch(API_BASE_URL + "/layanan-servis/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var list = (res.data || res)
        .filter(function (l) {
          return l.NAMA.toLowerCase().includes(keyword);
        })
        .slice(0, 6);
      box.innerHTML = "";
      if (!list.length) {
        box.innerHTML =
          '<div class="hasil-item text-muted">Tidak ditemukan</div>';
        box.classList.remove("d-none");
        return;
      }
      list.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "hasil-item";
        div.innerHTML =
          '<span class="fw-semibold">' +
          escapeHtml(item.NAMA) +
          "</span>" +
          '<span class="text-muted ms-2">' +
          formatRupiah(item.BIAYAPOKOK) +
          "</span>";
        div.onclick = function () {
          if (
            layananBaru.find(function (l) {
              return l.IDLAYANANSERVIS === item.IDLAYANANSERVIS;
            })
          ) {
            Swal.fire("Info", "Layanan sudah ditambahkan.", "info");
            return;
          }
          layananBaru.push(item);
          input.value = item.NAMA + " — " + formatRupiah(item.BIAYAPOKOK);
          input.dataset.idLayanan = item.IDLAYANANSERVIS;
          input.readOnly = true;
          box.classList.add("d-none");
        };
        box.appendChild(div);
      });
      box.classList.remove("d-none");
    });
}

/* ── Tambah baris cari sparepart ── */
function tambahBarisSparepartEdit() {
  var rowId = "spEditRow" + ++sparepartRowCount;
  var html =
    '<div class="mb-2 position-relative" id="' +
    rowId +
    '">' +
    '<div class="input-group input-group-sm">' +
    '<input type="text" class="form-control" placeholder="Ketik nama sparepart..." ' +
    "oninput=\"cariSparepartEdit(this, '" +
    rowId +
    "')\">" +
    '<input type="number" class="form-control qty-input-edit" placeholder="Qty" min="1" ' +
    'style="max-width:80px" id="qtyEdit' +
    rowId +
    '" disabled>' +
    '<button class="btn btn-outline-danger" onclick="hapusBarisEdit(\'' +
    rowId +
    "', true)\">" +
    '<i class="fa-solid fa-trash-can"></i></button>' +
    "</div>" +
    '<div class="dropdown-hasil-inline d-none" id="hasil' +
    rowId +
    '"></div>' +
    "</div>";
  document
    .getElementById("listTambahSparepart")
    .insertAdjacentHTML("beforeend", html);
}

function cariSparepartEdit(input, rowId) {
  var keyword = input.value.trim().toLowerCase();
  var box = document.getElementById("hasil" + rowId);
  if (!keyword) {
    box.classList.add("d-none");
    box.innerHTML = "";
    return;
  }

  fetch(API_BASE_URL + "/sparepart/get-all", { headers: getAuthHeaders() })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var list = (res.data || res)
        .filter(function (s) {
          return s.NAMA.toLowerCase().includes(keyword);
        })
        .slice(0, 6);
      box.innerHTML = "";
      if (!list.length) {
        box.innerHTML =
          '<div class="hasil-item text-muted">Tidak ditemukan</div>';
        box.classList.remove("d-none");
        return;
      }
      list.forEach(function (item) {
        var div = document.createElement("div");
        div.className = "hasil-item" + (item.STOK <= 0 ? " disabled-item" : "");
        div.innerHTML =
          '<span class="fw-semibold">' +
          escapeHtml(item.NAMA) +
          "</span>" +
          '<span class="text-muted ms-2">' +
          formatRupiah(item.HARGAJUAL) +
          "</span>" +
          (item.STOK <= 0
            ? '<span class="badge bg-danger ms-2">Stok Habis</span>'
            : '<span class="text-muted ms-2">Stok: ' + item.STOK + "</span>");
        div.onclick = function () {
          if (item.STOK <= 0) {
            Swal.fire("Peringatan", "Stok habis.", "warning");
            return;
          }
          input.value = item.NAMA;
          input.dataset.idSparepart = item.IDSPAREPART;
          input.dataset.stok = item.STOK;
          input.readOnly = true;
          var qtyEl = document.getElementById("qtyEdit" + rowId);
          qtyEl.disabled = false;
          qtyEl.max = item.STOK;
          qtyEl.value = 1;
          box.classList.add("d-none");
        };
        box.appendChild(div);
      });
      box.classList.remove("d-none");
    });
}

function hapusBarisEdit(rowId, isSp) {
  var el = document.getElementById(rowId);
  if (!el) return;
  var input = el.querySelector(
    "input[data-id-layanan], input[data-id-sparepart]",
  );
  if (input) {
    if (isSp && input.dataset.idSparepart) {
      var id = parseInt(input.dataset.idSparepart);
      sparepartBaru = sparepartBaru.filter(function (s) {
        return s.IDSPAREPART !== id;
      });
    } else if (!isSp && input.dataset.idLayanan) {
      var id = parseInt(input.dataset.idLayanan);
      layananBaru = layananBaru.filter(function (l) {
        return l.IDLAYANANSERVIS !== id;
      });
    }
  }
  el.remove();
}

function simpanEditServis() {
  var idServis = document.getElementById("editServisIdServis").value;
  var NAMAPELANGGAN = document.getElementById("editNamaPelanggan").value.trim();
  var KELUHAN = document.getElementById("editKeluhan").value.trim();
  var CATATAN = document.getElementById("editCatatanServis").value.trim();

  if (!NAMAPELANGGAN || !KELUHAN) {
    return Swal.fire(
      "Peringatan",
      "Nama Pelanggan dan Keluhan wajib diisi.",
      "warning",
    );
  }

  // Kumpulkan layanan baru
  var layananPayload = [];
  document
    .querySelectorAll("#listTambahLayanan input[readonly]")
    .forEach(function (inp) {
      if (inp.dataset.idLayanan) {
        layananPayload.push({
          IDLAYANANSERVIS: parseInt(inp.dataset.idLayanan),
        });
      }
    });

  // Kumpulkan sparepart baru
  var sparepartPayload = [];
  var valid = true;
  document
    .querySelectorAll("#listTambahSparepart .mb-2")
    .forEach(function (row) {
      var spInput = row.querySelector("input[data-id-sparepart]");
      var qtyInput = row.querySelector(".qty-input-edit");
      if (!spInput || !qtyInput) return;
      var qty = parseInt(qtyInput.value);
      if (!qty || qty <= 0) {
        Swal.fire("Peringatan", "Isi jumlah sparepart yang valid.", "warning");
        valid = false;
        return;
      }
      if (qty > parseInt(spInput.dataset.stok)) {
        Swal.fire(
          "Peringatan",
          "Jumlah melebihi stok (" + spInput.dataset.stok + ").",
          "warning",
        );
        valid = false;
        return;
      }
      sparepartPayload.push({
        IDSPAREPART: parseInt(spInput.dataset.idSparepart),
        QTY: qty,
      });
    });
  if (!valid) return;

  var btn = document.getElementById("btnSimpanEditServis");
  btn.disabled = true;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';

  // Jalankan semua request secara berurutan
  var promises = [];

  // 1. Update data umum servis
  promises.push(
    fetch(API_BASE_URL + "/servis/update/" + idServis, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({
        NAMAPELANGGAN: NAMAPELANGGAN,
        KELUHAN: KELUHAN,
        CATATAN: CATATAN || null,
      }),
    }).then(function (r) {
      return r.json();
    }),
  );

  // 2. Tambah layanan baru (jika ada)
  if (layananPayload.length > 0) {
    promises.push(
      fetch(API_BASE_URL + "/servis/add-layanan/" + idServis, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ITEMS: layananPayload }),
      }).then(function (r) {
        return r.json();
      }),
    );
  }

  // 3. Tambah sparepart baru (jika ada)
  if (sparepartPayload.length > 0) {
    promises.push(
      fetch(API_BASE_URL + "/servis/add-sparepart/" + idServis, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ ITEMS: sparepartPayload }),
      }).then(function (r) {
        return r.json();
      }),
    );
  }

  Promise.all(promises)
    .then(function (results) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-floppy-disk me-1"></i>Simpan';
      var failed = results.find(function (r) {
        return !r.success;
      });
      if (failed) throw new Error(failed.message || "Gagal menyimpan");
      bootstrap.Modal.getInstance(
        document.getElementById("modalEditServis"),
      ).hide();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data servis berhasil diperbarui.",
        timer: 1600,
        showConfirmButton: false,
      }).then(function () {
        loadTransaksi();
      });
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-floppy-disk me-1"></i>Simpan';
      Swal.fire(
        "Gagal",
        err.message || "Tidak dapat terhubung ke server.",
        "error",
      );
    });
}

/* ===================================================
   MODAL EDIT PEMBELIAN
   GET    /api/transaksi/get/:id
   PUT    /api/transaksi-pembelian-sparepart/item/:id
   DELETE /api/transaksi-pembelian-sparepart/item/:id
   PUT    /api/transaksi-pembelian-sparepart/update/:id
=================================================== */
function bukaModalEditPembelian(idTransaksi) {
  document.getElementById("editPembelianIdTransaksi").value = idTransaksi;
  var body = document.getElementById("modalEditPembelianBody");
  body.innerHTML =
    '<div class="text-center py-4">' +
    '<div class="spinner-border spinner-border-sm text-primary me-2"></div>Memuat...</div>';

  new bootstrap.Modal(document.getElementById("modalEditPembelian")).show();
  loadDetailPembelian(idTransaksi);
}

function loadDetailPembelian(idTransaksi) {
  var body = document.getElementById("modalEditPembelianBody");

  fetch(API_BASE_URL + "/transaksi/get/" + idTransaksi, {
    headers: getAuthHeaders(),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      var t = res.data;
      var items = t.ITEMS || [];
      var total = items.reduce(function (acc, it) {
        return acc + Number(it.SUB_TOTAL || 0);
      }, 0);

      var itemRows = items.length
        ? items
            .map(function (it) {
              return (
                '<tr id="itemRow' +
                it.IDBELISPAREPART +
                '">' +
                "<td>" +
                escapeHtml(it.NAMA_SPAREPART || "-") +
                "</td>" +
                '<td class="text-end">' +
                formatRupiah(it.HARGA_SATUAN) +
                "</td>" +
                '<td class="text-center" style="width:110px">' +
                '<input type="number" class="form-control form-control-sm text-center" ' +
                'id="qty' +
                it.IDBELISPAREPART +
                '" value="' +
                it.JUMLAH +
                '" min="1" ' +
                'style="width:70px;display:inline-block">' +
                "</td>" +
                '<td class="text-end" id="subtotal' +
                it.IDBELISPAREPART +
                '">' +
                formatRupiah(it.SUB_TOTAL) +
                "</td>" +
                '<td class="text-center">' +
                '<button class="btn btn-sm btn-outline-primary btn-sm-square me-1" title="Simpan Qty" ' +
                'onclick="simpanQtyItem(' +
                it.IDBELISPAREPART +
                ", " +
                it.HARGA_SATUAN +
                ", " +
                idTransaksi +
                ')">' +
                '<i class="fa fa-check"></i></button>' +
                '<button class="btn btn-sm btn-outline-danger btn-sm-square" title="Hapus" ' +
                'onclick="hapusItemPembelian(' +
                it.IDBELISPAREPART +
                ", " +
                idTransaksi +
                ')">' +
                '<i class="fa fa-trash"></i></button>' +
                "</td>" +
                "</tr>"
              );
            })
            .join("")
        : '<tr><td colspan="5" class="text-muted fst-italic text-center">Tidak ada item</td></tr>';

      body.innerHTML =
        '<div class="alert alert-light border mb-3">' +
        '<div class="row g-2">' +
        '<div class="col-sm-6"><span class="text-muted small">No. Transaksi</span>' +
        '<div class="fw-semibold">' +
        escapeHtml(t.NOTRANSAKSI) +
        "</div></div>" +
        '<div class="col-sm-6"><span class="text-muted small">Tanggal</span>' +
        "<div>" +
        formatTanggal(t.TANGGAL) +
        "</div></div>" +
        "</div></div>" +
        '<h6 class="fw-semibold mb-2">' +
        '<i class="fa fa-gear me-1 text-secondary"></i>Item Sparepart</h6>' +
        '<div class="table-responsive mb-3">' +
        '<table class="table table-sm table-bordered align-middle mb-0">' +
        '<thead class="table-light"><tr>' +
        "<th>Sparepart</th>" +
        '<th class="text-end">Harga Satuan</th>' +
        '<th class="text-center">Qty</th>' +
        '<th class="text-end">Subtotal</th>' +
        '<th class="text-center" style="width:90px">Aksi</th>' +
        "</tr></thead>" +
        "<tbody>" +
        itemRows +
        "</tbody>" +
        "</table></div>" +
        '<div class="d-flex justify-content-end mb-3">' +
        '<div class="bg-light rounded px-4 py-2">' +
        'Total: <span class="fw-bold text-primary ms-2" id="totalPembelian">' +
        formatRupiah(total) +
        "</span>" +
        "</div></div>" +
        '<div class="mb-1">' +
        '<label class="form-label fw-semibold">Catatan</label>' +
        '<textarea class="form-control" id="editCatatanPembelian" rows="2">' +
        escapeHtml(t.CATATAN || "") +
        "</textarea>" +
        "</div>";
    })
    .catch(function () {
      body.innerHTML =
        '<div class="text-danger">Gagal memuat data transaksi.</div>';
    });
}

function simpanQtyItem(idBeli, hargaSatuan, idTransaksi) {
  var qty = parseInt(document.getElementById("qty" + idBeli).value);
  if (!qty || qty <= 0) {
    return Swal.fire("Peringatan", "Qty harus lebih dari 0.", "warning");
  }

  fetch(API_BASE_URL + "/transaksi-pembelian-sparepart/update-item/" + idBeli, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ JUMLAH: qty }),
  })
    .then(function (r) {
      if (!r.ok)
        return r.text().then(function (t) {
          throw new Error("Server error " + r.status + ": " + t);
        });
      return r.json();
    })
    .then(function (res) {
      if (!res.success) throw new Error(res.message || "Gagal update qty");
      document.getElementById("subtotal" + idBeli).textContent = formatRupiah(
        qty * hargaSatuan,
      );
      recalcTotalPembelian();
      Swal.fire({
        icon: "success",
        title: "Qty diperbarui!",
        timer: 1200,
        showConfirmButton: false,
      });
    })
    .catch(function (err) {
      Swal.fire(
        "Gagal",
        err.message || "Tidak dapat terhubung ke server.",
        "error",
      );
    });
}

function hapusItemPembelian(idBeli, idTransaksi) {
  Swal.fire({
    title: "Hapus item ini?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#ff4757",
    cancelButtonColor: "#6c757d",
    confirmButtonText: "Ya, Hapus",
    cancelButtonText: "Batal",
  }).then(function (result) {
    if (!result.isConfirmed) return;
    fetch(
      API_BASE_URL + "/transaksi-pembelian-sparepart/delete-item/" + idBeli,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
      },
    )
      .then(function (r) {
        return r.json();
      })
      .then(function (res) {
        if (!res.success)
          throw new Error(res.message || "Gagal menghapus item");
        var row = document.getElementById("itemRow" + idBeli);
        if (row) row.remove();
        recalcTotalPembelian();
        Swal.fire({
          icon: "success",
          title: "Item dihapus!",
          timer: 1200,
          showConfirmButton: false,
        });
      })
      .catch(function (err) {
        Swal.fire(
          "Gagal",
          err.message || "Tidak dapat terhubung ke server.",
          "error",
        );
      });
  });
}

function recalcTotalPembelian() {
  var total = 0;
  document.querySelectorAll("[id^='subtotal']").forEach(function (el) {
    var val = el.textContent.replace(/[^0-9]/g, "");
    total += parseInt(val) || 0;
  });
  var elTotal = document.getElementById("totalPembelian");
  if (elTotal) elTotal.textContent = formatRupiah(total);
}

function simpanCatatanPembelian() {
  var idTransaksi = document.getElementById("editPembelianIdTransaksi").value;
  var CATATAN = document.getElementById("editCatatanPembelian").value.trim();

  var btn = document.getElementById("btnSimpanCatatanPembelian");
  btn.disabled = true;
  btn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-1"></span>Menyimpan...';

  fetch(API_BASE_URL + "/transaksi-pembelian-sparepart/update/" + idTransaksi, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify({ CATATAN: CATATAN }),
  })
    .then(function (r) {
      return r.json();
    })
    .then(function (res) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-floppy-disk me-1"></i>Simpan Catatan';
      if (!res.success)
        throw new Error(res.message || "Gagal menyimpan catatan");
      bootstrap.Modal.getInstance(
        document.getElementById("modalEditPembelian"),
      ).hide();
      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Catatan berhasil diperbarui.",
        timer: 1600,
        showConfirmButton: false,
      }).then(function () {
        loadTransaksi();
      });
    })
    .catch(function (err) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa fa-floppy-disk me-1"></i>Simpan Catatan';
      Swal.fire(
        "Gagal",
        err.message || "Tidak dapat terhubung ke server.",
        "error",
      );
    });
}

/* ===================================================
   UTILS
=================================================== */
function badgeStatus(status) {
  var map = {
    Belum: "bg-secondary",
    "Dalam Proses": "bg-warning text-dark",
    Selesai: "bg-success",
  };
  return (
    '<span class="badge ' +
    (map[status] || "bg-secondary") +
    '">' +
    escapeHtml(status || "-") +
    "</span>"
  );
}

function formatRupiah(angka) {
  return "Rp" + Number(angka || 0).toLocaleString("id-ID");
}

function formatTanggal(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
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
