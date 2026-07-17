DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM kas_transaksi LIMIT 1) THEN
        INSERT INTO kas_transaksi (tanggal, keterangan, jenis, jumlah)
        VALUES
            ('2026-07-15', 'Modal awal kas', 'masuk', 2500000),
            ('2026-07-15', 'Beli alat tulis', 'keluar', 125000),
            ('2026-07-16', 'Penjualan tunai pagi', 'masuk', 875000),
            ('2026-07-16', 'Bayar transport operasional', 'keluar', 95000),
            ('2026-07-17', 'Penjualan tunai siang', 'masuk', 1325000),
            ('2026-07-17', 'Bayar makan tim', 'keluar', 210000);
    END IF;
END $$;
