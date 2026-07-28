-- Menambahkan dukungan users, role, dan catatan edit transaksi ke database yang sudah ada.

CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash CHAR(64) NOT NULL,
    nama_lengkap VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'staff',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT users_username_format CHECK (username ~ '^[A-Za-z0-9._-]+$'),
    CONSTRAINT users_password_hash_sha256 CHECK (password_hash ~ '^[A-Fa-f0-9]{64}$'),
    CONSTRAINT users_role_allowed CHECK (role IN ('staff', 'admin', 'owner'))
);

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS nama_lengkap VARCHAR(100),
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'staff',
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_allowed;
ALTER TABLE users
    ADD CONSTRAINT users_role_allowed CHECK (role IN ('staff', 'admin', 'owner'));

CREATE INDEX IF NOT EXISTS idx_users_active_username
    ON users (is_active, username);

INSERT INTO users (username, password_hash, nama_lengkap, role, is_active)
VALUES (
    'owner',
    '43a0d17178a9d26c9e0fe9a74b0b45e38d32f27aed887a008a54bf6e033bf7b9',
    'Owner Default',
    'owner',
    TRUE
)
ON CONFLICT (username) DO NOTHING;

ALTER TABLE kas_transaksi
    ADD COLUMN IF NOT EXISTS catatan_edit TEXT,
    ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS edited_by_user_id BIGINT REFERENCES users (id) ON DELETE SET NULL;

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
-- INSERT INTO users (username, password_hash, nama_lengkap, role)
-- VALUES ('owner2', 'isikan_hash_sha256_64_karakter_di_sini', 'Pemilik', 'owner')
-- ON CONFLICT (username) DO NOTHING;
