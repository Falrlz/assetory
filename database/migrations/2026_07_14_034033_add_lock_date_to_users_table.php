<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /** Menambahkan batas tanggal terakhir periode pembukuan yang dikunci. */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->date('lock_date')->nullable()->after('password');
        });
    }

    /** Menghapus tanggal penguncian pembukuan dari pengguna. */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('lock_date');
        });
    }
};
