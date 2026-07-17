import { Router } from 'express';
import pool from '../db.js';
const router = Router();
function normalizeSummary(row) {
    return {
        saldoTerakhir: Number(row?.saldo_terakhir || 0),
        totalMasuk: Number(row?.total_masuk || 0),
        totalKeluar: Number(row?.total_keluar || 0),
        jumlahTransaksi: Number(row?.jumlah_transaksi || 0),
    };
}
function buildWhereClause(startDate, endDate) {
    const values = [];
    const clauses = [];
    if (startDate) {
        values.push(startDate);
        clauses.push(`tanggal >= $${values.length}`);
    }
    if (endDate) {
        values.push(endDate);
        clauses.push(`tanggal <= $${values.length}`);
    }
    return {
        values,
        whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    };
}
router.get('/summary', async (_req, res) => {
    try {
        const result = await pool.query(`
      SELECT
        COALESCE((SELECT saldo FROM kas_transaksi ORDER BY tanggal DESC, id DESC LIMIT 1), 0) AS saldo_terakhir,
        COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END), 0) AS total_masuk,
        COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0) AS total_keluar,
        COUNT(*) AS jumlah_transaksi
      FROM kas_transaksi
    `);
        res.status(200).json(normalizeSummary(result.rows[0]));
    }
    catch (error) {
        res.status(500).json({ message: 'Gagal mengambil ringkasan kas.' });
    }
});
router.get('/transactions', async (req, res) => {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const { values, whereSql } = buildWhereClause(startDate, endDate);
    try {
        const itemsResult = await pool.query(`
        SELECT
          id,
          TO_CHAR(tanggal, 'YYYY-MM-DD') AS tanggal,
          hari,
          keterangan,
          jenis,
          jumlah,
          saldo,
          created_at,
          updated_at
        FROM kas_transaksi
        ${whereSql}
        ORDER BY tanggal DESC, id DESC
      `, values);
        const summaryResult = await pool.query(`
        WITH filtered AS (
          SELECT *
          FROM kas_transaksi
          ${whereSql}
        )
        SELECT
          COALESCE((SELECT saldo FROM filtered ORDER BY tanggal DESC, id DESC LIMIT 1), 0) AS saldo_terakhir,
          COALESCE(SUM(CASE WHEN jenis = 'masuk' THEN jumlah ELSE 0 END), 0) AS total_masuk,
          COALESCE(SUM(CASE WHEN jenis = 'keluar' THEN jumlah ELSE 0 END), 0) AS total_keluar,
          COUNT(*) AS jumlah_transaksi
        FROM filtered
      `, values);
        const response = {
            items: itemsResult.rows,
            summary: normalizeSummary(summaryResult.rows[0]),
        };
        res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ message: 'Gagal mengambil transaksi kas.' });
    }
});
router.post('/', async (req, res) => {
    const body = req.body;
    if (!body?.tanggal || !body?.keterangan || !body?.jenis || !body?.jumlah) {
        res.status(400).json({ message: 'Data transaksi belum lengkap.' });
        return;
    }
    if (!['masuk', 'keluar'].includes(body.jenis)) {
        res.status(400).json({ message: 'Jenis transaksi tidak valid.' });
        return;
    }
    if (Number(body.jumlah) <= 0) {
        res.status(400).json({ message: 'Jumlah harus lebih besar dari nol.' });
        return;
    }
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const insertResult = await client.query(`
        INSERT INTO kas_transaksi (tanggal, keterangan, jenis, jumlah)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [body.tanggal, body.keterangan.trim(), body.jenis, Number(body.jumlah)]);
        const insertedId = insertResult.rows[0].id;
        const rowResult = await client.query(`
        SELECT
          id,
          TO_CHAR(tanggal, 'YYYY-MM-DD') AS tanggal,
          hari,
          keterangan,
          jenis,
          jumlah,
          saldo,
          created_at,
          updated_at
        FROM kas_transaksi
        WHERE id = $1
      `, [insertedId]);
        await client.query('COMMIT');
        res.status(201).json(rowResult.rows[0]);
    }
    catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: 'Gagal menyimpan transaksi kas.' });
    }
    finally {
        client.release();
    }
});
export default router;
