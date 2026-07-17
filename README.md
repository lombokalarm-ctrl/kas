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
- `deploy/Caddyfile`
- `.env.production.example`

Arsitektur deploy:

- `app`: container Node.js untuk API + frontend production
- `db`: PostgreSQL
- `caddy`: reverse proxy + SSL otomatis Let's Encrypt

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
LETSENCRYPT_EMAIL=admin@apli.my.id
POSTGRES_DB=kas
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password_yang_kuat
```

### 4. Jalankan Docker Compose

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

### 5. Cek Status Container

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

Jika DNS sudah mengarah benar dan port `80/443` terbuka, Caddy akan otomatis menerbitkan SSL dan aplikasi bisa diakses di:

- `https://kas.apli.my.id`

## Catatan Production

- File `db/kas.sql` otomatis dijalankan saat volume database pertama kali dibuat.
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
- `db/sample-data.sql`: contoh data opsional
- `docker-compose.prod.yml`: stack production VPS
- `deploy/Caddyfile`: reverse proxy domain + SSL
- `api/app.ts`: Express app + static frontend serving
