<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Coa;
use App\Models\Journal;
use App\Models\JournalItem;
use App\Models\User;
use App\Services\DepreciationService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SimulationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Clean up existing data to ensure clean slate simulation
        Schema::disableForeignKeyConstraints();
        JournalItem::truncate();
        Journal::truncate();
        Asset::truncate();
        Schema::enableForeignKeyConstraints();

        $users = User::all();
        $depreciationService = app(DepreciationService::class);

        foreach ($users as $user) {
            // Find necessary COAs
            $coaKas = Coa::where('user_id', $user->id)->where('kode_akun', '01.1000.01.02')->first(); // Kas Besar
            $coaRuko = Coa::where('user_id', $user->id)->where('kode_akun', '01.3000.01.02')->first(); // Gedung
            $coaPeralatan = Coa::where('user_id', $user->id)->where('kode_akun', '01.3000.01.04')->first(); // Inventaris
            $coaModal = Coa::where('user_id', $user->id)->where('kode_akun', '03.1000.01.01')->first(); // Modal disetor
            $coaPendapatanJasa = Coa::where('user_id', $user->id)->where('kode_akun', '04.1000.01.04')->first(); // Pendapatan Jasa Assurance Lainnya
            $coaBebanGaji = Coa::where('user_id', $user->id)->where('kode_akun', '05.1000.01.01')->first(); // Beban Gaji
            $coaBebanListrik = Coa::where('user_id', $user->id)->where('kode_akun', '05.2000.01.01')->first(); // Beban Listrik

            if (! $coaKas || ! $coaRuko || ! $coaPeralatan || ! $coaModal || ! $coaPendapatanJasa || ! $coaBebanGaji || ! $coaBebanListrik) {
                continue;
            }

            // Reset lock date for simulation to run without lock conflicts
            $user->update(['lock_date' => null]);

            // ==========================================
            // SALDO AWAL (SETUP CUT-OFF) - 1 Januari 2024
            // ==========================================
            $j0 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2024-01-01',
                'nomor_jurnal' => 'OP-20240101-0001',
                'keterangan' => 'Saldo Awal Setup Usaha',
                'tipe_jurnal' => 'umum',
                'jenis_transaksi' => 'saldo_awal',
            ]);
            $j0->items()->create(['coa_id' => $coaKas->id, 'debit' => 200000000.00, 'kredit' => 0.00]);
            $j0->items()->create(['coa_id' => $coaModal->id, 'debit' => 0.00, 'kredit' => 200000000.00]);

            // ==========================================
            // PEMBELIAN ASET TETAP - 2 Januari 2024
            // ==========================================

            // 1. Gedung Ruko (Umur 20 Tahun)
            Asset::create([
                'user_id' => $user->id,
                'coa_debit_id' => $coaRuko->id,
                'coa_kredit_id' => $coaModal->id,
                'nama' => 'Ruko (Gedung)',
                'jenis' => 'gedung',
                'harga_perolehan' => 400000000.00,
                'nilai_residu' => 1.00,
                'tanggal_perolehan' => '2024-01-02',
                'periode' => 'periode_4', // 20 tahun
            ]);

            // 2. Peralatan Kantor (Umur 4 Tahun)
            Asset::create([
                'user_id' => $user->id,
                'coa_debit_id' => $coaPeralatan->id,
                'coa_kredit_id' => $coaModal->id,
                'nama' => 'Peralatan Kantor',
                'jenis' => 'inventaris',
                'harga_perolehan' => 48000000.00,
                'nilai_residu' => 1.00,
                'tanggal_perolehan' => '2024-01-02',
                'periode' => 'periode_1', // 4 tahun
            ]);

            // Jurnal Perolehan Aset Tetap secara manual
            $jAssets = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2024-01-02',
                'nomor_jurnal' => 'JV-20240102-0001',
                'keterangan' => 'Pencatatan perolehan aset ruko dan peralatan kantor',
                'tipe_jurnal' => 'perolehan_aset',
            ]);
            $jAssets->items()->create(['coa_id' => $coaRuko->id, 'debit' => 400000000.00, 'kredit' => 0.00]);
            $jAssets->items()->create(['coa_id' => $coaPeralatan->id, 'debit' => 48000000.00, 'kredit' => 0.00]);
            $jAssets->items()->create(['coa_id' => $coaModal->id, 'debit' => 0.00, 'kredit' => 448000000.00]);

            // ==========================================
            // SIMULASI TRANSAKSI BULANAN - 36 Bulan (Jan 2024 s/d Des 2026)
            // ==========================================
            $currentDate = Carbon::parse('2024-01-01');

            for ($i = 0; $i < 36; $i++) {
                $yearMonth = $currentDate->format('Y-m');

                // 1. Tanggal 10: Penerimaan Pendapatan Jasa (Rp 25.000.000) - Arus Kas Masuk Operasional
                $jRev = Journal::create([
                    'user_id' => $user->id,
                    'tanggal' => $yearMonth.'-10',
                    'nomor_jurnal' => 'JV-'.$currentDate->format('Ym').'-0010',
                    'keterangan' => 'Penerimaan pendapatan jasa konsultasi bulanan '.$yearMonth,
                    'tipe_jurnal' => 'umum',
                    'jenis_transaksi' => 'jurnal_umum',
                    'kategori_arus_kas' => 'operasional',
                    'kode_arus_kas' => 'KM-O',
                ]);
                $jRev->items()->create(['coa_id' => $coaKas->id, 'debit' => 25000000.00, 'kredit' => 0.00]);
                $jRev->items()->create(['coa_id' => $coaPendapatanJasa->id, 'debit' => 0.00, 'kredit' => 25000000.00]);

                // 2. Tanggal 25: Pembayaran Gaji Staf (Rp 10.000.000) - Arus Kas Keluar Operasional
                $jSal = Journal::create([
                    'user_id' => $user->id,
                    'tanggal' => $yearMonth.'-25',
                    'nomor_jurnal' => 'JV-'.$currentDate->format('Ym').'-0025',
                    'keterangan' => 'Pembayaran gaji konsultan '.$yearMonth,
                    'tipe_jurnal' => 'umum',
                    'jenis_transaksi' => 'jurnal_umum',
                    'kategori_arus_kas' => 'operasional',
                    'kode_arus_kas' => 'KK-O',
                ]);
                $jSal->items()->create(['coa_id' => $coaBebanGaji->id, 'debit' => 10000000.00, 'kredit' => 0.00]);
                $jSal->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 10000000.00]);

                // 3. Tanggal 28: Pembayaran Listrik & Telepon (Rp 1.000.000) - Arus Kas Keluar Operasional
                // Khusus Bulan November 2025 (Bulan ke-23 / $i = 22), kita simulasikan salah input biaya listrik dan gembok periode
                if ($i === 22) {
                    // Set lock date sementara ke akhir Oktober 2025 untuk mengunci transaksi November
                    $user->update(['lock_date' => '2025-10-31']);

                    // Buat Jurnal yang Salah (Beban Rp 5.000.000, padahal aslinya Rp 1.000.000)
                    $jErr = Journal::create([
                        'user_id' => $user->id,
                        'tanggal' => '2025-11-15',
                        'nomor_jurnal' => 'JV-202511-9999',
                        'keterangan' => 'Pembayaran tagihan listrik [SALAH INPUT]',
                        'tipe_jurnal' => 'umum',
                        'jenis_transaksi' => 'jurnal_umum',
                        'kategori_arus_kas' => 'operasional',
                        'kode_arus_kas' => 'KK-O',
                    ]);
                    $jErr->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 5000000.00, 'kredit' => 0.00]);
                    $jErr->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 5000000.00]);

                    // Gembok tanggal diperbarui ke November 2025
                    $user->update(['lock_date' => '2025-11-30']);

                    // ==========================================
                    // JURNAL PEMBALIK (REVERSING ENTRY) - 1 Desember 2025
                    // ==========================================
                    $jRev = Journal::create([
                        'user_id' => $user->id,
                        'tanggal' => '2025-12-01',
                        'nomor_jurnal' => 'JV-R-20251201-0001',
                        'keterangan' => '[Pembalik] - Pembayaran tagihan listrik [SALAH INPUT]',
                        'tipe_jurnal' => 'umum',
                        'jenis_transaksi' => 'jurnal_koreksi',
                        'kategori_arus_kas' => 'operasional',
                        'kode_arus_kas' => 'JK-O',
                        'reverses_journal_id' => $jErr->id,
                    ]);
                    // Balik posisi debit kredit
                    $jRev->items()->create(['coa_id' => $coaKas->id, 'debit' => 5000000.00, 'kredit' => 0.00]);
                    $jRev->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 0.00, 'kredit' => 5000000.00]);

                    // Hubungkan jurnal asli ke jurnal pembalik
                    $jErr->update(['reversed_by_id' => $jRev->id]);

                    // Posting Jurnal Koreksi yang Benar (Rp 1.000.000)
                    $jCorrect = Journal::create([
                        'user_id' => $user->id,
                        'tanggal' => '2025-12-01',
                        'nomor_jurnal' => 'JV-20251201-0002',
                        'keterangan' => 'Pembayaran tagihan listrik [KOREKSI BENAR]',
                        'tipe_jurnal' => 'umum',
                        'jenis_transaksi' => 'jurnal_umum',
                        'kategori_arus_kas' => 'operasional',
                        'kode_arus_kas' => 'KK-O',
                    ]);
                    $jCorrect->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 1000000.00, 'kredit' => 0.00]);
                    $jCorrect->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 1000000.00]);
                } else {
                    // Transaksi Normal Listrik Bulanan
                    $jUtl = Journal::create([
                        'user_id' => $user->id,
                        'tanggal' => $yearMonth.'-28',
                        'nomor_jurnal' => 'JV-'.$currentDate->format('Ym').'-0028',
                        'keterangan' => 'Pembayaran tagihan listrik '.$yearMonth,
                        'tipe_jurnal' => 'umum',
                        'jenis_transaksi' => 'jurnal_umum',
                        'kategori_arus_kas' => 'operasional',
                        'kode_arus_kas' => 'KK-O',
                    ]);
                    $jUtl->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 1000000.00, 'kredit' => 0.00]);
                    $jUtl->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 1000000.00]);
                }

                // 4. Akhir Bulan: Posting Depresiasi Bulanan (Jurnal Penyesuaian)
                $depreciationService->postDepreciationForUser($user, $yearMonth);

                // Di akhir bulan Desember (bulan ke-12 dan 24, yaitu 2024 dan 2025), jalankan Jurnal Penutup
                if ($currentDate->month === 12) {
                    $year = $currentDate->year;
                    if ($year < 2026) {
                        $this->postClosingEntries($user, $year);
                    }
                }

                $currentDate->addMonth();
            }

            // Di akhir simulasi 3 tahun, kunci pembukuan per 31 Desember 2026
            $user->update(['lock_date' => '2026-12-31']);
        }
    }

    /**
     * Post Year-End Closing Entries (Jurnal Penutup) to zero out Revenue/Expenses
     * and transfer net profit to Retained Earnings (Saldo Laba).
     */
    private function postClosingEntries(User $user, int $year): void
    {
        $coaSaldoLaba = Coa::where('user_id', $user->id)->where('kode_akun', '03.2000.02.01')->first(); // Saldo Laba
        if (! $coaSaldoLaba) {
            return;
        }

        $startDate = "{$year}-01-01";
        $endDate = "{$year}-12-31";

        // Fetch transaction-level COA accounts (level 4)
        $coas = $user->coas()
            ->get()
            ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4);

        $revenueItems = [];
        $expenseItems = [];
        $totalRevenues = 0.00;
        $totalExpenses = 0.00;

        foreach ($coas as $coa) {
            if ($coa->kategori !== 'pendapatan' && $coa->kategori !== 'beban') {
                continue;
            }

            // Sum transactions for this COA in this year, excluding setup beginning balance and existing closing entries
            $sums = DB::table('journal_items')
                ->join('journals', 'journal_items.journal_id', '=', 'journals.id')
                ->where('journals.user_id', $user->id)
                ->where('journal_items.coa_id', $coa->id)
                ->whereBetween('journals.tanggal', [$startDate, $endDate])
                ->whereNotIn('journals.jenis_transaksi', ['saldo_awal', 'jurnal_penutup'])
                ->selectRaw('COALESCE(SUM(journal_items.debit), 0) as total_debit, COALESCE(SUM(journal_items.kredit), 0) as total_kredit')
                ->first();

            $debit = (float) $sums->total_debit;
            $kredit = (float) $sums->total_kredit;

            if ($coa->kategori === 'pendapatan') {
                $balance = $kredit - $debit;
                if (round($balance, 2) !== 0.00) {
                    $revenueItems[] = ['coa_id' => $coa->id, 'balance' => $balance];
                    $totalRevenues += $balance;
                }
            } elseif ($coa->kategori === 'beban') {
                $balance = $debit - $kredit;
                if (round($balance, 2) !== 0.00) {
                    $expenseItems[] = ['coa_id' => $coa->id, 'balance' => $balance];
                    $totalExpenses += $balance;
                }
            }
        }

        $netIncome = $totalRevenues - $totalExpenses;

        if (empty($revenueItems) && empty($expenseItems) && round($netIncome, 2) === 0.00) {
            return;
        }

        DB::transaction(function () use ($user, $year, $revenueItems, $expenseItems, $netIncome, $coaSaldoLaba) {
            $journal = Journal::create([
                'user_id' => $user->id,
                'tanggal' => "{$year}-12-31",
                'nomor_jurnal' => "CL-{$year}1231-0001",
                'keterangan' => "Jurnal Penutup Akhir Tahun {$year}",
                'tipe_jurnal' => 'umum',
                'jenis_transaksi' => 'jurnal_penutup',
            ]);

            // 1. Debit all revenue accounts to close them to zero
            foreach ($revenueItems as $item) {
                $journal->items()->create([
                    'coa_id' => $item['coa_id'],
                    'debit' => $item['balance'],
                    'kredit' => 0.00,
                ]);
            }

            // 2. Credit all expense accounts to close them to zero
            foreach ($expenseItems as $item) {
                $journal->items()->create([
                    'coa_id' => $item['coa_id'],
                    'debit' => 0.00,
                    'kredit' => $item['balance'],
                ]);
            }

            // 3. Transfer net income to Retained Earnings (Saldo Laba)
            if (round($netIncome, 2) > 0.00) {
                // Profit increases Retained Earnings (Credit)
                $journal->items()->create([
                    'coa_id' => $coaSaldoLaba->id,
                    'debit' => 0.00,
                    'kredit' => $netIncome,
                ]);
            } elseif (round($netIncome, 2) < 0.00) {
                // Loss decreases Retained Earnings (Debit)
                $journal->items()->create([
                    'coa_id' => $coaSaldoLaba->id,
                    'debit' => abs($netIncome),
                    'kredit' => 0.00,
                ]);
            }
        });
    }
}
