#!/usr/bin/env node
// Merge scripts/locale-additions.json into src/locales/*.json.
//
// Additive and idempotent: an existing translation is never overwritten, so running
// this again after hand-editing a locale is safe. Run with --check to fail instead of
// writing, which is what CI would want.

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'locales');
const additions = JSON.parse(fs.readFileSync(path.join(__dirname, 'locale-additions.json'), 'utf8'));
const checkOnly = process.argv.includes('--check');

const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v);

// Returns [merged, addedKeyPaths]
const mergeMissing = (target, source, prefix = '') => {
    const added = [];
    const out = { ...target };
    for (const [key, value] of Object.entries(source)) {
        const dotted = prefix ? `${prefix}.${key}` : key;
        if (isPlain(value)) {
            const [child, childAdded] = mergeMissing(isPlain(out[key]) ? out[key] : {}, value, dotted);
            out[key] = child;
            added.push(...childAdded);
        } else if (out[key] === undefined) {
            out[key] = value;
            added.push(dotted);
        }
    }
    return [out, added];
};

let totalAdded = 0;
for (const [lang, tree] of Object.entries(additions)) {
    const file = path.join(localesDir, `${lang}.json`);
    if (!fs.existsSync(file)) {
        console.error(`  ${lang}: no locale file, skipped`);
        continue;
    }
    const current = JSON.parse(fs.readFileSync(file, 'utf8'));
    const [merged, added] = mergeMissing(current, tree);
    totalAdded += added.length;
    console.log(`  ${lang}: +${added.length}`);
    if (!checkOnly && added.length > 0) {
        fs.writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
    }
}

if (checkOnly && totalAdded > 0) {
    console.error(`\n${totalAdded} translations missing from locale files. Run: node scripts/merge-locales.js`);
    process.exit(1);
}
console.log(`\n${checkOnly ? 'would add' : 'added'} ${totalAdded} keys`);
