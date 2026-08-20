// EAS Build's cloud archive respects .gitignore, so mobile/.env (gitignored) never
// reaches the build container. This hook (run via the eas-build-pre-install npm
// script) writes it from EAS-injected environment variables instead, so
// react-native-dotenv has a real .env file to read from during bundling.
const fs = require('fs');
const path = require('path');

const vars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const lines = vars
  .filter((name) => process.env[name])
  .map((name) => `${name}=${process.env[name]}`);

const missing = vars.filter((name) => !process.env[name]);
if (missing.length > 0) {
  // Fail the build rather than ship a binary with no backend: react-native-dotenv would
  // inline `undefined`, createClient would throw, and the app would crash on launch —
  // which reads to App Review as a broken app, not a misconfigured build.
  console.error(`[write-env] Missing required build env: ${missing.join(', ')}. Set them on the EAS build profile or as project secrets.`);
  process.exit(1);
}

fs.writeFileSync(path.join(__dirname, '..', '.env'), lines.join('\n') + '\n');
console.log(`[write-env] Wrote .env with: ${vars.filter((n) => process.env[n]).join(', ')}`);
