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

test('profit and loss report rejects cross year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.profit-loss', [
            'start_date' => '2026-11-01',
            'end_date' => '2027-02-01',
        ]))
        ->assertSessionHasErrors(['start_date']);
});

test('profit and loss report allows same year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.profit-loss', [
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
        ]))
        ->assertOk();
});

test('cash flow report rejects cross year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.cash-flow', [
            'start_date' => '2026-11-01',
            'end_date' => '2027-02-01',
        ]))
        ->assertSessionHasErrors(['start_date']);
});

test('cash flow report allows same year date range', function () {
    $this->actingAs($this->user)
        ->get(route('reports.cash-flow', [
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
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
