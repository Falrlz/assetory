<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('trial balance report rejects cross year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.trial-balance', [
            'start_date' => '2026-11-01',
            'end_date' => '2027-02-01',
        ]))
        ->assertSessionHasErrors(['start_date']);
});

test('trial balance report allows same year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.trial-balance', [
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
        ]))
        ->assertOk();
});

test('profit and loss report validates year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.profit-loss', [
            'year' => 'invalid-year',
        ]))
        ->assertSessionHasErrors(['year']);
});

test('profit and loss report allows valid year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.profit-loss', [
            'year' => '2026',
        ]))
        ->assertOk();
});

test('cash flow report validates year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.cash-flow', [
            'year' => 'invalid-year',
        ]))
        ->assertSessionHasErrors(['year']);
});

test('cash flow report allows valid year parameter', function () {
    $this->actingAs($this->user)
        ->get(route('reports.cash-flow', [
            'year' => '2026',
        ]))
        ->assertOk();
});

test('ledger list rejects cross year date range', function () {
    $this->actingAs($this->user)
        ->get(route('journals.index', [
            'tab' => 'ledger',
            'start_date' => '2026-11-01',
            'end_date' => '2027-02-01',
        ]))
        ->assertSessionHasErrors(['start_date']);
});

test('ledger list allows same year date range', function () {
    $this->actingAs($this->user)
        ->get(route('journals.index', [
            'tab' => 'ledger',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
        ]))
        ->assertOk();
});
