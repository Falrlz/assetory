<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Menjalankan seluruh seeder utama aplikasi dalam urutan yang dibutuhkan. */
    public function run(): void
    {
        // Pengguna ini menyediakan akun standar untuk pengembangan dan pengujian manual.
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $this->call([
            UserSeeder::class,
            CoaSeeder::class,
            SimulationSeeder::class,
        ]);
    }
}
