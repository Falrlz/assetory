<?php

use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Artisan;

it('can lock previous year automatically', function () {
    // Clean up existing users to avoid side-effects from seeders
    User::query()->delete();

    $user1 = User::factory()->create(['lock_date' => null]);
    $user2 = User::factory()->create(['lock_date' => '2023-12-31']);

    // Set fake current time to Jan 1st, 2027
    Carbon::setTestNow('2027-01-01 00:00:00');

    Artisan::call('app:lock-year');

    expect($user1->fresh()->lock_date->toDateString())->toBe('2026-12-31')
        ->and($user2->fresh()->lock_date->toDateString())->toBe('2026-12-31');

    Carbon::setTestNow(); // Reset test time
});

it('can lock a specific year when option is provided', function () {
    // Clean up existing users
    User::query()->delete();

    $user = User::factory()->create(['lock_date' => null]);

    Artisan::call('app:lock-year', ['--year' => '2024']);

    expect($user->fresh()->lock_date->toDateString())->toBe('2024-12-31');
});
