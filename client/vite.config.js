import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Това ще накара сървъра да слуша на всички интерфейси
    port: 5173, // Можеш да смениш порта, ако желаеш
  },
});
