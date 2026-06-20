const expoConfig = require("eslint-config-expo/flat");

module.exports = [
  ...expoConfig,
  {
    // supabase/functions runs on Deno (npm: specifiers, Deno globals) — not the app's tsconfig.
    ignores: ["dist/**", "coverage/**", "node_modules/**", "supabase/functions/**"]
  }
];
