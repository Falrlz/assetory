<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Asset>
 */
class AssetFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'nama' => fake()->word(),
            'jenis' => fake()->randomElement(['inventaris', 'kendaraan', 'gedung']),
            'harga_perolehan' => fake()->randomFloat(2, 5000000, 50000000),
            'nilai_residu' => fake()->randomFloat(2, 500000, 4000000),
            'tanggal_perolehan' => fake()->date(),
            'periode' => fake()->randomElement(['periode_1', 'periode_2', 'periode_3', 'periode_4']),
        ];
    }
}
