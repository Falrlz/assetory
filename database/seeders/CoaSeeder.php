<?php

namespace Database\Seeders;

use App\Models\Coa;
use App\Models\User;
use Illuminate\Database\Seeder;

class CoaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $users = User::all();

        if ($users->isEmpty()) {
            return;
        }

        $csvPath = base_path('docs/acount.csv');
        if (! file_exists($csvPath)) {
            return;
        }

        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file); // skip header line

        $parentMappings = [
            // Level 1 (Category Groups)
            '01' => 'Aset',
            '02' => 'Kewajiban',
            '03' => 'Ekuitas',
            '04' => 'Pendapatan',
            '05' => 'Beban',

            // Level 2 (Sub-Category Groups)
            '01.1000' => 'Kas & Setara Kas',
            '01.2000' => 'Piutang & Aset Lancar Lainnya',
            '01.3000' => 'Aset Tetap & Depresiasi',
            '02.1000' => 'Kewajiban Lancar',
            '02.2000' => 'Kewajiban Jangka Panjang',
            '03.1000' => 'Modal Disetor',
            '03.2000' => 'Cadangan & Saldo Laba',
            '04.1000' => 'Pendapatan Jasa',
            '04.2000' => 'Pendapatan Operasional Lainnya',
            '04.3000' => 'Pendapatan Non-Operasional',
            '05.1000' => 'Beban Karyawan',
            '05.2000' => 'Beban Operasional Umum',
            '05.3000' => 'Beban Lain-Lain & Pajak',

            // Level 3 (Sub-Sub-Category Groups)
            '01.1000.01' => 'Kas Tunai',
            '01.1000.02' => 'Kas di Bank',
            '01.2000.01' => 'Piutang & Cadangan',
            '01.2000.02' => 'Perlengkapan & Inventaris Lancar',
            '01.2000.03' => 'Piutang Lain-Lain',
            '01.2000.04' => 'Uang Muka & Biaya Dibayar Dimuka',
            '01.2000.05' => 'Uang Muka Pajak',
            '01.2000.06' => 'Aset Lancar Lain-Lain',
            '01.2000.07' => 'Aset Tidak Berwujud & Amortisasi',
            '01.3000.01' => 'Aset Tetap',
            '01.3000.02' => 'Akumulasi Penyusutan Aset',
            '02.1000.01' => 'Utang Lancar / Usaha',
            '02.1000.02' => 'Utang Pajak',
            '02.1000.03' => 'Pendapatan Diterima Dimuka',
            '02.2000.01' => 'Utang Bank Jangka Panjang',
            '02.2000.02' => 'Utang Sewa',
            '02.2000.03' => 'Kewajiban Jangka Panjang Lainnya',
            '03.1000.01' => 'Modal Disetor',
            '03.2000.01' => 'Cadangan Modal',
            '03.2000.02' => 'Saldo Laba',
            '03.2000.03' => 'Laba Rugi Tahun Berjalan',
            '04.1000.01' => 'Operasional Jasa',
            '04.2000.01' => 'Operasional Lainnya',
            '04.3000.01' => 'Non-Operasional / Lainnya',
            '05.1000.01' => 'Gaji & Karyawan',
            '05.2000.01' => 'Operasional Umum (Listrik, Wifi, Air, BBM)',
            '05.2000.02' => 'Pemeliharaan & Perbaikan',
            '05.2000.03' => 'Penyusutan',
            '05.3000.01' => 'Pajak PPh 21',
            '05.3000.02' => 'Pajak PPh 23',
            '05.3000.03' => 'Taksiran Pajak Penghasilan & Lainnya',
            '05.3000.04' => 'Kerugian Piutang Tak Tertagih',
        ];

        $defaultAccounts = [];
        $addedParents = [];

        while (($row = fgetcsv($file)) !== false) {
            if (count($row) < 6) {
                continue;
            }

            // CSV columns: "id_acount","id_perusahaan","code_acount","nama_acount","jenis_laporan","saldo_normal"
            // Example: "174","1","01.1000.01.01","Kas Kecil","LPK","D"
            $code = $row[2];
            $name = $row[3];
            $jenisLaporan = $row[4]; // LPK or LR
            $normalBalance = strtolower($row[5]) === 'k' ? 'kredit' : 'debit';

            // Map prefix to category
            $prefix = substr($code, 0, 2);
            $category = match ($prefix) {
                '01' => 'aset',
                '02' => 'kewajiban',
                '03' => 'ekuitas',
                '04' => 'pendapatan',
                '05' => 'beban',
                default => 'aset',
            };

            // Seed Parent levels (1-segment, 2-segment, 3-segment)
            $parts = explode('.', $code);
            for ($i = 1; $i < count($parts); $i++) {
                $parentCode = implode('.', array_slice($parts, 0, $i));
                if (! in_array($parentCode, $addedParents)) {
                    $addedParents[] = $parentCode;
                    $defaultAccounts[] = [
                        'kode_akun' => $parentCode,
                        'nama_akun' => $parentMappings[$parentCode] ?? 'Kelompok '.$parentCode,
                        'kategori' => $category,
                        'saldo_normal' => $normalBalance,
                        'jenis_laporan' => $jenisLaporan,
                    ];
                }
            }

            $defaultAccounts[] = [
                'kode_akun' => $code,
                'nama_akun' => $name,
                'kategori' => $category,
                'saldo_normal' => $normalBalance,
                'jenis_laporan' => $jenisLaporan,
            ];
        }
        fclose($file);

        foreach ($users as $user) {
            foreach ($defaultAccounts as $account) {
                Coa::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'kode_akun' => $account['kode_akun'],
                    ],
                    [
                        'nama_akun' => $account['nama_akun'],
                        'kategori' => $account['kategori'],
                        'saldo_normal' => $account['saldo_normal'],
                        'jenis_laporan' => $account['jenis_laporan'],
                    ],
                );
            }
        }
    }
}
