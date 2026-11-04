// Copies Three.js and GSAP + ScrollTrigger ESM builds from _dev/node_modules
// into the deployed /_astro/ folder so they are served as first-party static ES modules.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const ASTRO = path.join(ROOT, '_astro');
const NM = path.join(ROOT, '_dev', 'node_modules');

// 1. Three.js (combined self-contained ES module: three.core.min.js + three.module.min.js)
// three.module.min.js imports from './three.core.js' — we copy both and keep the relative import clean.
const threeCore = fs.readFileSync(path.join(NM, 'three', 'build', 'three.core.min.js'), 'utf8');
let threeMod = fs.readFileSync(path.join(NM, 'three', 'build', 'three.module.min.js'), 'utf8');
threeMod = threeMod.replace(/from\s*["']\.\/three\.core\.js["']/g, 'from"./three.core.min.js"');
fs.writeFileSync(path.join(ASTRO, 'three.core.min.js'), threeCore);
fs.writeFileSync(path.join(ASTRO, 'three.module.min.js'), threeMod);

// 2. GSAP + ScrollTrigger ES modules
const gsapCore = fs.readFileSync(path.join(NM, 'gsap', 'index.js'), 'utf8');
// Rather than multi-file unminified imports, bundle or copy gsap/dist UMD wrapped as ESM,
// OR copy gsap's ESM files. Let's inspect gsap's package structure or wrap gsap.min.js + ScrollTrigger.min.js cleanly as ESM.
const gsapMin = fs.readFileSync(path.join(NM, 'gsap', 'dist', 'gsap.min.js'), 'utf8');
const stMin = fs.readFileSync(path.join(NM, 'gsap', 'dist', 'ScrollTrigger.min.js'), 'utf8');

const gsapEsm = `${gsapMin}
const gsap = globalThis.gsap;
export { gsap, gsap as default };
`;
const stEsm = `import { gsap } from "./gsap.esm.js";
${stMin}
const ScrollTrigger = globalThis.ScrollTrigger;
gsap.registerPlugin(ScrollTrigger);
export { ScrollTrigger, ScrollTrigger as default };
`;
fs.writeFileSync(path.join(ASTRO, 'gsap.esm.js'), gsapEsm);
fs.writeFileSync(path.join(ASTRO, 'scrolltrigger.esm.js'), stEsm);

console.log('✓ Vendor modules written to _astro/: three.core.min.js, three.module.min.js, gsap.esm.js, scrolltrigger.esm.js');
