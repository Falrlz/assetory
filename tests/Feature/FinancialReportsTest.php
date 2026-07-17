<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('equity change report allows same year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.equity-change', [
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
        ]))
        ->assertOk();
});

test('equity change report rejects cross year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.equity-change', [
            'start_date' => '2026-11-01',
            'end_date' => '2027-02-01',
        ]))
        ->assertSessionHasErrors(['start_date']);
});

test('calk report allows same year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.calk', [
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
        ]))
        ->assertOk();
});

test('calk report rejects cross year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.calk', [
            'start_date' => '2026-11-01',
            'end_date' => '2027-02-01',
        ]))
        ->assertSessionHasErrors(['start_date']);
});

test('can save calk notes successfully', function () {
    $this->actingAs($this->user)
        ->post(route('reports.calk.update'), [
            'calk_notes' => 'Kebijakan Akuntansi Baru Perusahaan',
        ])
        ->assertRedirect();

    expect($this->user->fresh()->calk_notes)->toBe('Kebijakan Akuntansi Baru Perusahaan');
});
