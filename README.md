# Kas

Aplikasi pencatatan kas sederhana berbasis React, Express, dan PostgreSQL.

## Fitur

- Input transaksi kas masuk dan keluar
- Perhitungan saldo otomatis di PostgreSQL
- Filter transaksi berdasarkan tanggal
- Format tanggal `dd-mm-yyyy`
- Format nominal dengan pemisah ribuan titik

## Stack

- Frontend: React + Vite + TypeScript
- Backend: Express + TypeScript
- Database: PostgreSQL
- Deployment VPS: Docker Compose + Caddy + Let's Encrypt

## Menjalankan Lokal

1. Salin file environment:

```bash
cp .env.example .env
```

2. Sesuaikan isi `.env`:

```env
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kas
DB_USER=postgres
DB_PASSWORD=your_password
```

3. Jalankan SQL schema:

```bash
psql -U postgres -d kas -f db/kas.sql
```

4. Jalankan aplikasi:

```bash
npm install
npm run dev
```

## Build Production

```bash
npm install
npm run build
npm run start
```

Server production akan berjalan di port `3001` dan otomatis menyajikan frontend hasil build dari folder `dist`.

## Deploy Ke VPS Dengan Docker

Konfigurasi yang sudah disiapkan:

- `Dockerfile`
- `docker-compose.prod.yml`
- `docker-compose.vps.yml`
- `deploy/Caddyfile`
- `deploy/nginx/kas.apli.my.id.conf`
- `.env.production.example`

Arsitektur deploy umum:

- `app`: container Node.js untuk API + frontend production
- `db`: PostgreSQL
- `caddy`: reverse proxy + SSL otomatis Let's Encrypt

### Opsi A: VPS Baru / Dedicated

Gunakan file berikut bila VPS belum punya reverse proxy lain dan port `80/443` masih kosong:

- `docker-compose.prod.yml`

### Opsi B: VPS Existing Dengan Nginx Host

Gunakan file berikut bila VPS sudah punya banyak website dan `nginx` host sudah memakai port `80/443`:

- `docker-compose.vps.yml`

Pada mode ini:

- container `kas-app` hanya bind ke `127.0.0.1:${APP_PORT_HOST}`
- tidak ada container `caddy`
- domain `kas.apli.my.id` diarahkan melalui `nginx` host
- untuk VPS saat ini, port yang direkomendasikan adalah `3012`

### 1. Siapkan DNS

Arahkan domain `kas.apli.my.id` ke IP VPS:

- `A record` -> `IP_VPS`

Pastikan port berikut terbuka di VPS:

- `80`
- `443`

### 2. Clone Repo Di VPS

```bash
git clone https://github.com/lombokalarm-ctrl/kas.git
cd kas
```

### 3. Siapkan Environment Production

```bash
cp .env.production.example .env.production
```

Contoh isi `.env.production`:

```env
APP_DOMAIN=kas.apli.my.id
APP_PORT_HOST=3012
LETSENCRYPT_EMAIL=admin@apli.my.id
POSTGRES_DB=kas
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password_yang_kuat
```

### 4. Jalankan Docker Compose

Untuk VPS baru / dedicated:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Untuk VPS existing dengan `nginx` host:

```bash
docker compose --env-file .env.production -f docker-compose.vps.yml up -d --build
```

### 5. Cek Status Container

```bash
docker compose --env-file .env.production -f docker-compose.vps.yml ps
docker compose --env-file .env.production -f docker-compose.vps.yml logs -f
```

Jika memakai mode VPS baru / dedicated, Caddy akan otomatis menerbitkan SSL.

Jika memakai mode VPS existing dengan `nginx` host, tambahkan konfigurasi site:

```bash
cp deploy/nginx/kas.apli.my.id.conf /etc/nginx/sites-available/kas.apli.my.id.conf
ln -s /etc/nginx/sites-available/kas.apli.my.id.conf /etc/nginx/sites-enabled/kas.apli.my.id.conf
nginx -t
systemctl reload nginx
```

Setelah itu aktifkan SSL sesuai pola yang sudah Anda pakai di server.

Aplikasi bisa diakses di:

- `https://kas.apli.my.id`

## Catatan Production

- File `db/kas.sql` otomatis dijalankan saat volume database pertama kali dibuat.
- Untuk database yang sudah terlanjur berjalan, gunakan `db/add-users-table.sql` bila ingin menambah tabel `users` tanpa reset volume.
- Data PostgreSQL disimpan di volume Docker `kas-postgres-data`.
- SSL certificate disimpan di volume `caddy-data`.
- `.env` dan file lokal sensitif tidak ikut ke Git karena sudah di-ignore.

## Update Deployment

Jika ada perubahan kode baru:

```bash
git pull
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

## File Penting

- `db/kas.sql`: schema database kas
- `db/add-users-table.sql`: penambahan tabel `users` untuk database existing
- `db/sample-data.sql`: contoh data opsional
- `docker-compose.prod.yml`: stack production VPS dedicated
- `docker-compose.vps.yml`: stack production aman untuk VPS existing dengan `nginx` host
- `deploy/Caddyfile`: reverse proxy domain + SSL
- `deploy/nginx/kas.apli.my.id.conf`: contoh reverse proxy `nginx` host ke `kas-app`
- `api/app.ts`: Express app + static frontend serving
