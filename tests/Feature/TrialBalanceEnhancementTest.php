<?php

use App\Models\Coa;
use App\Models\Journal;
use App\Models\User;
use Database\Seeders\CoaSeeder;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('authenticated users can see correct trial balance with opening, mutation, and ending columns', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaKas = Coa::where('user_id', $this->user->id)->where('kode_akun', '01.1000.01.01')->first(); // Kas Toko (debit normal)
    $coaModal = Coa::where('user_id', $this->user->id)->where('kode_akun', '03.1000.01.01')->first(); // Modal Disetor (kredit normal)
    $coaBeban = Coa::where('user_id', $this->user->id)->where('kode_akun', '05.2000.01.01')->first(); // Beban Listrik (debit normal)

    // 1. Create a transaction before the period (Saldo Awal) -> e.g. 2026-01-15
    // Date range of report is set to: start = 2026-02-01, end = 2026-02-28
    $journal1 = Journal::create([
        'user_id' => $this->user->id,
        'tanggal' => '2026-01-15',
        'nomor_jurnal' => 'OP-0001',
        'keterangan' => 'Saldo Awal Modal',
        'tipe_jurnal' => 'umum',
        'jenis_transaksi' => 'saldo_awal',
    ]);
    $journal1->items()->create(['coa_id' => $coaKas->id, 'debit' => 10000000.00, 'kredit' => 0.00]);
    $journal1->items()->create(['coa_id' => $coaModal->id, 'debit' => 0.00, 'kredit' => 10000000.00]);

    // 2. Create a transaction inside the period (Mutasi) -> e.g. 2026-02-15
    $journal2 = Journal::create([
        'user_id' => $this->user->id,
        'tanggal' => '2026-02-15',
        'nomor_jurnal' => 'JV-0001',
        'keterangan' => 'Bayar beban listrik',
        'tipe_jurnal' => 'umum',
        'jenis_transaksi' => 'jurnal_umum',
    ]);
    $journal2->items()->create(['coa_id' => $coaBeban->id, 'debit' => 500000.00, 'kredit' => 0.00]);
    $journal2->items()->create(['coa_id' => $coaKas->id, 'debit' => 0.00, 'kredit' => 500000.00]);

    // Get the report page
    $response = get(route('reports.trial-balance', [
        'start_date' => '2026-02-01',
        'end_date' => '2026-02-28',
    ]))->assertOk();

    $props = $response->inertiaPage()['props'];
    $coas = $props['coas'];

    expect((float) $props['totalAwalDebit'])->toBe(10000000.00);
    expect((float) $props['totalAwalKredit'])->toBe(10000000.00);
    expect((float) $props['totalMutasiDebit'])->toBe(500000.00);
    expect((float) $props['totalMutasiKredit'])->toBe(500000.00);
    expect((float) $props['totalAkhirDebit'])->toBe(10000000.00);
    expect((float) $props['totalAkhirKredit'])->toBe(10000000.00);

    $kas = collect($coas)->firstWhere('id', $coaKas->id);
    $modal = collect($coas)->firstWhere('id', $coaModal->id);
    $beban = collect($coas)->firstWhere('id', $coaBeban->id);

    expect($kas)->not->toBeNull();
    expect((float) $kas['saldo_awal_debit'])->toBe(10000000.00);
    expect((float) $kas['saldo_awal_kredit'])->toBe(0.00);
    expect((float) $kas['mutasi_debit'])->toBe(0.00);
    expect((float) $kas['mutasi_kredit'])->toBe(500000.00);
    expect((float) $kas['saldo_akhir_debit'])->toBe(9500000.00);
    expect((float) $kas['saldo_akhir_kredit'])->toBe(0.00);

    expect($modal)->not->toBeNull();
    expect((float) $modal['saldo_awal_debit'])->toBe(0.00);
    expect((float) $modal['saldo_awal_kredit'])->toBe(10000000.00);
    expect((float) $modal['mutasi_debit'])->toBe(0.00);
    expect((float) $modal['mutasi_kredit'])->toBe(0.00);
    expect((float) $modal['saldo_akhir_debit'])->toBe(0.00);
    expect((float) $modal['saldo_akhir_kredit'])->toBe(10000000.00);

    expect($beban)->not->toBeNull();
    expect((float) $beban['saldo_awal_debit'])->toBe(0.00);
    expect((float) $beban['saldo_awal_kredit'])->toBe(0.00);
    expect((float) $beban['mutasi_debit'])->toBe(500000.00);
    expect((float) $beban['mutasi_kredit'])->toBe(0.00);
    expect((float) $beban['saldo_akhir_debit'])->toBe(500000.00);
    expect((float) $beban['saldo_akhir_kredit'])->toBe(0.00);
});
