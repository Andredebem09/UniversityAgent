<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessDocument;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class DocumentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $documents = $request->user()
            ->documents()
            ->orderByDesc('created_at')
            ->get();

        return response()->json($documents);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,txt,docx', 'max:20480'],
        ]);

        $file = $request->file('file');
        $path = $file->store('documents', 'local');

        $document = Document::create([
            'user_id'           => $request->user()->id,
            'title'             => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'original_filename' => $file->getClientOriginalName(),
            'storage_path'      => $path,
            'file_type'         => $file->getClientOriginalExtension(),
            'file_size'         => $file->getSize(),
            'status'            => 'pending',
        ]);

        ProcessDocument::dispatch($document);

        return response()->json($document, 201);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        if ($document->user_id !== $request->user()->id) {
            abort(403);
        }

        return response()->json($document);
    }

    public function destroy(Request $request, Document $document): JsonResponse
    {
        if ($document->user_id !== $request->user()->id) {
            abort(403);
        }

        Storage::disk('local')->delete($document->storage_path);
        $document->delete();

        return response()->json(null, 204);
    }
}
