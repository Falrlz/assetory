<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard with metrics props', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('metrics')
            ->has('monthly_trend')
            ->has('recent_journals')
            ->has('asset_breakdown')
        );
});
