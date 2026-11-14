// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Edge Functions rodam no Deno (Supabase), fora do bundle do app.
    ignores: ['dist/*', 'supabase/functions/**'],
  },
]);
