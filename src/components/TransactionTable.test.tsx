import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TransactionTable } from './TransactionTable'

describe('TransactionTable', () => {
  it('menampilkan data transaksi dan format tanggal Indonesia', () => {
    render(
      <TransactionTable
        isLoading={false}
        userRole="owner"
        isSubmitting={false}
        onUpdateTransaction={async () => true}
        items={[
          {
            id: 1,
            tanggal: '2026-07-17',
            hari: 'Jumat',
            keterangan: 'Modal awal',
            jenis: 'masuk',
            jumlah: 1000000,
            saldo: 1000000,
            catatan_edit: null,
            edited_at: null,
            edited_by_user_id: null,
            edited_by_username: null,
            created_at: '2026-07-17T00:00:00.000Z',
            updated_at: '2026-07-17T00:00:00.000Z',
          },
        ]}
      />,
    )

    expect(screen.getAllByText('17-07-2026')).toHaveLength(2)
    expect(screen.getAllByText('Modal awal')).toHaveLength(2)
    expect(screen.getAllByText('+1.000.000').length).toBeGreaterThan(0)
    expect(screen.queryByText('Jenis')).not.toBeInTheDocument()
    expect(
      screen.getAllByText((content) => content.includes('Rp') && content.includes('1.000.000'))
        .length,
    ).toBeGreaterThan(0)
  })
})
