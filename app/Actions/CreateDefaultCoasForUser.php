<?php

namespace App\Actions;

use App\Models\Coa;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class CreateDefaultCoasForUser
{
    /**
     * Create default Chart of Accounts for the given user from JSON data.
     */
    public function execute(User $user): void
    {
        $jsonPath = database_path('data/default_coas.json');

        if (! file_exists($jsonPath)) {
            return;
        }

        $jsonContent = file_get_contents($jsonPath);
        $accounts = json_decode($jsonContent, true);

        if (! is_array($accounts)) {
            return;
        }

        DB::transaction(function () use ($user, $accounts) {
            foreach ($accounts as $account) {
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
                    ]
                );
            }
        });
    }
}
