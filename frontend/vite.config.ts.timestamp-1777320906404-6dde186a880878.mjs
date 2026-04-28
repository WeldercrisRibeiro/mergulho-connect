// vite.config.ts
import { defineConfig } from "file:///C:/Users/SURI%20-%20BEM%20085/Documents/WELDER/DEV/ccmergulho/mergulho-connect/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/SURI%20-%20BEM%20085/Documents/WELDER/DEV/ccmergulho/mergulho-connect/frontend/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/SURI%20-%20BEM%20085/Documents/WELDER/DEV/ccmergulho/mergulho-connect/frontend/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\SURI - BEM 085\\Documents\\WELDER\\DEV\\ccmergulho\\mergulho-connect\\frontend";
var vite_config_default = defineConfig(({ mode }) => {
  const isProd = mode === "production";
  return {
    server: {
      host: true,
      port: 8080,
      hmr: {
        overlay: false
      },
      proxy: {
        "/api": {
          target: "https://mergulho-connect-eh6j.onrender.com:3001",
          //se em produção usar https://mergulho-connect.onrender.com:3001
          changeOrigin: true
        }
      }
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core"
      ]
    },
    build: {
      // ── Segurança: sem source maps em produção ──────────────────────────────
      // Source maps expõem o código-fonte original ao browser, facilitando
      // a engenharia reversa da aplicação por terceiros.
      sourcemap: false,
      // ── Minificação agressiva para dificultar leitura do bundle ─────────────
      minify: "esbuild"
    },
    // ── esbuild: remove todos os console.* no build de produção ─────────────
    // Isso garante que nenhum log sensível (email, erros de auth, etc.)
    // chegue ao bundle final independentemente de onde esteja no código.
    esbuild: isProd ? {
      drop: ["console", "debugger"],
      legalComments: "none"
    } : {}
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxTVVJJIC0gQkVNIDA4NVxcXFxEb2N1bWVudHNcXFxcV0VMREVSXFxcXERFVlxcXFxjY21lcmd1bGhvXFxcXG1lcmd1bGhvLWNvbm5lY3RcXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXFNVUkkgLSBCRU0gMDg1XFxcXERvY3VtZW50c1xcXFxXRUxERVJcXFxcREVWXFxcXGNjbWVyZ3VsaG9cXFxcbWVyZ3VsaG8tY29ubmVjdFxcXFxmcm9udGVuZFxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvU1VSSSUyMC0lMjBCRU0lMjAwODUvRG9jdW1lbnRzL1dFTERFUi9ERVYvY2NtZXJndWxoby9tZXJndWxoby1jb25uZWN0L2Zyb250ZW5kL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgY29uc3QgaXNQcm9kID0gbW9kZSA9PT0gXCJwcm9kdWN0aW9uXCI7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgaG9zdDogdHJ1ZSxcclxuICAgICAgcG9ydDogODA4MCxcclxuICAgICAgaG1yOiB7XHJcbiAgICAgICAgb3ZlcmxheTogZmFsc2UsXHJcbiAgICAgIH0sXHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjMwMDFcIixcclxuICAgICAgICAgIC8vc2UgZW0gcHJvZHVcdTAwRTdcdTAwRTNvIHVzYXIgaHR0cHM6Ly9tZXJndWxoby1jb25uZWN0Lm9ucmVuZGVyLmNvbTozMDAxXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcblxyXG4gICAgcGx1Z2luczogW3JlYWN0KCksIG1vZGUgPT09IFwiZGV2ZWxvcG1lbnRcIiAmJiBjb21wb25lbnRUYWdnZXIoKV0uZmlsdGVyKEJvb2xlYW4pLFxyXG5cclxuICAgIHJlc29sdmU6IHtcclxuICAgICAgYWxpYXM6IHtcclxuICAgICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcclxuICAgICAgfSxcclxuICAgICAgZGVkdXBlOiBbXHJcbiAgICAgICAgXCJyZWFjdFwiLFxyXG4gICAgICAgIFwicmVhY3QtZG9tXCIsXHJcbiAgICAgICAgXCJyZWFjdC9qc3gtcnVudGltZVwiLFxyXG4gICAgICAgIFwicmVhY3QvanN4LWRldi1ydW50aW1lXCIsXHJcbiAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcclxuICAgICAgICBcIkB0YW5zdGFjay9xdWVyeS1jb3JlXCIsXHJcbiAgICAgIF0sXHJcbiAgICB9LFxyXG5cclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIC8vIFx1MjUwMFx1MjUwMCBTZWd1cmFuXHUwMEU3YTogc2VtIHNvdXJjZSBtYXBzIGVtIHByb2R1XHUwMEU3XHUwMEUzbyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgICAgLy8gU291cmNlIG1hcHMgZXhwXHUwMEY1ZW0gbyBjXHUwMEYzZGlnby1mb250ZSBvcmlnaW5hbCBhbyBicm93c2VyLCBmYWNpbGl0YW5kb1xyXG4gICAgICAvLyBhIGVuZ2VuaGFyaWEgcmV2ZXJzYSBkYSBhcGxpY2FcdTAwRTdcdTAwRTNvIHBvciB0ZXJjZWlyb3MuXHJcbiAgICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcblxyXG4gICAgICAvLyBcdTI1MDBcdTI1MDAgTWluaWZpY2FcdTAwRTdcdTAwRTNvIGFncmVzc2l2YSBwYXJhIGRpZmljdWx0YXIgbGVpdHVyYSBkbyBidW5kbGUgXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHUyNTAwXHJcbiAgICAgIG1pbmlmeTogXCJlc2J1aWxkXCIsXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFx1MjUwMFx1MjUwMCBlc2J1aWxkOiByZW1vdmUgdG9kb3Mgb3MgY29uc29sZS4qIG5vIGJ1aWxkIGRlIHByb2R1XHUwMEU3XHUwMEUzbyBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcdTI1MDBcclxuICAgIC8vIElzc28gZ2FyYW50ZSBxdWUgbmVuaHVtIGxvZyBzZW5zXHUwMEVEdmVsIChlbWFpbCwgZXJyb3MgZGUgYXV0aCwgZXRjLilcclxuICAgIC8vIGNoZWd1ZSBhbyBidW5kbGUgZmluYWwgaW5kZXBlbmRlbnRlbWVudGUgZGUgb25kZSBlc3RlamEgbm8gY1x1MDBGM2RpZ28uXHJcbiAgICBlc2J1aWxkOiBpc1Byb2RcclxuICAgICAgPyB7XHJcbiAgICAgICAgICBkcm9wOiBbXCJjb25zb2xlXCIsIFwiZGVidWdnZXJcIl0sXHJcbiAgICAgICAgICBsZWdhbENvbW1lbnRzOiBcIm5vbmVcIixcclxuICAgICAgICB9XHJcbiAgICAgIDoge30sXHJcbiAgfTtcclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNmIsU0FBUyxvQkFBb0I7QUFDMWQsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUNqQixTQUFTLHVCQUF1QjtBQUhoQyxJQUFNLG1DQUFtQztBQU16QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUN4QyxRQUFNLFNBQVMsU0FBUztBQUV4QixTQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixNQUFNO0FBQUEsTUFDTixLQUFLO0FBQUEsUUFDSCxTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBO0FBQUEsVUFFUixjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBRUEsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLGlCQUFpQixnQkFBZ0IsQ0FBQyxFQUFFLE9BQU8sT0FBTztBQUFBLElBRTlFLFNBQVM7QUFBQSxNQUNQLE9BQU87QUFBQSxRQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxNQUN0QztBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ047QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLFFBQ0E7QUFBQSxRQUNBO0FBQUEsUUFDQTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFFQSxPQUFPO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFJTCxXQUFXO0FBQUE7QUFBQSxNQUdYLFFBQVE7QUFBQSxJQUNWO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFLQSxTQUFTLFNBQ0w7QUFBQSxNQUNFLE1BQU0sQ0FBQyxXQUFXLFVBQVU7QUFBQSxNQUM1QixlQUFlO0FBQUEsSUFDakIsSUFDQSxDQUFDO0FBQUEsRUFDUDtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
