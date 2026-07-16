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

            if (!$coaKas || !$coaRuko || !$coaPeralatan || !$coaModal || !$coaPendapatanJasa || !$coaBebanGaji || !$coaBebanListrik) {
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
                    'tanggal' => $yearMonth . '-10',
                    'nomor_jurnal' => 'JV-' . $currentDate->format('Ym') . '-0010',
                    'keterangan' => 'Penerimaan pendapatan jasa konsultasi bulanan ' . $yearMonth,
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
                    'tanggal' => $yearMonth . '-25',
                    'nomor_jurnal' => 'JV-' . $currentDate->format('Ym') . '-0025',
                    'keterangan' => 'Pembayaran gaji konsultan ' . $yearMonth,
                    'tipe_jurnal' => 'umum',
                    'jenis_transaksi' => 'jurnal_umum',
                    'kategori_arus_kas' => 'operasional',
                    'kode_arus_kas' => 'KK-O',
                ]);
                $jSal->items()->create(['coa_id' => $coaBebanGaji->id, 'debit' => 10000000.00, 'kredit' => 0.00]);
                $jSal->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 10000000.00]);

                // 3. Tanggal 28: Pembayaran Listrik & Telepon (Rp 1.000.000) - Arus Kas Keluar Operasional
                $jUtl = Journal::create([
                    'user_id' => $user->id,
                    'tanggal' => $yearMonth . '-28',
                    'nomor_jurnal' => 'JV-' . $currentDate->format('Ym') . '-0028',
                    'keterangan' => 'Pembayaran tagihan listrik ' . $yearMonth,
                    'tipe_jurnal' => 'umum',
                    'jenis_transaksi' => 'jurnal_umum',
                    'kategori_arus_kas' => 'operasional',
                    'kode_arus_kas' => 'KK-O',
                ]);
                $jUtl->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 1000000.00, 'kredit' => 0.00]);
                $jUtl->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 1000000.00]);

                // 4. Akhir Bulan: Posting Depresiasi Bulanan
                $depreciationService->postDepreciationForUser($user, $yearMonth);

                $currentDate->addMonth();
            }

            // Di akhir simulasi 3 tahun, kunci pembukuan per 31 Desember 2026
            $user->update(['lock_date' => '2026-12-31']);
        }
    }
}
