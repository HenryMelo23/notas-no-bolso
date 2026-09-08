import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.com.afinadorlivre.app",
  appName: "Notas no Bolso",
  webDir: "dist",
  android: { adjustMarginsForEdgeToEdge: "auto" },
  server: {
    androidScheme: "https",
  },
};

export default config;
