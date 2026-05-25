<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    protected $fillable = [
        'user_id',
        'title',
        'original_filename',
        'storage_path',
        'file_type',
        'file_size',
        'status',
        'summary',
        'error_message',
    ];

    protected function casts(): array
    {
        return ['file_size' => 'integer'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
