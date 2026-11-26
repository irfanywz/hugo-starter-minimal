// Cek sebelum publish:  npm run check
// Build CSS, build Hugo (production) ke folder sementara, lalu periksa index.html:
// ada <title>, CSS dan JS ter-load, tidak ada tautan internal rusak atau sisa error template.
// Opsi: --skip-css   lewati `npm run build`
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export function inspect(dir) {
    const file = path.join(dir, 'index.html');
    if (!existsSync(file)) return ['index.html tidak ada: build gagal?'];

    const html = readFileSync(file, 'utf8');
    const problems = [];
    if (/ZgotmplZ|<no value>|%!\(|\[error calling/.test(html)) problems.push('index.html: ada sisa error template');
    if (!/<title>\s*\S[\s\S]*?<\/title>/i.test(html)) problems.push('index.html: <title> kosong');
    if (!/<html[^>]*\slang=/i.test(html)) problems.push('index.html: <html> tanpa atribut lang');

    const urls = [...html.matchAll(/\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi)]
        .map((m) => m[1] ?? m[2] ?? m[3])
        .filter((u) => u.startsWith('/') && !u.startsWith('//'));
    const resolve = (u) => {
        const clean = u.split('#')[0].split('?')[0];
        return path.join(dir, clean.endsWith('/') ? `${clean}index.html` : clean);
    };

    const css = urls.find((u) => u.endsWith('.css'));
    const js = urls.find((u) => u.endsWith('.js'));
    if (!css) problems.push('CSS tidak ditemukan di index.html (sudah `npm run build`?)');
    else if (existsSync(resolve(css)) && statSync(resolve(css)).size < 500) problems.push('CSS terlalu kecil: Tailwind mungkin tidak menemukan class');
    if (!js) problems.push('bundle JS (Alpine) tidak ditemukan di index.html');
    for (const u of new Set(urls)) {
        if (!existsSync(resolve(u))) problems.push(`tautan rusak → ${u}`);
    }
    return problems;
}

function main() {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const skipCss = process.argv.includes('--skip-css');

    if (!skipCss) {
        console.log('• Build CSS Tailwind ...');
        if (spawnSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit', shell: true }).status !== 0) {
            console.error('❌ Build CSS gagal. Sudah menjalankan `npm install`?');
            process.exit(1);
        }
    }

    const version = spawnSync('hugo', ['version'], { encoding: 'utf8' });
    if (version.error || version.status !== 0) {
        console.error('❌ Hugo tidak ditemukan di PATH. Pasang Hugo extended (versi di GitHub Actions: 0.164.0).');
        process.exit(1);
    }
    console.log(`• ${version.stdout.trim()}`);

    const out = mkdtempSync(path.join(tmpdir(), 'hugo-check-'));
    console.log('• Build Hugo (production, ke folder sementara) ...');
    const build = spawnSync('hugo', ['--gc', '--environment', 'production', '--baseURL', 'http://localhost/', '--destination', out], { cwd: root, encoding: 'utf8' });
    const lines = `${build.stdout ?? ''}${build.stderr ?? ''}`.split(/\r?\n/);
    const warnings = lines.filter((l) => /\bWARN\b/.test(l));
    [...lines.filter((l) => /\bERROR\b/.test(l)), ...warnings].forEach((l) => console.log(`  ${l}`));

    let failed = build.status !== 0;
    if (failed) {
        console.error('❌ Build Hugo gagal.');
    } else {
        if (warnings.length) console.log(`⚠️  ${warnings.length} peringatan Hugo (lihat di atas).`);
        const problems = inspect(out);
        problems.forEach((p) => console.log(`  ✖ ${p}`));
        failed = problems.length > 0;
    }
    rmSync(out, { recursive: true, force: true });

    console.log(failed ? '\n❌ Ada yang perlu diperbaiki sebelum publish.' : '\n✅ Aman untuk publish.');
    process.exit(failed ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
