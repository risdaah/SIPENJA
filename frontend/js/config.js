// ============================================================
// KONFIGURASI GLOBAL API
// Ganti nilai di bawah ini sesuai environment:
//   - Local  : 'http://localhost:3000/api'
//   - Vercel : '/api'  (frontend & backend 1 domain)
//   - Custom : 'https://nama-backend-kamu.vercel.app/api'
// ============================================================

const API_BASE_URL = (() => {
  const origin = window.location.origin;

  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    return "http://localhost:3000/api"; // backend lokal
  }

  return "/api"; // Vercel / production (1 domain)
})();
