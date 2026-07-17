import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TransactionTable } from './TransactionTable'

describe('TransactionTable', () => {
  it('menampilkan data transaksi dan format tanggal Indonesia', () => {
    render(
      <TransactionTable
        isLoading={false}
        items={[
          {
            id: 1,
            tanggal: '2026-07-17',
            hari: 'Jumat',
            keterangan: 'Modal awal',
            jenis: 'masuk',
            jumlah: 1000000,
            saldo: 1000000,
            created_at: '2026-07-17T00:00:00.000Z',
            updated_at: '2026-07-17T00:00:00.000Z',
          },
        ]}
      />,
    )

    expect(screen.getByText('17-07-2026')).toBeInTheDocument()
    expect(screen.getByText('Modal awal')).toBeInTheDocument()
    expect(screen.getByText('1.000.000')).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.includes('Rp') && content.includes('1.000.000')),
    ).toBeInTheDocument()
  })
})
