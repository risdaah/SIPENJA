/* ===== KONFIGURASI ===== */
const API_BASE_URL = "http://localhost:3000/api";

/* ===== CARI STATUS ===== */
async function cariStatus() {
  const input = document.getElementById("inputKode");
  const kode = input.value.trim().toUpperCase();
  const area = document.getElementById("hasil-area");
  const btn = document.getElementById("btnCari");

  if (!kode) {
    input.focus();
    input.style.borderColor = "#ef4444";
    setTimeout(() => {
      input.style.borderColor = "";
    }, 1500);
    return;
  }

  btn.disabled = true;
  area.innerHTML = `
        <div class="hasil-loading">
            <div class="spinner"></div>
            <span>Mencari data...</span>
        </div>`;

  try {
    const res = await fetch(
      `${API_BASE_URL}/publik/cek-status/${encodeURIComponent(kode)}`,
    );
    const json = await res.json();

    if (!json.success || !json.data) {
      renderTidakDitemukan();
    } else {
      renderHasil(json.data);
    }
  } catch (err) {
    renderTidakDitemukan();
  } finally {
    btn.disabled = false;
  }
}

/* ===== RENDER TIDAK DITEMUKAN ===== */
function renderTidakDitemukan() {
  document.getElementById("hasil-area").innerHTML = `
        <div class="hasil-empty">
            <i class="fa-solid fa-circle-xmark"></i>
            <p>Tidak Ada Servis dengan Nomor Antrian Tersebut</p>
            <span>Pastikan kode antrian yang Anda masukkan benar</span>
        </div>`;
}

/* ===== RENDER HASIL ===== */
function renderHasil(s) {
  const badgeClass =
    s.STATUS === "Selesai"
      ? "selesai"
      : s.STATUS === "Dalam Proses"
        ? "proses"
        : "belum";

  const layananHtml =
    s.LAYANAN && s.LAYANAN.length
      ? s.LAYANAN.map(
          (l) =>
            `<span class="layanan-chip">${esc(l.NAMA_LAYANAN || l.NAMA || "-")}</span>`,
        ).join("")
      : `<span class="layanan-chip" style="background:#f3f4f6;color:#6b7280">Belum ada layanan</span>`;

  let timelineHtml = "";
  if (s.PROGRESS && s.PROGRESS.length) {
    const items = s.PROGRESS.map((p, i) => {
      const isLatest = i === s.PROGRESS.length - 1;
      const dotClass = isLatest
        ? "latest"
        : p.STATUS === "Selesai"
          ? "selesai"
          : p.STATUS === "Dalam Proses"
            ? "proses"
            : "belum";
      return `
                <div class="timeline__item">
                    <div class="timeline__dot ${dotClass}"></div>
                    <div class="timeline__content">
                        <div class="timeline__status">${esc(p.STATUS)}</div>
                        <div class="timeline__waktu">${formatWaktu(p.WAKTU)}</div>
                        ${p.KETERANGAN ? `<div class="timeline__keterangan">${esc(p.KETERANGAN)}</div>` : ""}
                    </div>
                </div>`;
    }).join("");

    timelineHtml = `
            <div class="timeline">
                <div class="timeline__label"><i class="fa-solid fa-timeline me-1"></i>Riwayat Progress</div>
                <div class="timeline__list">${items}</div>
            </div>`;
  }

  document.getElementById("hasil-area").innerHTML = `
        <div class="hasil-card">
            <div class="hasil-card__head">
                <div>
                    <div class="hasil-card__kode">${esc(s.KODEANTRIAN)}</div>
                    <div class="hasil-card__nama">${esc(s.NAMAPELANGGAN)}</div>
                </div>
                <div class="badge-status ${badgeClass}">
                    <span class="dot"></span>
                    ${esc(s.STATUS || "-")}
                </div>
            </div>
            <div class="hasil-card__body">
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-item__label">Keluhan</div>
                        <div class="info-item__value">${esc(s.KELUHAN || "-")}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-item__label">Tanggal Masuk</div>
                        <div class="info-item__value">${formatTanggal(s.TANGGALMASUK)}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-item__label">Tanggal Selesai</div>
                        <div class="info-item__value">${s.TANGGALSELESAI ? formatTanggal(s.TANGGALSELESAI) : "—"}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-item__label">Mekanik</div>
                        <div class="info-item__value">${esc(s.NAMA_MEKANIK || "-")}</div>
                    </div>
                </div>

                <div class="layanan-list">
                    <div class="layanan-list__label"><i class="fa-solid fa-tag me-1"></i>Layanan</div>
                    <div class="layanan-chips">${layananHtml}</div>
                </div>

                ${timelineHtml}
            </div>
        </div>`;
}

/* ===== UTILS ===== */
function formatTanggal(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function formatWaktu(str) {
  if (!str) return "-";
  return new Date(str).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
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
