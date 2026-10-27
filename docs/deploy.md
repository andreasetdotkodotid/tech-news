# Deployment manual VPS

## Prasyarat

1. Arahkan DNS `news.dotko.id` ke IP VPS. Instal Docker Engine + Compose, Nginx, Certbot, dan UFW.
2. Firewall: `ufw allow 80/tcp`, `ufw allow 443/tcp`, batasi SSH pada IP admin (`ufw allow from <IP_ADMIN> to any port 22`), kemudian `ufw enable`. Jangan membuka PostgreSQL atau port 4321 publik.
3. Login registry memakai token minimum privilege: `docker login <registry>`.

## Instalasi

```bash
sudo mkdir -p /opt/tech-news/backups
sudo chown -R $USER:$USER /opt/tech-news
cd /opt/tech-news
cp .env.example .env
```

Isi `.env` dengan password PostgreSQL yang kuat, URL produksi, dan tag immutable:

```dotenv
IMAGE=ghcr.io/ORG/tech-security-news
IMAGE_TAG=<commit-sha-atau-versi>
BACKUP_HOST_DIR=/opt/tech-news/backups
```

Salin `docker-compose.yml`, `database/`, dan `.env.example` dari rilis. Pull, migrasikan dari image, seed, dan jalankan:

```bash
docker compose pull
docker compose run --rm web node --import tsx scripts/migrate.ts
docker compose run --rm web node --import tsx scripts/seed.ts
docker compose up -d
docker compose ps
docker compose logs -f web worker
```

## Nginx dan TLS

Salin `deploy/nginx/news.dotko.id.conf` ke `/etc/nginx/sites-available/news.dotko.id`, symlink ke `sites-enabled`, lalu sebelum TLS comment dua direktif `ssl_certificate*`. Jalankan `sudo nginx -t && sudo systemctl reload nginx`; terbitkan sertifikat `sudo certbot --nginx -d news.dotko.id`. Test ulang Nginx dan akses `/tech-and-security/`. Certbot memasang renewal timer otomatis.

## Verifikasi

`docker compose ps` harus menampilkan healthcheck web/postgres sehat. Gunakan `docker compose logs --tail=200 worker` untuk status sinkronisasi, dan `docker compose exec postgres psql -U technews -d technews -c 'select * from sync_runs order by id desc limit 10'` untuk memeriksa run.

## Backup dan restore

Container backup membuat dump format custom sekali per hari pada `BACKUP_HOST_DIR` dan menghapus file lebih lama dari `BACKUP_RETENTION_DAYS` (default 14). Salin backup ke penyimpanan off-host. Restore: hentikan web/worker, lalu `docker compose exec -T postgres pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists < backups/technews-YYYY-MM-DD.dump`, kemudian `docker compose up -d`.

## Update dan rollback

Sebelum update: buat backup, ganti `IMAGE_TAG` ke tag immutable baru, `docker compose pull`, jalankan migrasi, lalu `docker compose up -d` dan smoke-test halaman serta logs. Untuk rollback, set tag lama dan restart. Bila migration bermasalah, restore backup yang dibuat sebelum migration lalu gunakan image lama. Rotasi secret dengan ubah `.env`, restart services, dan amankan file (`chmod 600 .env`).

## Troubleshooting

Gunakan `docker compose logs --tail=200 <web|worker|postgres>`, `docker compose exec postgres pg_isready`, `curl -I http://127.0.0.1:4321/tech-and-security/`, dan `sudo nginx -t`. Pastikan URL feed masih resmi dan patuhi rate limit/TOS sumber.
