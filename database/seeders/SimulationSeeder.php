<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Coa;
use App\Models\Journal;
use App\Models\JournalItem;
use App\Models\User;
use App\Services\DepreciationService;
use Illuminate\Database\Seeder;
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
            $coaPerlengkapan = Coa::where('user_id', $user->id)->where('kode_akun', '01.2000.02.02')->first(); // Perlengkapan Kantor
            $coaBebanLain = Coa::where('user_id', $user->id)->where('kode_akun', '05.2000.01.11')->first(); // Beban Lain-lain
            $coaDiterimaDimuka = Coa::where('user_id', $user->id)->where('kode_akun', '02.1000.03.01')->first(); // Pendapatan diterima dimuka
            $coaUtangUsaha = Coa::where('user_id', $user->id)->where('kode_akun', '02.1000.01.01')->first(); // Utang Usaha
            $coaPiutangUsaha = Coa::where('user_id', $user->id)->where('kode_akun', '01.2000.01.01')->first(); // Piutang Usaha
            $coaPendapatanJasa = Coa::where('user_id', $user->id)->where('kode_akun', '04.1000.01.04')->first(); // Pendapatan Jasa Assurance Lainnya
            $coaBebanGaji = Coa::where('user_id', $user->id)->where('kode_akun', '05.1000.01.01')->first(); // Beban Gaji
            $coaBebanListrik = Coa::where('user_id', $user->id)->where('kode_akun', '05.2000.01.01')->first(); // Beban Listrik

            if (! $coaKas || ! $coaRuko || ! $coaPeralatan || ! $coaModal || ! $coaPerlengkapan || ! $coaBebanLain || ! $coaDiterimaDimuka || ! $coaUtangUsaha || ! $coaPiutangUsaha || ! $coaPendapatanJasa || ! $coaBebanGaji || ! $coaBebanListrik) {
                continue;
            }

            // ==========================================
            // SALDO AWAL (SETUP CUT-OFF)
            // ==========================================

            // 30 April: Saldo Awal Setup
            $j0 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-04-30',
                'nomor_jurnal' => 'OP-20260430-0001',
                'keterangan' => 'Saldo Awal Setup Usaha',
                'tipe_jurnal' => 'umum',
                'jenis_transaksi' => 'saldo_awal',
            ]);
            $j0->items()->create(['coa_id' => $coaKas->id, 'debit' => 100000000.00, 'kredit' => 0.00]);
            $j0->items()->create(['coa_id' => $coaModal->id, 'debit' => 0.00, 'kredit' => 100000000.00]);

            // ==========================================
            // BULAN 1: MEI 2026
            // ==========================================

            // 1 Mei: Setoran Modal Tambahan (Gedung Ruko & Peralatan)
            $j1 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-01',
                'nomor_jurnal' => 'JV-202605-0001',
                'keterangan' => 'Setoran modal tambahan usaha Pak Budi',
                'tipe_jurnal' => 'umum',
            ]);
            $j1->items()->create(['coa_id' => $coaKas->id, 'debit' => 50000000.00, 'kredit' => 0.00]);
            $j1->items()->create(['coa_id' => $coaRuko->id, 'debit' => 400000000.00, 'kredit' => 0.00]);
            $j1->items()->create(['coa_id' => $coaPeralatan->id, 'debit' => 50000000.00, 'kredit' => 0.00]);
            $j1->items()->create(['coa_id' => $coaModal->id, 'debit' => 0.00, 'kredit' => 500000000.00]);

            // Buat Aset Tetap
            Asset::create([
                'user_id' => $user->id,
                'coa_debit_id' => $coaRuko->id,
                'coa_kredit_id' => $coaModal->id,
                'nama' => 'Ruko (Gedung)',
                'jenis' => 'gedung',
                'harga_perolehan' => 400000000.00,
                'nilai_residu' => 0.00,
                'tanggal_perolehan' => '2026-05-01',
                'periode' => 'periode_4', // 20 tahun
            ]);

            Asset::create([
                'user_id' => $user->id,
                'coa_debit_id' => $coaPeralatan->id,
                'coa_kredit_id' => $coaModal->id,
                'nama' => 'Peralatan Kantor',
                'jenis' => 'inventaris',
                'harga_perolehan' => 50000000.00,
                'nilai_residu' => 0.00,
                'tanggal_perolehan' => '2026-05-01',
                'periode' => 'periode_2', // 8 tahun
            ]);

            // 5 Mei: Membeli Perlengkapan Kantor
            $j2 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-05',
                'nomor_jurnal' => 'JV-202605-0002',
                'keterangan' => 'Pembelian perlengkapan kantor',
                'tipe_jurnal' => 'umum',
            ]);
            $j2->items()->create(['coa_id' => $coaPerlengkapan->id, 'debit' => 5000000.00, 'kredit' => 0.00]);
            $j2->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 5000000.00]);

            // 7 Mei: Membayar Iklan Media Sosial
            $j3 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-07',
                'nomor_jurnal' => 'JV-202605-0003',
                'keterangan' => 'Pembayaran beban iklan media sosial',
                'tipe_jurnal' => 'umum',
            ]);
            $j3->items()->create(['coa_id' => $coaBebanLain->id, 'debit' => 2000000.00, 'kredit' => 0.00]);
            $j3->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 2000000.00]);

            // 10 Mei: Menerima Pendapatan Diterima Dimuka
            $j4 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-10',
                'nomor_jurnal' => 'JV-202605-0004',
                'keterangan' => 'Penerimaan uang muka pembuatan sistem akuntansi',
                'tipe_jurnal' => 'umum',
            ]);
            $j4->items()->create(['coa_id' => $coaKas->id, 'debit' => 75000000.00, 'kredit' => 0.00]);
            $j4->items()->create(['coa_id' => $coaDiterimaDimuka->id, 'debit' => 0.00, 'kredit' => 75000000.00]);

            // 12 Mei: Membeli Laptop Kantor secara Kredit
            $j5 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-12',
                'nomor_jurnal' => 'JV-202605-0005',
                'keterangan' => 'Pembelian laptop kantor secara kredit',
                'tipe_jurnal' => 'umum',
            ]);
            $j5->items()->create(['coa_id' => $coaPeralatan->id, 'debit' => 15000000.00, 'kredit' => 0.00]);
            $j5->items()->create(['coa_id' => $coaUtangUsaha->id, 'debit' => 0.00, 'kredit' => 15000000.00]);

            Asset::create([
                'user_id' => $user->id,
                'coa_debit_id' => $coaPeralatan->id,
                'coa_kredit_id' => $coaUtangUsaha->id,
                'nama' => 'Laptop Kantor',
                'jenis' => 'inventaris',
                'harga_perolehan' => 15000000.00,
                'nilai_residu' => 0.00,
                'tanggal_perolehan' => '2026-05-12',
                'periode' => 'periode_1', // 4 tahun
            ]);

            // 15 Mei: Tagihan Jasa Perhitungan Pajak
            $j6 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-15',
                'nomor_jurnal' => 'JV-202605-0006',
                'keterangan' => 'Penagihan jasa perhitungan pajak badan',
                'tipe_jurnal' => 'umum',
            ]);
            $j6->items()->create(['coa_id' => $coaPiutangUsaha->id, 'debit' => 50000000.00, 'kredit' => 0.00]);
            $j6->items()->create(['coa_id' => $coaPendapatanJasa->id, 'debit' => 0.00, 'kredit' => 50000000.00]);

            // 20 Mei: Penerimaan Pembayaran 50% atas Piutang
            $j7 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-20',
                'nomor_jurnal' => 'JV-202605-0007',
                'keterangan' => 'Penerimaan pembayaran 50% tagihan jasa perhitungan pajak',
                'tipe_jurnal' => 'umum',
            ]);
            $j7->items()->create(['coa_id' => $coaKas->id, 'debit' => 25000000.00, 'kredit' => 0.00]);
            $j7->items()->create(['coa_id' => $coaPiutangUsaha->id, 'debit' => 0.00, 'kredit' => 25000000.00]);

            // 25 Mei: Membayar Gaji Konsultan
            $j8 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-25',
                'nomor_jurnal' => 'JV-202605-0008',
                'keterangan' => 'Pembayaran gaji konsultan',
                'tipe_jurnal' => 'umum',
            ]);
            $j8->items()->create(['coa_id' => $coaBebanGaji->id, 'debit' => 17000000.00, 'kredit' => 0.00]);
            $j8->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 17000000.00]);

            // 28 Mei: Membayar Listrik
            $j9 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-28',
                'nomor_jurnal' => 'JV-202605-0009',
                'keterangan' => 'Pembayaran tagihan listrik ruko',
                'tipe_jurnal' => 'umum',
            ]);
            $j9->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 1000000.00, 'kredit' => 0.00]);
            $j9->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 1000000.00]);

            // 31 Mei: Posting Depresiasi Mei 2026
            $depreciationService->postDepreciationForUser($user, '2026-05');

            // ==========================================
            // BULAN 2: JUNI 2026
            // ==========================================

            // 3 Juni: Membayar sisa utang laptop (5 juta)
            $j10 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-06-03',
                'nomor_jurnal' => 'JV-202606-0001',
                'keterangan' => 'Pembayaran sebagian utang laptop kantor',
                'tipe_jurnal' => 'umum',
            ]);
            $j10->items()->create(['coa_id' => $coaUtangUsaha->id, 'debit' => 5000000.00, 'kredit' => 0.00]);
            $j10->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 5000000.00]);

            // 10 Juni: Menerima pelunasan piutang (25 juta)
            $j11 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-06-10',
                'nomor_jurnal' => 'JV-202606-0002',
                'keterangan' => 'Penerimaan pelunasan piutang tagihan jasa pajak',
                'tipe_jurnal' => 'umum',
            ]);
            $j11->items()->create(['coa_id' => $coaKas->id, 'debit' => 25000000.00, 'kredit' => 0.00]);
            $j11->items()->create(['coa_id' => $coaPiutangUsaha->id, 'debit' => 0.00, 'kredit' => 25000000.00]);

            // 18 Juni: Menerima pendapatan jasa secara tunai (40 juta)
            $j12 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-06-18',
                'nomor_jurnal' => 'JV-202606-0003',
                'keterangan' => 'Penerimaan pendapatan jasa konsultasi manajemen tunai',
                'tipe_jurnal' => 'umum',
            ]);
            $j12->items()->create(['coa_id' => $coaKas->id, 'debit' => 40000000.00, 'kredit' => 0.00]);
            $j12->items()->create(['coa_id' => $coaPendapatanJasa->id, 'debit' => 0.00, 'kredit' => 40000000.00]);

            // 25 Juni: Membayar Gaji Konsultan
            $j13 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-06-25',
                'nomor_jurnal' => 'JV-202606-0004',
                'keterangan' => 'Pembayaran gaji konsultan periode Juni',
                'tipe_jurnal' => 'umum',
            ]);
            $j13->items()->create(['coa_id' => $coaBebanGaji->id, 'debit' => 17000000.00, 'kredit' => 0.00]);
            $j13->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 17000000.00]);

            // 28 Juni: Membayar Listrik
            $j14 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-06-28',
                'nomor_jurnal' => 'JV-202606-0005',
                'keterangan' => 'Pembayaran tagihan listrik ruko Juni',
                'tipe_jurnal' => 'umum',
            ]);
            $j14->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 1200000.00, 'kredit' => 0.00]);
            $j14->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 1200000.00]);

            // 30 Juni: Posting Depresiasi Juni 2026
            $depreciationService->postDepreciationForUser($user, '2026-06');

            // ==========================================
            // BULAN 3: JULI 2026
            // ==========================================

            // 5 Juli: Membeli Printer Kantor (6 juta cash)
            $j15 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-07-05',
                'nomor_jurnal' => 'JV-202607-0001',
                'keterangan' => 'Pembelian printer kantor tunai',
                'tipe_jurnal' => 'umum',
            ]);
            $j15->items()->create(['coa_id' => $coaPeralatan->id, 'debit' => 6000000.00, 'kredit' => 0.00]);
            $j15->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 6000000.00]);

            Asset::create([
                'user_id' => $user->id,
                'coa_debit_id' => $coaPeralatan->id,
                'coa_kredit_id' => $coaKas->id,
                'nama' => 'Printer Kantor',
                'jenis' => 'inventaris',
                'harga_perolehan' => 6000000.00,
                'nilai_residu' => 0.00,
                'tanggal_perolehan' => '2026-07-05',
                'periode' => 'periode_1', // 4 tahun
            ]);

            // 12 Juli: Pendapatan Jasa Tunai (60 juta)
            $j16 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-07-12',
                'nomor_jurnal' => 'JV-202607-0002',
                'keterangan' => 'Penerimaan pendapatan jasa audit tahunan tunai',
                'tipe_jurnal' => 'umum',
            ]);
            $j16->items()->create(['coa_id' => $coaKas->id, 'debit' => 60000000.00, 'kredit' => 0.00]);
            $j16->items()->create(['coa_id' => $coaPendapatanJasa->id, 'debit' => 0.00, 'kredit' => 60000000.00]);

            // 25 Juli: Membayar Gaji Konsultan
            $j17 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-07-25',
                'nomor_jurnal' => 'JV-202607-0003',
                'keterangan' => 'Pembayaran gaji konsultan periode Juli',
                'tipe_jurnal' => 'umum',
            ]);
            $j17->items()->create(['coa_id' => $coaBebanGaji->id, 'debit' => 17000000.00, 'kredit' => 0.00]);
            $j17->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 17000000.00]);

            // 28 Juli: Membayar Listrik
            $j18 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-07-28',
                'nomor_jurnal' => 'JV-202607-0004',
                'keterangan' => 'Pembayaran tagihan listrik ruko Juli',
                'tipe_jurnal' => 'umum',
            ]);
            $j18->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 1100000.00, 'kredit' => 0.00]);
            $j18->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 1100000.00]);

            // 31 Juli: Posting Depresiasi Juli 2026
            $depreciationService->postDepreciationForUser($user, '2026-07');
        }
    }
}
