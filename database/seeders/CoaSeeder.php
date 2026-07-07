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
        if (!file_exists($csvPath)) {
            return;
        }

        $file = fopen($csvPath, 'r');
        $header = fgetcsv($file); // skip header line

        $defaultAccounts = [];
        while (($row = fgetcsv($file)) !== false) {
            if (count($row) < 6) {
                continue;
            }

            // CSV columns: "id_acount","id_perusahaan","code_acount","nama_acount","jenis_laporan","saldo_normal"
            // Example: "174","1","01.1000.01.01","Kas Kecil","LPK","D"
            $code = $row[2];
            $name = $row[3];
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

            $defaultAccounts[] = [
                'kode_akun' => $code,
                'nama_akun' => $name,
                'kategori' => $category,
                'saldo_normal' => $normalBalance,
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
                    ],
                );
            }
        }
    }
}
