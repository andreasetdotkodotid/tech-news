# Deployment manual VPS

## Prasyarat

1. Arahkan DNS `news.dotko.id` ke IP VPS. Instal Docker Engine dan Docker Compose plugin. Jalankan Nginx sebagai container pada Compose terpisah bila diperlukan.
2. Firewall: buka hanya `80/tcp` dan `443/tcp`; batasi SSH ke IP administrator. Jangan membuka PostgreSQL atau `4321` ke internet.
3. Login Docker Hub dengan token minimum privilege: `docker login`.
4. Buat network reverse-proxy external sekali saja: `docker network create proxy`. Network ini tidak dihapus oleh `docker compose down` aplikasi.

## Instalasi aplikasi

```bash
sudo mkdir -p /opt/tech-news/backups
sudo chown -R $USER:$USER /opt/tech-news
cd /opt/tech-news
cp .env.example .env
chmod 600 .env
```

Isi `.env` dengan password PostgreSQL kuat, URL produksi, image, dan tag immutable:

```dotenv
IMAGE=dotkodotid/tehc-news
IMAGE_TAG=<commit-sha>
BACKUP_HOST_DIR=/opt/tech-news/backups
NVD_LOOKBACK_DAYS=30
NVD_RESULTS_PER_PAGE=100
NVD_TIMEOUT_MS=60000
```

Jangan gunakan `latest` sebagai satu-satunya tag production. Salin `docker-compose.yml`, `database/`, dan `.env.example`, lalu jalankan:

```bash
docker compose pull
docker compose run --rm worker node --import tsx scripts/migrate.ts
docker compose run --rm worker node --import tsx scripts/seed.ts
docker compose up -d
docker compose ps
```

## Nginx container

Pada Compose Nginx, hubungkan service Nginx ke external network yang sama:

```yaml
services:
  nginx:
    networks: [proxy]
networks:
  proxy:
    external: true
```

Aplikasi juga menghubungkan service `web` ke `proxy`. Gunakan `proxy_pass http://web:4321;` dari `deploy/nginx/news.dotko.id.conf`; Docker DNS akan menerjemahkan `web` ke container aplikasi. Jangan gunakan `127.0.0.1:4321` dari dalam container Nginx karena itu menunjuk ke container Nginx sendiri.

Setelah perubahan Compose, gunakan `docker compose up -d` pada masing-masing project. Perintah tersebut me-recreate hanya service yang konfigurasinya berubah. Jangan gunakan `restart` untuk menerapkan perubahan network. `docker compose down` aplikasi aman karena `proxy` external, tetapi jangan gunakan `down -v` karena dapat menghapus volume PostgreSQL.

Di Nginx, redirect HTTP ke HTTPS dan proxy subpath `/tech-and-security/`. Sertifikat TLS dapat diterbitkan dengan Certbot sesuai metode container/host yang dipakai. Uji konfigurasi Nginx lalu lakukan reload container Nginx.

## Sinkronisasi dan CVE

Worker mengambil RSS resmi dan NVD CVE API setiap hari pukul 00:01 Asia/Jakarta dengan fallback enam jam. Untuk sync manual:

```bash
docker compose exec worker node --import tsx apps/worker/src/index.ts sync
docker compose logs --tail=200 worker
```

NVD memakai 30 hari terakhir secara default. Jika respons timeout, gunakan `NVD_RESULTS_PER_PAGE=100` atau lebih kecil dan `NVD_TIMEOUT_MS=60000` di `.env`, lalu `docker compose up -d worker`. Data yang disimpan hanya ID/judul CVE, URL NVD, tanggal, sumber, dan kategori; tidak ada isi artikel lengkap atau scraping.

## Verifikasi

```bash
docker compose ps
docker compose logs --tail=200 web worker
docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c 'SELECT status, articles_seen, articles_added, error_message FROM sync_runs ORDER BY id DESC LIMIT 20;'
curl -I http://127.0.0.1:4321/tech-and-security/
```

Jika Nginx berada dalam container, uji juga resolusi upstream dari container tersebut: `getent hosts web`. Untuk 502, cek log Nginx dan `docker compose logs --tail=100 web`; pastikan kedua container terhubung ke network `proxy`.

## Backup dan restore

Container backup membuat dump PostgreSQL custom setiap hari pada `BACKUP_HOST_DIR` dan menghapus file lebih lama dari `BACKUP_RETENTION_DAYS` (default 14). Salin backup ke penyimpanan off-host. Restore: hentikan `web` dan `worker`, lalu jalankan `docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backups/technews-YYYY-MM-DD.dump`, kemudian `docker compose up -d`.

## Update, rollback, dan rotasi secret

Sebelum update, buat backup. Ubah `IMAGE_TAG` ke tag immutable baru, lalu `docker compose pull`, jalankan migration, `docker compose up -d`, dan lakukan smoke test. Untuk rollback, set tag immutable sebelumnya lalu `docker compose pull && docker compose up -d`. Jika migration bermasalah, restore backup pra-migration dan gunakan image lama. Rotasi secret dengan ubah `.env`, jaga `chmod 600 .env`, lalu recreate service terkait dengan `docker compose up -d`.
