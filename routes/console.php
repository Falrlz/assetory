<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Menampilkan kutipan inspiratif');

// Catat penyusutan aset secara otomatis pada hari terakhir setiap bulan.
Schedule::command('asset:depreciate')->lastDayOfMonth();

// Kunci periode akuntansi tahun sebelumnya satu kali setiap tahun.
Schedule::command('app:lock-year')->yearly();
