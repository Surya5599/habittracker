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

if (lines.length === 0) {
  console.warn('[write-env] No SUPABASE_URL/SUPABASE_ANON_KEY found in process.env — skipping .env write.');
  process.exit(0);
}

fs.writeFileSync(path.join(__dirname, '..', '.env'), lines.join('\n') + '\n');
console.log(`[write-env] Wrote .env with: ${vars.filter((n) => process.env[n]).join(', ')}`);
