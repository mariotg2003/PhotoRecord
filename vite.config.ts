import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [react()],
    define: {
      "import.meta.env.suprl": env.suprl ? JSON.stringify(env.suprl) : "undefined",
      "import.meta.env.sup": env.sup ? JSON.stringify(env.sup) : "undefined",
    },
  };
});
