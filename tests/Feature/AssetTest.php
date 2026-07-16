<?php

use App\Models\Asset;
use App\Models\Coa;
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

    // Create COAs for the user
    $coaDebit = Coa::create([
        'user_id' => $user->id,
        'kode_akun' => '01.3000.01.04',
        'nama_akun' => 'Peralatan Kantor',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ]);

    $coaKredit = Coa::create([
        'user_id' => $user->id,
        'kode_akun' => '01.1000.01.01',
        'nama_akun' => 'Kas & Bank',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ]);

    $data = [
        'nama' => 'Laptop MacBook Air',
        'jenis' => 'inventaris',
        'harga_perolehan' => 15000000,
        'nilai_residu' => 3000000,
        'tanggal_perolehan' => '2026-01-01',
        'periode' => 'periode_1',
        'coa_debit_id' => $coaDebit->id,
        'coa_kredit_id' => $coaKredit->id,
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
        'coa_debit_id' => $coaDebit->id,
        'coa_kredit_id' => $coaKredit->id,
    ]);

    // Verify journal was automatically created using these COAs
    $this->assertDatabaseHas('journals', [
        'user_id' => $user->id,
        'tipe_jurnal' => 'perolehan_aset',
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

test('cannot create asset with acquisition date on or before lock date', function () {
    $user = User::factory()->create(['lock_date' => '2026-06-30']);

    // Create COAs for the user
    $coaDebit = Coa::create([
        'user_id' => $user->id,
        'kode_akun' => '01.3000.01.04',
        'nama_akun' => 'Peralatan Kantor',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ]);

    $coaKredit = Coa::create([
        'user_id' => $user->id,
        'kode_akun' => '01.1000.01.01',
        'nama_akun' => 'Kas & Bank',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ]);

    $data = [
        'nama' => 'Laptop MacBook Air',
        'jenis' => 'inventaris',
        'harga_perolehan' => 15000000,
        'nilai_residu' => 3000000,
        'tanggal_perolehan' => '2026-06-15', // Locked (before lock_date)
        'periode' => 'periode_1',
        'coa_debit_id' => $coaDebit->id,
        'coa_kredit_id' => $coaKredit->id,
    ];

    $this->actingAs($user)
        ->post('/assets', $data)
        ->assertSessionHasErrors(['tanggal_perolehan']);

    // Assert that asset was not created
    $this->assertDatabaseMissing('assets', [
        'user_id' => $user->id,
        'nama' => 'Laptop MacBook Air',
    ]);
});
