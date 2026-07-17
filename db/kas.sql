-- Skema pencatatan kas sederhana untuk PostgreSQL.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'kas_jenis'
    ) THEN
        CREATE TYPE kas_jenis AS ENUM ('masuk', 'keluar');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS kas_transaksi (
    id BIGSERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    hari VARCHAR(10) NOT NULL,
    keterangan TEXT NOT NULL,
    jenis kas_jenis NOT NULL,
    jumlah NUMERIC(14,2) NOT NULL CHECK (jumlah > 0),
    saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kas_transaksi_tanggal_id
    ON kas_transaksi (tanggal, id);

CREATE OR REPLACE FUNCTION set_kas_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.hari := CASE EXTRACT(ISODOW FROM NEW.tanggal)
        WHEN 1 THEN 'Senin'
        WHEN 2 THEN 'Selasa'
        WHEN 3 THEN 'Rabu'
        WHEN 4 THEN 'Kamis'
        WHEN 5 THEN 'Jumat'
        WHEN 6 THEN 'Sabtu'
        WHEN 7 THEN 'Minggu'
    END;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION recompute_kas_saldo()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NULL;
    END IF;

    UPDATE kas_transaksi
    SET saldo = saldo_baru.saldo_hitung,
        updated_at = CASE
            WHEN kas_transaksi.saldo IS DISTINCT FROM saldo_baru.saldo_hitung THEN NOW()
            ELSE kas_transaksi.updated_at
        END
    FROM (
        SELECT
            id,
            SUM(
                CASE
                    WHEN jenis = 'masuk' THEN jumlah
                    ELSE jumlah * -1
                END
            ) OVER (
                ORDER BY tanggal, id
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            ) AS saldo_hitung
        FROM kas_transaksi
    ) AS saldo_baru
    WHERE kas_transaksi.id = saldo_baru.id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_kas_set_fields ON kas_transaksi;
CREATE TRIGGER trg_kas_set_fields
BEFORE INSERT OR UPDATE ON kas_transaksi
FOR EACH ROW
EXECUTE FUNCTION set_kas_fields();

DROP TRIGGER IF EXISTS trg_kas_recompute_saldo ON kas_transaksi;
CREATE TRIGGER trg_kas_recompute_saldo
AFTER INSERT OR UPDATE OR DELETE ON kas_transaksi
FOR EACH STATEMENT
EXECUTE FUNCTION recompute_kas_saldo();

-- Contoh insert:
-- INSERT INTO kas_transaksi (tanggal, keterangan, jenis, jumlah)
-- VALUES
--     ('2026-07-17', 'Modal awal', 'masuk', 1000000),
--     ('2026-07-17', 'Beli ATK', 'keluar', 150000),
--     ('2026-07-18', 'Penjualan tunai', 'masuk', 350000);

-- Contoh lihat data:
-- SELECT id, tanggal, hari, keterangan, jenis, jumlah, saldo
-- FROM kas_transaksi
-- ORDER BY tanggal, id;
