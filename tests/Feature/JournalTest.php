<?php

use App\Models\Asset;
use App\Models\Coa;
use App\Models\Journal;
use App\Models\User;
use Database\Seeders\CoaSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('guests are redirected to login page when visiting journals list', function () {
    get(route('journals.index'))
        ->assertRedirect(route('login'));
});

test('authenticated users can visit journals page', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    get(route('journals.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('journals/index')
            ->has('journals')
            ->has('coas')
            ->has('postedMonths')
        );
});

test('authenticated users can create balanced manual journal', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaDebit = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-1000')->first(); // Kas
    $coaKredit = Coa::where('user_id', $this->user->id)->where('kode_akun', '3-1000')->first(); // Modal

    $payload = [
        'tanggal' => '2026-07-06',
        'keterangan' => 'Suntikan Modal Pemilik',
        'items' => [
            [
                'coa_id' => $coaDebit->id,
                'debit' => 10000000.00,
                'kredit' => 0.00,
            ],
            [
                'coa_id' => $coaKredit->id,
                'debit' => 0.00,
                'kredit' => 10000000.00,
            ],
        ],
    ];

    post(route('journals.store'), $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('journals', [
        'user_id' => $this->user->id,
        'keterangan' => 'Suntikan Modal Pemilik',
        'tipe_jurnal' => 'umum',
    ]);

    $journal = Journal::where('user_id', $this->user->id)->first();

    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coaDebit->id,
        'debit' => 10000000.00,
        'kredit' => 0.00,
    ]);

    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coaKredit->id,
        'debit' => 0.00,
        'kredit' => 10000000.00,
    ]);
});

test('authenticated users cannot create unbalanced manual journal', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaDebit = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-1000')->first();
    $coaKredit = Coa::where('user_id', $this->user->id)->where('kode_akun', '3-1000')->first();

    $payload = [
        'tanggal' => '2026-07-06',
        'keterangan' => 'Suntikan Modal Pemilik Tidak Seimbang',
        'items' => [
            [
                'coa_id' => $coaDebit->id,
                'debit' => 10000000.00, // Debit 10jt
                'kredit' => 0.00,
            ],
            [
                'coa_id' => $coaKredit->id,
                'debit' => 0.00,
                'kredit' => 9000000.00, // Kredit 9jt (unbalanced!)
            ],
        ],
    ];

    post(route('journals.store'), $payload)
        ->assertSessionHasErrors(['items']);
});

test('creating a new asset automatically posts asset acquisition journal', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaInventaris = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-3000')->first();
    $coaKas = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-1000')->first();

    $payload = [
        'nama' => 'Meja Kerja Premium',
        'jenis' => 'inventaris',
        'harga_perolehan' => 5000000.00,
        'nilai_residu' => 1000000.00,
        'tanggal_perolehan' => '2026-07-01',
        'periode' => 'periode_1',
        'coa_debit_id' => $coaInventaris->id,
        'coa_kredit_id' => $coaKas->id,
    ];

    post(route('assets.store'), $payload)
        ->assertRedirect('/assets');

    $asset = Asset::where('user_id', $this->user->id)->first();

    // Check Journal exists
    $this->assertDatabaseHas('journals', [
        'user_id' => $this->user->id,
        'tipe_jurnal' => 'perolehan_aset',
        'ref_id' => $asset->id,
    ]);

    $journal = Journal::where('user_id', $this->user->id)
        ->where('tipe_jurnal', 'perolehan_aset')
        ->first();

    $coaInventaris = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-3000')->first();
    $coaKas = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-1000')->first();

    // Debit: Inventaris
    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coaInventaris->id,
        'debit' => 5000000.00,
        'kredit' => 0.00,
    ]);

    // Kredit: Kas & Bank
    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coaKas->id,
        'debit' => 0.00,
        'kredit' => 5000000.00,
    ]);
});

test('posting monthly depreciation creates appropriate journal entries and prevents duplication', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    // Create an asset acquired in 2026-06-15
    $asset = Asset::factory()->create([
        'user_id' => $this->user->id,
        'nama' => 'Komputer Kantor',
        'jenis' => 'inventaris',
        'harga_perolehan' => 10000000.00,
        'nilai_residu' => 2000000.00,
        'tanggal_perolehan' => '2026-06-15',
        'periode' => 'periode_1', // 4 tahun = 48 bulan. Depresiasi bulanan = (10jt - 2jt) / 48 = 166.666,67
    ]);

    // Post depreciation for 2026-07 (first full month or following month)
    post(route('journals.depreciation'), [
        'bulan' => '2026-07',
    ])->assertRedirect();

    $coaBeban = Coa::where('user_id', $this->user->id)->where('kode_akun', '5-1000')->first(); // Beban Penyusutan Peralatan
    $coaAkm = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-3001')->first(); // Akumulasi Penyusutan Peralatan

    $this->assertDatabaseHas('journals', [
        'user_id' => $this->user->id,
        'tipe_jurnal' => 'penyusutan',
        'ref_id' => $asset->id,
        'tanggal' => '2026-07-31 00:00:00', // End of target month
    ]);

    $journal = Journal::where('user_id', $this->user->id)
        ->where('tipe_jurnal', 'penyusutan')
        ->first();

    // Debit: Beban
    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coaBeban->id,
        'debit' => 166666.67,
    ]);

    // Kredit: Akumulasi
    $this->assertDatabaseHas('journal_items', [
        'journal_id' => $journal->id,
        'coa_id' => $coaAkm->id,
        'kredit' => 166666.67,
    ]);

    // Test: posting duplicate month fails
    $this->post(route('journals.depreciation'), [
        'bulan' => '2026-07',
    ])->assertSessionHasErrors(['bulan']);
});

test('ledger queries return rolling balances correctly', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coa = Coa::where('user_id', $this->user->id)->where('kode_akun', '1-1000')->first(); // Kas (Normal: Debit)
    $coaModal = Coa::where('user_id', $this->user->id)->where('kode_akun', '3-1000')->first();

    // Transaction 1: Add Cash 10,000,000 (Debit)
    $j1 = Journal::create([
        'user_id' => $this->user->id,
        'tanggal' => '2026-07-01',
        'nomor_jurnal' => 'JV-202607-0001',
        'keterangan' => 'Modal awal',
        'tipe_jurnal' => 'umum',
    ]);
    $j1->items()->create(['coa_id' => $coa->id, 'debit' => 10000000.00, 'kredit' => 0.00]);
    $j1->items()->create(['coa_id' => $coaModal->id, 'debit' => 0.00, 'kredit' => 10000000.00]);

    // Transaction 2: Spend Cash 3,000,000 (Kredit)
    $j2 = Journal::create([
        'user_id' => $this->user->id,
        'tanggal' => '2026-07-02',
        'nomor_jurnal' => 'JV-202607-0002',
        'keterangan' => 'Belanja alat tulis',
        'tipe_jurnal' => 'umum',
    ]);
    $j2->items()->create(['coa_id' => $coa->id, 'debit' => 0.00, 'kredit' => 3000000.00]);

    // Fetch index with coa_id query
    $response = get(route('journals.index', ['coa_id' => $coa->id]))
        ->assertOk();

    $ledgerItems = $response->viewData('page')['props']['ledgerItems'];

    // Transaction 1: balance should be 10,000,000
    expect($ledgerItems[0]['saldo_berjalan'])->toEqual(10000000.00);
    // Transaction 2: balance should be 7,000,000
    expect($ledgerItems[1]['saldo_berjalan'])->toEqual(7000000.00);
});
