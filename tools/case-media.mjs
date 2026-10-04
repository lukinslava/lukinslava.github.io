// Готовит медиа для страницы кейса AI Match: открытые файлы копирует как есть,
// кадры внутреннего продукта шифрует (AES-GCM, ключ из пароля через PBKDF2).
// Пароль берётся из CASE_PASSWORD и нигде не сохраняется — в репозиторий едут
// только шифртексты и manifest.json с солью и векторами.
//
// Запуск: CASE_PASSWORD='…' node tools/case-media.mjs [путь-к-media] [путь-к-posters]
// Результат лежит в tools/case/media/ и копируется сборкой в docs/assets/case/.
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = process.argv[2] || "/Users/slava/Documents/auf-match-portfolio/media";
const POSTERS = process.argv[3] || "/Users/slava/folio/prototypes/auf-case/posters";
const OUT = path.resolve("tools/case/media/ai-match");
const PASSWORD = process.env.CASE_PASSWORD;
const ITERATIONS = 600_000;

// Открыто без пароля: схемы и публичная часть продукта («Прожарочная»).
export const OPEN = [
  "02-pain-funnel.mp4",
  "03-principles-funnel.png",
  "05-public-flow.mp4",
  "05-public-form-phone.png",
  "05-public-result-desktop.png",
  "05-public-result-phone.png",
  "05-public-wait-phone.png",
];
// Под паролем: всё, где виден внутренний интерфейс.
export const LOCKED = [
  "01-hero.mp4",
  "03-principles-data-match.png",
  "03-principles-human-in-loop.png",
  "04-candidate-overview.png",
  "04-candidate-portfolio.png",
  "04-client-shortlist.png",
  "04-match.mp4",
  "04-pipeline-board.png",
  "04-recruiter-dashboard.png",
  "04-vacancy-from-text.mp4",
  "07-detail-approve.mp4",
  "07-detail-click.mp4",
  "07-detail-filters.mp4",
  "07-detail-reject.mp4",
  "07-detail-stage-menu.mp4",
  "07-detail-weights.mp4",
];
// Постеры роликов — тоже кадры продукта, поэтому шифруются вместе с ними.
const LOCKED_POSTERS = [
  "04-match.jpg",
  "04-vacancy-from-text.jpg",
  "07-detail-approve.jpg",
  "07-detail-click.jpg",
  "07-detail-filters.jpg",
  "07-detail-reject.jpg",
  "07-detail-stage-menu.jpg",
  "07-detail-weights.jpg",
];
const POSTER_OPEN = ["05-public-flow.jpg"];

const TYPES = { ".mp4": "video/mp4", ".png": "image/png", ".jpg": "image/jpeg", ".gif": "image/gif" };

if (!PASSWORD) {
  console.error("CASE_PASSWORD is not set — nothing to encrypt with");
  process.exit(1);
}

const key = crypto.pbkdf2Sync(PASSWORD, Buffer.alloc(0), 1, 1, "sha256"); // прогрев, чтобы не мерить первый вызов
const salt = crypto.randomBytes(16);
console.time("key");
const derived = crypto.pbkdf2Sync(PASSWORD, salt, ITERATIONS, 32, "sha256");
console.timeEnd("key");

function encrypt(buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", derived, iv);
  const data = Buffer.concat([c.update(buf), c.final(), c.getAuthTag()]);
  return { iv: iv.toString("base64"), data };
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

let open = 0;
for (const [dir, names] of [[SRC, OPEN], [POSTERS, POSTER_OPEN]]) {
  for (const name of names) {
    await fs.copyFile(path.join(dir, name), path.join(OUT, name));
    open++;
  }
}

const files = {};
let bytes = 0;
for (const [dir, names] of [[SRC, LOCKED], [POSTERS, LOCKED_POSTERS]]) {
  for (const name of names) {
    const buf = await fs.readFile(path.join(dir, name));
    const { iv, data } = encrypt(buf);
    const key = dir === POSTERS ? `poster/${name}` : name;
    await fs.writeFile(path.join(OUT, `${key.replace("/", "-")}.enc`), data);
    files[key] = { file: `${key.replace("/", "-")}.enc`, iv, type: TYPES[path.extname(name)] ?? "application/octet-stream" };
    bytes += data.length;
  }
}

// Контрольный блок: по нему страница понимает, что пароль верный, не скачивая
// ни одного тяжёлого файла
const check = encrypt(Buffer.from("ai-match"));
const manifest = {
  v: 1,
  kdf: { name: "PBKDF2", hash: "SHA-256", iterations: ITERATIONS, salt: salt.toString("base64") },
  check: { iv: check.iv, data: check.data.toString("base64") },
  files,
};
await fs.writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1));

console.log(`open: ${open} files · locked: ${Object.keys(files).length} files, ${(bytes / 1e6).toFixed(1)} MB → ${path.relative(process.cwd(), OUT)}`);
