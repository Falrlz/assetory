<?php

use App\Models\Coa;
use App\Models\User;
use Database\Seeders\CoaSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('guests are redirected to the login page when visiting coa list', function () {
    get(route('coas.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can visit the coa page and see default accounts', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    get(route('coas.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('coas/index')
            ->has('coas', 76)
        );
});

test('authenticated users can create a new custom coa', function () {
    actingAs($this->user);

    $payload = [
        'kode_akun' => '01.1000.01.03',
        'nama_akun' => 'Kas Sona',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ];

    post(route('coas.store'), $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('coas', [
        'user_id' => $this->user->id,
        'kode_akun' => '01.1000.01.03',
        'nama_akun' => 'Kas Sona',
    ]);
});

test('authenticated users cannot create duplicate coa code', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $payload = [
        'kode_akun' => '01.1000.01.01',
        'nama_akun' => 'Kas Toko',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ];

    post(route('coas.store'), $payload)
        ->assertSessionHasErrors(['kode_akun']);
});

test('authenticated users can update custom coa', function () {
    actingAs($this->user);

    $coa = Coa::create([
        'user_id' => $this->user->id,
        'kode_akun' => '01.2000.01.05',
        'nama_akun' => 'Piutang Lama',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ]);

    $payload = [
        'kode_akun' => '01.2000.01.06',
        'nama_akun' => 'Piutang Baru',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ];

    put(route('coas.update', $coa->id), $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('coas', [
        'id' => $coa->id,
        'kode_akun' => '01.2000.01.06',
        'nama_akun' => 'Piutang Baru',
    ]);
});

test('authenticated users can delete custom coa', function () {
    actingAs($this->user);

    $coa = Coa::create([
        'user_id' => $this->user->id,
        'kode_akun' => '01.2000.01.05',
        'nama_akun' => 'Piutang Lama',
        'kategori' => 'aset',
        'saldo_normal' => 'debit',
    ]);

    delete(route('coas.destroy', $coa->id))
        ->assertRedirect();

    $this->assertDatabaseMissing('coas', [
        'id' => $coa->id,
    ]);
});
