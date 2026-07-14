<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            $table->foreignId('reversed_by_id')->nullable()->after('ref_id')->constrained('journals')->nullOnDelete();
            $table->foreignId('reverses_journal_id')->nullable()->after('reversed_by_id')->constrained('journals')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            $table->dropForeign(['reversed_by_id']);
            $table->dropForeign(['reverses_journal_id']);
            $table->dropColumn(['reversed_by_id', 'reverses_journal_id']);
        });
    }
};
