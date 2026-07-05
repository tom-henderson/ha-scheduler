import { nodeResolve } from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/daily-schedule-card.ts",
  output: {
    // Emit straight into the integration so a single HACS "integration"
    // install ships the card, which the component auto-registers as a
    // frontend resource.
    file: "../custom_components/daily_schedule/frontend/daily-schedule-card.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    nodeResolve(),
    typescript({ tsconfig: "./tsconfig.json" }),
    terser({ format: { comments: false } }),
  ],
};
