import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === "production";

  return {
    server: {
      host: true,
      port: 8080,
      hmr: {
        overlay: false,
      },
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          // Em produção, a URL seria https://mergulho-connect-eh6j.onrender.com
          changeOrigin: true,
        },
      },
    },

    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },

    build: {
      // ── Segurança: sem source maps em produção ──────────────────────────────
      // Source maps expõem o código-fonte original ao browser, facilitando
      // a engenharia reversa da aplicação por terceiros.
      sourcemap: false,

      // ── Minificação agressiva para dificultar leitura do bundle ─────────────
      minify: "esbuild",
    },

    // ── esbuild: remove todos os console.* no build de produção ─────────────
    // Isso garante que nenhum log sensível (email, erros de auth, etc.)
    // chegue ao bundle final independentemente de onde esteja no código.
    esbuild: isProd
      ? {
          drop: ["console", "debugger"],
          legalComments: "none",
        }
      : {},
  };
});
