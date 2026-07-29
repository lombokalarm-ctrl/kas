-- Menambahkan tabel penjualan terpisah untuk riwayat penjualan.

CREATE TABLE IF NOT EXISTS penjualan (
    id BIGSERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    hari VARCHAR(10) NOT NULL,
    keterangan TEXT NOT NULL,
    jumlah NUMERIC(14,2) NOT NULL CHECK (jumlah > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penjualan_tanggal_id
    ON penjualan (tanggal, id);

CREATE OR REPLACE FUNCTION set_penjualan_fields()
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

DROP TRIGGER IF EXISTS trg_penjualan_set_fields ON penjualan;
CREATE TRIGGER trg_penjualan_set_fields
BEFORE INSERT OR UPDATE ON penjualan
FOR EACH ROW
EXECUTE FUNCTION set_penjualan_fields();
