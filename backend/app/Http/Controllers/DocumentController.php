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

        return response()->json($document->refresh(), 201);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        if ($document->user_id !== $request->user()->id) {
            abort(403);
        }

        return response()->json($document);
    }

    public function preview(Request $request, Document $document): \Illuminate\Http\Response
    {
        if ($document->user_id !== $request->user()->id) {
            abort(403);
        }

        $path = $document->storage_path;

        if (!Storage::disk('local')->exists($path)) {
            abort(404);
        }

        $mime = match ($document->file_type) {
            'pdf'  => 'application/pdf',
            'txt'  => 'text/plain; charset=utf-8',
            default => 'application/octet-stream',
        };

        return response(Storage::disk('local')->get($path), 200, [
            'Content-Type'        => $mime,
            'Content-Disposition' => 'inline; filename="' . $document->original_filename . '"',
            'Cache-Control'       => 'no-store',
        ]);
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
