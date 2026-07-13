<?php

use App\Models\User;
use Database\Seeders\CoaSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('guests are redirected to the login page when visiting beginning balance page', function () {
    get(route('beginning-balances.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can visit the beginning balance page and see transactional coas', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    // Get number of transactional COAs (Level 4, length === 4 when split by dot)
    $transactionalCoasCount = $this->user->coas()
        ->orderBy('kode_akun')
        ->get()
        ->filter(fn ($coa) => count(explode('.', $coa->kode_akun)) === 4)
        ->count();

    get(route('beginning-balances.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('beginning-balances/index')
            ->has('coas', $transactionalCoasCount)
            ->has('openingDate')
        );
});

test('storing beginning balances with unequal debit and credit sums fails validation', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    // Find two transaction COAs
    $coa1 = $this->user->coas()->where('kode_akun', '01.1000.01.01')->first(); // Kas Toko (debit)
    $coa2 = $this->user->coas()->where('kode_akun', '03.1000.01.01')->first(); // Modal disetor (kredit)

    $payload = [
        'tanggal' => '2026-01-01',
        'balances' => [
            ['coa_id' => $coa1->id, 'debit' => 1000000, 'kredit' => 0],
            ['coa_id' => $coa2->id, 'debit' => 0, 'kredit' => 900000], // Unequal!
        ],
    ];

    post(route('beginning-balances.store'), $payload)
        ->assertSessionHasErrors(['balances']);
});

test('storing beginning balances with equal debit and credit sums succeeds', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coa1 = $this->user->coas()->where('kode_akun', '01.1000.01.01')->first(); // Kas Toko (debit)
    $coa2 = $this->user->coas()->where('kode_akun', '03.1000.01.01')->first(); // Modal disetor (kredit)

    $payload = [
        'tanggal' => '2026-01-01',
        'balances' => [
            ['coa_id' => $coa1->id, 'debit' => 1000000, 'kredit' => 0],
            ['coa_id' => $coa2->id, 'debit' => 0, 'kredit' => 1000000], // Equal!
        ],
    ];

    post(route('beginning-balances.store'), $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('journals', [
        'user_id' => $this->user->id,
        'tanggal' => '2026-01-01 00:00:00',
        'keterangan' => 'Saldo Awal',
        'jenis_transaksi' => 'saldo_awal',
    ]);

    $journal = $this->user->journals()->where('jenis_transaksi', 'saldo_awal')->first();

    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coa1->id,
        'debit' => 1000000.00,
        'kredit' => 0.00,
    ]);

    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coa2->id,
        'debit' => 0.00,
        'kredit' => 1000000.00,
    ]);
});

test('updating beginning balances replaces existing journal and items', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coa1 = $this->user->coas()->where('kode_akun', '01.1000.01.01')->first(); // Kas Toko
    $coa2 = $this->user->coas()->where('kode_akun', '03.1000.01.01')->first(); // Modal disetor

    // First save
    $payload1 = [
        'tanggal' => '2026-01-01',
        'balances' => [
            ['coa_id' => $coa1->id, 'debit' => 1000000, 'kredit' => 0],
            ['coa_id' => $coa2->id, 'debit' => 0, 'kredit' => 1000000],
        ],
    ];
    post(route('beginning-balances.store'), $payload1)->assertRedirect();

    // Second save (updating with new values)
    $payload2 = [
        'tanggal' => '2026-01-02',
        'balances' => [
            ['coa_id' => $coa1->id, 'debit' => 2500000, 'kredit' => 0],
            ['coa_id' => $coa2->id, 'debit' => 0, 'kredit' => 2500000],
        ],
    ];
    post(route('beginning-balances.store'), $payload2)->assertRedirect();

    // Verify old journal with old date is gone
    $this->assertDatabaseMissing('journals', [
        'user_id' => $this->user->id,
        'tanggal' => '2026-01-01 00:00:00',
    ]);

    // Verify new journal exists
    $this->assertDatabaseHas('journals', [
        'user_id' => $this->user->id,
        'tanggal' => '2026-01-02 00:00:00',
        'keterangan' => 'Saldo Awal',
        'jenis_transaksi' => 'saldo_awal',
    ]);

    $journal = $this->user->journals()->where('jenis_transaksi', 'saldo_awal')->first();

    // Verify old items are deleted (cascade) and only new items exist
    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coa1->id,
        'debit' => 2500000.00,
    ]);

    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coa2->id,
        'kredit' => 2500000.00,
    ]);
});
