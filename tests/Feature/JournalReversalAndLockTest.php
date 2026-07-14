<?php

use App\Models\Coa;
use App\Models\Journal;
use App\Models\User;
use Database\Seeders\CoaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\patch;
use function Pest\Laravel\post;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('authenticated users can update accounting lock date', function () {
    actingAs($this->user);

    patch(route('settings.accounting.update'), [
        'lock_date' => '2026-06-30',
    ])->assertRedirect();

    $this->user->refresh();
    expect($this->user->lock_date?->format('Y-m-d'))->toBe('2026-06-30');
});

test('cannot create journal before or on lock date', function () {
    $this->user->update(['lock_date' => '2026-06-30']);
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaDebit = Coa::where('user_id', $this->user->id)->where('kode_akun', '01.1000.01.01')->first();
    $coaKredit = Coa::where('user_id', $this->user->id)->where('kode_akun', '03.1000.01.01')->first();

    // Create journal on 2026-06-15 (locked)
    $payload = [
        'tanggal' => '2026-06-15',
        'jenis_transaksi' => 'jurnal_umum',
        'kategori_arus_kas' => 'operasional',
        'kode_arus_kas' => 'JU-O',
        'keterangan' => 'Jurnal terkunci',
        'items' => [
            ['coa_id' => $coaDebit->id, 'debit' => 1000.00, 'kredit' => 0.00],
            ['coa_id' => $coaKredit->id, 'debit' => 0.00, 'kredit' => 1000.00],
        ],
    ];

    post(route('journals.store'), $payload)
        ->assertSessionHasErrors(['tanggal']);
});

test('cannot delete journal before or on lock date', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaDebit = Coa::where('user_id', $this->user->id)->where('kode_akun', '01.1000.01.01')->first();
    $coaKredit = Coa::where('user_id', $this->user->id)->where('kode_akun', '03.1000.01.01')->first();

    // Create journal on 2026-06-15 (unlocked initially)
    $journal = Journal::create([
        'user_id' => $this->user->id,
        'tanggal' => '2026-06-15',
        'nomor_jurnal' => 'JV-0001',
        'keterangan' => 'Normal Journal',
        'tipe_jurnal' => 'umum',
    ]);
    $journal->items()->create(['coa_id' => $coaDebit->id, 'debit' => 1000.00, 'kredit' => 0.00]);
    $journal->items()->create(['coa_id' => $coaKredit->id, 'debit' => 0.00, 'kredit' => 1000.00]);

    // Update user lock_date to lock 2026-06-15
    $this->user->update(['lock_date' => '2026-06-30']);

    // Attempt to delete
    delete(route('journals.destroy', $journal->id))
        ->assertSessionHasErrors(['journal']);
});

test('cannot modify beginning balance on locked date', function () {
    $this->user->update(['lock_date' => '2026-06-30']);
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaDebit = Coa::where('user_id', $this->user->id)->where('kode_akun', '01.1000.01.01')->first();
    $coaKredit = Coa::where('user_id', $this->user->id)->where('kode_akun', '03.1000.01.01')->first();

    // Set opening balance on 2026-01-01 (locked because 2026-01-01 <= 2026-06-30)
    post(route('beginning-balances.store'), [
        'tanggal' => '2026-01-01',
        'balances' => [
            ['coa_id' => $coaDebit->id, 'debit' => 1000.00, 'kredit' => 0.00],
            ['coa_id' => $coaKredit->id, 'debit' => 0.00, 'kredit' => 1000.00],
        ],
    ])->assertSessionHasErrors(['tanggal']);
});

test('reversing journal swaps debit and credit and links appropriately', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaDebit = Coa::where('user_id', $this->user->id)->where('kode_akun', '01.1000.01.01')->first();
    $coaKredit = Coa::where('user_id', $this->user->id)->where('kode_akun', '03.1000.01.01')->first();

    // Create journal on 2026-06-15
    $journal = Journal::create([
        'user_id' => $this->user->id,
        'tanggal' => '2026-06-15',
        'nomor_jurnal' => 'JV-0001',
        'keterangan' => 'Original entry to reverse',
        'tipe_jurnal' => 'umum',
    ]);
    $journal->items()->create(['coa_id' => $coaDebit->id, 'debit' => 5000.00, 'kredit' => 0.00]);
    $journal->items()->create(['coa_id' => $coaKredit->id, 'debit' => 0.00, 'kredit' => 5000.00]);

    // Lock date
    $this->user->update(['lock_date' => '2026-06-30']);

    // Call reverse
    post(route('journals.reverse', $journal->id))->assertRedirect();

    // Verify original journal updated with reversed_by_id
    $journal->refresh();
    expect($journal->reversed_by_id)->not->toBeNull();

    // Verify reversing journal created with swapped items
    $reversingJournal = Journal::findOrFail($journal->reversed_by_id);
    expect($reversingJournal->reverses_journal_id)->toBe($journal->id);
    expect($reversingJournal->keterangan)->toContain('[Pembalik]');

    $debitItem = $reversingJournal->items()->where('coa_id', $coaKredit->id)->first();
    $kreditItem = $reversingJournal->items()->where('coa_id', $coaDebit->id)->first();

    expect((float) $debitItem->debit)->toBe(5000.00);
    expect((float) $debitItem->kredit)->toBe(0.00);
    expect((float) $kreditItem->debit)->toBe(0.00);
    expect((float) $kreditItem->kredit)->toBe(5000.00);
});

test('cannot delete reversed or reversing journals', function () {
    actingAs($this->user);
    $this->seed(CoaSeeder::class);

    $coaDebit = Coa::where('user_id', $this->user->id)->where('kode_akun', '01.1000.01.01')->first();
    $coaKredit = Coa::where('user_id', $this->user->id)->where('kode_akun', '03.1000.01.01')->first();

    // Create journal
    $journal = Journal::create([
        'user_id' => $this->user->id,
        'tanggal' => '2026-07-15',
        'nomor_jurnal' => 'JV-0001',
        'keterangan' => 'Some journal',
        'tipe_jurnal' => 'umum',
    ]);
    $journal->items()->create(['coa_id' => $coaDebit->id, 'debit' => 1000.00, 'kredit' => 0.00]);
    $journal->items()->create(['coa_id' => $coaKredit->id, 'debit' => 0.00, 'kredit' => 1000.00]);

    // Reverse it
    post(route('journals.reverse', $journal->id))->assertRedirect();
    $journal->refresh();

    // Try to delete original (which is now reversed)
    delete(route('journals.destroy', $journal->id))
        ->assertSessionHasErrors(['journal']);

    // Try to delete reversing journal
    delete(route('journals.destroy', $journal->reversed_by_id))
        ->assertSessionHasErrors(['journal']);
});
