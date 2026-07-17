-- Menambahkan tabel users ke database yang sudah ada tanpa menghapus data transaksi.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash CHAR(64) NOT NULL,
    nama_lengkap VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_username_format CHECK (username ~ '^[A-Za-z0-9._-]+$'),
    CONSTRAINT users_password_hash_sha256 CHECK (password_hash ~ '^[A-Fa-f0-9]{64}$'),
    CONSTRAINT users_role_allowed CHECK (role IN ('admin'))
);

CREATE INDEX IF NOT EXISTS idx_users_active_username
    ON users (is_active, username);

CREATE OR REPLACE FUNCTION set_users_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_users_updated_at();

-- Contoh user admin.
-- Password wajib disimpan dalam bentuk hash SHA-256 64 karakter.
-- Ganti nilai password_hash berikut dengan hash password asli.
-- INSERT INTO users (username, password_hash, nama_lengkap)
-- VALUES ('admin', 'isikan_hash_sha256_64_karakter_di_sini', 'Administrator')
-- ON CONFLICT (username) DO NOTHING;
