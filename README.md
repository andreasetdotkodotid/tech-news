# Tech & Security News

Aggregator metadata/link berita untuk system administrator di `https://news.dotko.id/tech-and-security/`. Aplikasi tidak mengunduh atau menyimpan isi artikel; hanya judul, URL canonical, tanggal, sumber, dan kategori.

## Lokal

```bash
cp .env.example .env
npm install
npm run db:migrate && npm run db:seed
npm run dev
```

Jalankan `npm run test`, `npm run lint`, `npm run typecheck`, dan `npm run build` sebelum rilis. Worker memakai RSS/API resmi, timeout, retry exponential backoff, deduplikasi URL/hash, dan jadwal `Asia/Jakarta` pukul 00:01 plus fallback 6 jam.

## Operasi

Lihat panduan VPS, backup/restore, update, rollback, Nginx, TLS, dan firewall di [docs/deploy.md](docs/deploy.md). Tambahkan atau nonaktifkan feed lewat tabel `sources`; provider `XApiProvider` adalah extension point untuk API X resmi, bukan scraping.

## Image dan CI

CI membangun tag SHA serta `latest`; image dipush hanya setelah seluruh checks lulus dan hanya setelah `REGISTRY_IMAGE` serta secrets registry disetel. Production harus memakai `IMAGE_TAG` immutable, bukan hanya `latest`. Remote GitHub dan registry belum dikonfigurasi; jangan push sebelum URL remote, branch target, namespace image, dan kredensial diberikan.
