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

        $defaultAccounts = [
            [
                'kode_akun' => '1-1000',
                'nama_akun' => 'Kas & Bank',
                'kategori' => 'aset',
                'saldo_normal' => 'debit',
            ],
            [
                'kode_akun' => '1-3000',
                'nama_akun' => 'Inventaris & Peralatan',
                'kategori' => 'aset',
                'saldo_normal' => 'debit',
            ],
            [
                'kode_akun' => '1-3001',
                'nama_akun' => 'Akumulasi Penyusutan Peralatan',
                'kategori' => 'aset',
                'saldo_normal' => 'kredit',
            ],
            [
                'kode_akun' => '1-4000',
                'nama_akun' => 'Aset Kendaraan',
                'kategori' => 'aset',
                'saldo_normal' => 'debit',
            ],
            [
                'kode_akun' => '1-4001',
                'nama_akun' => 'Akumulasi Penyusutan Kendaraan',
                'kategori' => 'aset',
                'saldo_normal' => 'kredit',
            ],
            [
                'kode_akun' => '1-5000',
                'nama_akun' => 'Aset Gedung',
                'kategori' => 'aset',
                'saldo_normal' => 'debit',
            ],
            [
                'kode_akun' => '1-5001',
                'nama_akun' => 'Akumulasi Penyusutan Gedung',
                'kategori' => 'aset',
                'saldo_normal' => 'kredit',
            ],
            [
                'kode_akun' => '2-1000',
                'nama_akun' => 'Utang Usaha',
                'kategori' => 'kewajiban',
                'saldo_normal' => 'kredit',
            ],
            [
                'kode_akun' => '3-1000',
                'nama_akun' => 'Modal Pemilik',
                'kategori' => 'ekuitas',
                'saldo_normal' => 'kredit',
            ],
            [
                'kode_akun' => '5-1000',
                'nama_akun' => 'Beban Penyusutan Peralatan',
                'kategori' => 'beban',
                'saldo_normal' => 'debit',
            ],
            [
                'kode_akun' => '5-1001',
                'nama_akun' => 'Beban Penyusutan Kendaraan',
                'kategori' => 'beban',
                'saldo_normal' => 'debit',
            ],
            [
                'kode_akun' => '5-1002',
                'nama_akun' => 'Beban Penyusutan Gedung',
                'kategori' => 'beban',
                'saldo_normal' => 'debit',
            ],
        ];

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
                    ]
                );
            }
        }
    }
}
