<?php

namespace Database\Seeders;

use App\Actions\CreateDefaultCoasForUser;
use App\Models\User;
use Illuminate\Database\Seeder;

class CoaSeeder extends Seeder
{
    /** Mengimpor bagan akun standar dari JSON untuk setiap pengguna. */
    public function run(): void
    {
        $users = User::all();
        $action = new CreateDefaultCoasForUser;

        foreach ($users as $user) {
            $action->execute($user);
        }
    }
}
