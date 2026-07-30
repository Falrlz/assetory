<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('equity change report allows valid year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.equity-change', [
            'year' => '2026',
        ]))
        ->assertOk();
});

test('equity change report validates year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.equity-change', [
            'year' => 'invalid-year',
        ]))
        ->assertSessionHasErrors(['year']);
});

test('calk report allows valid year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.calk', [
            'year' => '2026',
        ]))
        ->assertOk();
});

test('calk report validates year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.calk', [
            'year' => 'invalid-year',
        ]))
        ->assertSessionHasErrors(['year']);
});

test('can save calk notes successfully', function () {
    $this->actingAs($this->user)
        ->post(route('reports.calk.update'), [
            'calk_notes' => 'Kebijakan Akuntansi Baru Perusahaan',
        ])
        ->assertRedirect();

    expect($this->user->fresh()->calk_notes)->toBe('Kebijakan Akuntansi Baru Perusahaan');
});
