// ============================================================
// KONFIGURASI GLOBAL API
// Ganti nilai di bawah ini sesuai environment:
//   - Local  : 'http://localhost:3000/api'
//   - Vercel : '/api'  (frontend & backend 1 domain)
//   - Custom : 'https://nama-backend-kamu.vercel.app/api'
// ============================================================

const API_BASE_URL =
  window.location.origin === "http://localhost:3000"
    ? "http://localhost:3000/api"
    : "/api";
