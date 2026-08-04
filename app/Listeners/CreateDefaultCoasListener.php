<?php

namespace App\Listeners;

use App\Actions\CreateDefaultCoasForUser;
use Illuminate\Auth\Events\Registered;

class CreateDefaultCoasListener
{
    /**
     * Create the event listener.
     */
    public function __construct(
        protected CreateDefaultCoasForUser $createDefaultCoasAction
    ) {}

    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        $this->createDefaultCoasAction->execute($event->user);
    }
}
