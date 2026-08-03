<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * Menyiapkan template utama dan data bersama untuk setiap respons Inertia.
 */
class HandleInertiaRequests extends Middleware
{
    /**
     * Template utama yang dimuat saat halaman pertama kali dikunjungi.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Menentukan versi aset frontend untuk mekanisme pembaruan Inertia.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Menentukan props yang tersedia secara otomatis pada seluruh halaman Inertia.
     *
     * Data bersama mencakup identitas aplikasi, kutipan acak, dan pengguna
     * yang sedang terautentikasi.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return array_merge(parent::share($request), [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
            ],
        ]);
    }
}
