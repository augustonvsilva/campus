// Ajustes no site exportado (dist/) para publicar no GitHub Pages:
//  • tags de prévia de link (WhatsApp, Instagram, iMessage) e de instalação (PWA, ícone na tela inicial);
//  • 404.html = index.html, para rotas internas abrirem ao recarregar a página;
//  • .nojekyll, para o GitHub Pages servir as pastas que começam com "_".
// Uso: node scripts/web-postbuild.mjs [pasta=dist]
// Variáveis: EXPO_BASE_URL (ex.: /campus) e SITE_URL (endereço público completo, para a imagem da prévia).
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const base = (process.env.EXPO_BASE_URL ?? '').replace(/\/$/, '');
const site = (process.env.SITE_URL ?? '').replace(/\/$/, '');
const title = 'Campus · onde a vida universitária acontece';
const description = 'Rede de estudantes: rolês, eventos, Bora?, saídas e comunidades da sua universidade. Acesso por convite.';

for (const f of ['manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'og.png']) {
  if (!existsSync(join(dist, f))) throw new Error(`faltou ${f} em ${dist}/ (a pasta public/ é copiada pelo expo export)`);
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const tags = [
  `<meta name="description" content="${esc(description)}">`,
  '<meta name="theme-color" content="#111318">',
  `<link rel="manifest" href="${base}/manifest.webmanifest">`,
  `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`,
  '<meta name="apple-mobile-web-app-capable" content="yes">',
  '<meta name="mobile-web-app-capable" content="yes">',
  '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
  '<meta name="apple-mobile-web-app-title" content="Campus">',
  '<meta property="og:type" content="website">',
  '<meta property="og:locale" content="pt_BR">',
  '<meta property="og:site_name" content="Campus">',
  `<meta property="og:title" content="${esc(title)}">`,
  `<meta property="og:description" content="${esc(description)}">`,
  site ? `<meta property="og:url" content="${site}/">` : '',
  site ? `<meta property="og:image" content="${site}/og.png">` : '',
  '<meta property="og:image:width" content="1200">',
  '<meta property="og:image:height" content="630">',
  '<meta name="twitter:card" content="summary_large_image">',
].filter(Boolean).join('\n    ');

const indexPath = join(dist, 'index.html');
let html = readFileSync(indexPath, 'utf8');
if (!html.includes('rel="manifest"')) {
  html = html.replace(/<\/head>/i, `    ${tags}\n  </head>`);
  html = html.replace(/<html(\s[^>]*)?>/i, (m) => (/\blang=/.test(m) ? m.replace(/lang="[^"]*"/, 'lang="pt-BR"') : m.replace('<html', '<html lang="pt-BR"')));
  writeFileSync(indexPath, html);
}
copyFileSync(indexPath, join(dist, '404.html'));
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`ok: prévia de link, PWA, 404.html e .nojekyll em ${dist}/ (base "${base || '/'}", site "${site || 'sem URL pública'}")`);
