<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /** Membuat akun contoh yang dapat digunakan pada lingkungan pengembangan. */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Fal',
            'email' => 'fal@example.com',
            'password' => bcrypt('password'),
        ]);
    }
}
