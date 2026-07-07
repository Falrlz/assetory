<?php

use App\Models\Asset;
use App\Models\User;
use Illuminate\Support\Carbon;

test('guests are redirected to the login page when visiting assets list', function () {
    $this->get('/assets')->assertRedirect('/login');
});

test('authenticated users can visit the assets page', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/assets')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('assets/index')
            ->has('assets')
            ->has('assetJournals')
        );
});

test('authenticated users can create a new asset', function () {
    $user = User::factory()->create();

    $data = [
        'nama' => 'Laptop MacBook Air',
        'jenis' => 'inventaris',
        'harga_perolehan' => 15000000,
        'nilai_residu' => 3000000,
        'tanggal_perolehan' => '2026-01-01',
        'periode' => 'periode_1',
    ];

    $this->actingAs($user)
        ->post('/assets', $data)
        ->assertRedirect('/assets');

    $this->assertDatabaseHas('assets', [
        'user_id' => $user->id,
        'nama' => 'Laptop MacBook Air',
        'jenis' => 'inventaris',
        'harga_perolehan' => 15000000.00,
        'nilai_residu' => 3000000.00,
        'tanggal_perolehan' => '2026-01-01 00:00:00',
        'periode' => 'periode_1',
    ]);
});

test('depreciation calculation logic is correct (straight-line)', function () {
    $user = User::factory()->create();

    // Tanggal perolehan: 12 bulan yang lalu
    $tanggalPerolehan = Carbon::now()->subMonths(12)->format('Y-m-d');

    $asset = Asset::factory()->create([
        'user_id' => $user->id,
        'nama' => 'Mesin Fotokopi',
        'jenis' => 'inventaris',
        'harga_perolehan' => 10000000.00,
        'nilai_residu' => 2000000.00,
        'tanggal_perolehan' => $tanggalPerolehan,
        'periode' => 'periode_1', // 4 Tahun = 48 Bulan
    ]);

    // Perhitungan matematika:
    // Depresiasi per tahun = (10M - 2M) / 4 = 2.000.000
    // Depresiasi per bulan = (10M - 2M) / 48 = 166.666,67
    // Akumulasi penyusutan = 166.666,67 * 12 = 2.000.000,04
    // Nilai buku = 10.000.000 - 2.000.000,04 = 7.999.999,96

    expect($asset->penyusutan_tahunan)->toBe(2000000.0);
    expect($asset->penyusutan_bulanan)->toBe(166666.67);
    expect($asset->masa_penggunaan_bulan)->toBe(12);
    expect($asset->akumulasi_penyusutan)->toBe(2000000.04);
    expect($asset->nilai_buku)->toBe(7999999.96);
});
