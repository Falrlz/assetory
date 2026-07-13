<?php

namespace Database\Seeders;

use App\Models\Asset;
use App\Models\Coa;
use App\Models\Journal;
use App\Models\JournalItem;
use App\Models\User;
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

            // Validation check to prevent seeding if database isn't fully seeded with COAs
            if (! $coaKas || ! $coaRuko || ! $coaPeralatan || ! $coaModal || ! $coaPerlengkapan || ! $coaBebanLain || ! $coaDiterimaDimuka || ! $coaUtangUsaha || ! $coaPiutangUsaha || ! $coaPendapatanJasa || ! $coaBebanGaji || ! $coaBebanListrik) {
                continue;
            }

            // --- 1 Mei: Setoran Modal Awal ---
            $j1 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-01',
                'nomor_jurnal' => 'JV-202605-0001',
                'keterangan' => 'Setoran modal awal usaha Pak Budi',
                'tipe_jurnal' => 'umum',
            ]);
            $j1->items()->create(['coa_id' => $coaKas->id, 'debit' => 50000000.00, 'kredit' => 0.00]);
            $j1->items()->create(['coa_id' => $coaRuko->id, 'debit' => 400000000.00, 'kredit' => 0.00]);
            $j1->items()->create(['coa_id' => $coaPeralatan->id, 'debit' => 50000000.00, 'kredit' => 0.00]);
            $j1->items()->create(['coa_id' => $coaModal->id, 'debit' => 0.00, 'kredit' => 500000000.00]);

            // Create Assets for Ruko & Peralatan
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

            // --- 5 Mei: Membeli Perlengkapan Kantor ---
            $j2 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-05',
                'nomor_jurnal' => 'JV-202605-0002',
                'keterangan' => 'Pembelian perlengkapan kantor',
                'tipe_jurnal' => 'umum',
            ]);
            $j2->items()->create(['coa_id' => $coaPerlengkapan->id, 'debit' => 5000000.00, 'kredit' => 0.00]);
            $j2->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 5000000.00]);

            // --- 7 Mei: Membayar Iklan Media Sosial ---
            $j3 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-07',
                'nomor_jurnal' => 'JV-202605-0003',
                'keterangan' => 'Pembayaran beban iklan media sosial',
                'tipe_jurnal' => 'umum',
            ]);
            $j3->items()->create(['coa_id' => $coaBebanLain->id, 'debit' => 2000000.00, 'kredit' => 0.00]);
            $j3->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 2000000.00]);

            // --- 10 Mei: Menerima Pendapatan Diterima Dimuka ---
            $j4 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-10',
                'nomor_jurnal' => 'JV-202605-0004',
                'keterangan' => 'Penerimaan uang muka pembuatan sistem akuntansi',
                'tipe_jurnal' => 'umum',
            ]);
            $j4->items()->create(['coa_id' => $coaKas->id, 'debit' => 75000000.00, 'kredit' => 0.00]);
            $j4->items()->create(['coa_id' => $coaDiterimaDimuka->id, 'debit' => 0.00, 'kredit' => 75000000.00]);

            // --- 12 Mei: Membeli Laptop Kantor secara Kredit ---
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

            // --- 15 Mei: Menyelesaikan Jasa Perhitungan Pajak Badan & Mengirim Tagihan ---
            $j6 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-15',
                'nomor_jurnal' => 'JV-202605-0006',
                'keterangan' => 'Penagihan jasa perhitungan pajak badan',
                'tipe_jurnal' => 'umum',
            ]);
            $j6->items()->create(['coa_id' => $coaPiutangUsaha->id, 'debit' => 50000000.00, 'kredit' => 0.00]);
            $j6->items()->create(['coa_id' => $coaPendapatanJasa->id, 'debit' => 0.00, 'kredit' => 50000000.00]);

            // --- 20 Mei: Penerimaan Pembayaran 50% atas Piutang ---
            $j7 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-20',
                'nomor_jurnal' => 'JV-202605-0007',
                'keterangan' => 'Penerimaan pembayaran 50% tagihan jasa perhitungan pajak',
                'tipe_jurnal' => 'umum',
            ]);
            $j7->items()->create(['coa_id' => $coaKas->id, 'debit' => 25000000.00, 'kredit' => 0.00]);
            $j7->items()->create(['coa_id' => $coaPiutangUsaha->id, 'debit' => 0.00, 'kredit' => 25000000.00]);

            // --- Note: 20 Mei menandatangani kontrak non-accounting event / no entry required ---

            // --- 25 Mei: Membayar Gaji Konsultan ---
            $j8 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-25',
                'nomor_jurnal' => 'JV-202605-0008',
                'keterangan' => 'Pembayaran gaji konsultan',
                'tipe_jurnal' => 'umum',
            ]);
            $j8->items()->create(['coa_id' => $coaBebanGaji->id, 'debit' => 17000000.00, 'kredit' => 0.00]);
            $j8->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 17000000.00]);

            // --- 28 Mei: Membayar Tagihan Listrik Ruko ---
            $j9 = Journal::create([
                'user_id' => $user->id,
                'tanggal' => '2026-05-28',
                'nomor_jurnal' => 'JV-202605-0009',
                'keterangan' => 'Pembayaran tagihan listrik ruko',
                'tipe_jurnal' => 'umum',
            ]);
            $j9->items()->create(['coa_id' => $coaBebanListrik->id, 'debit' => 1000000.00, 'kredit' => 0.00]);
            $j9->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 1000000.00]);
        }
    }
}
