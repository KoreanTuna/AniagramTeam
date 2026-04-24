import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Firebase Auth signInWithPopup는 팝업에서 부모 창으로 postMessage로 credential을 돌려준다.
// Cross-Origin-Opener-Policy가 기본값(some browsers: same-origin)으로 걸려 있으면 window.opener
// 접근이 막혀 SDK가 "auth/popup-closed-by-user"로 잘못 보고하므로, 팝업 오리진 간 통신은 허용하고
// isolation은 풀어둔다.
const authSafeHeaders = {
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Embedder-Policy": "unsafe-none",
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: authSafeHeaders,
  },
  preview: {
    headers: authSafeHeaders,
  },
});
