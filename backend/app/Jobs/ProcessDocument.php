<?php

namespace App\Jobs;

use App\Models\Document;
use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Exception\BadResponseException;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpWord\IOFactory;
use Smalot\PdfParser\Parser as PdfParser;

class ProcessDocument implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 120;
    public int $tries   = 2;

    public function __construct(public Document $document) {}

    public function handle(): void
    {
        $ctx = ['document_id' => $this->document->id, 'file' => $this->document->original_filename];

        Log::info('[ProcessDocument] Job iniciado.', $ctx);
        $this->document->update(['status' => 'processing']);

        try {
            Log::info('[ProcessDocument] Extraindo texto.', $ctx);
            $text      = $this->extractText();
            $charCount = mb_strlen(trim($text));
            Log::info("[ProcessDocument] Texto extraído: {$charCount} caracteres.", $ctx);

            if ($charCount < 50) {
                throw new \RuntimeException('Não foi possível extrair texto suficiente do documento.');
            }

            $text    = mb_substr($text, 0, 48000);
            $model   = config('openai.model', 'deepseek-chat');
            $baseUri = config('openai.base_uri');

            Log::info('[ProcessDocument] Chamando API IA.', array_merge($ctx, ['model' => $model]));

            $http = new GuzzleClient(['base_uri' => $baseUri, 'timeout' => config('openai.request_timeout', 90)]);

            try {
                $apiResponse = $http->post('chat/completions', [
                    'headers' => [
                        'Authorization' => 'Bearer ' . config('openai.api_key'),
                        'Content-Type'  => 'application/json',
                    ],
                    'json' => [
                        'model'    => $model,
                        'messages' => [
                            [
                                'role'    => 'system',
                                'content' => 'Você é um assistente acadêmico especializado em resumos para estudantes universitários. Resuma o documento fornecido em português, de forma clara e estruturada. Use tópicos para destacar os pontos principais, conceitos-chave e conclusões. Seja conciso mas completo.',
                            ],
                            [
                                'role'    => 'user',
                                'content' => "Resuma o seguinte documento:\n\n{$text}",
                            ],
                        ],
                        'max_tokens' => 1024,
                    ],
                ]);
            } catch (BadResponseException $e) {
                $body       = (string) $e->getResponse()->getBody();
                $decoded    = json_decode($body, true);
                $apiMessage = $decoded['error']['message'] ?? ($decoded[0]['error']['message'] ?? $body);
                throw new \RuntimeException('Erro na API de IA: ' . $apiMessage);
            }

            $body    = json_decode((string) $apiResponse->getBody(), true);
            $summary = $body['choices'][0]['message']['content'];

            Log::info('[ProcessDocument] Resumo gerado com sucesso.', $ctx);

            $this->document->update(['status' => 'completed', 'summary' => $summary]);
        } catch (\Throwable $e) {
            Log::error('[ProcessDocument] Falha.', array_merge($ctx, ['error' => $e->getMessage()]));
            $this->document->update(['status' => 'failed', 'error_message' => $e->getMessage()]);
        }
    }

    private function extractText(): string
    {
        $path = Storage::disk('local')->path($this->document->storage_path);

        return match ($this->document->file_type) {
            'pdf'  => (new PdfParser())->parseFile($path)->getText(),
            'txt'  => file_get_contents($path),
            'docx' => $this->extractDocx($path),
            default => throw new \RuntimeException("Tipo não suportado: {$this->document->file_type}"),
        };
    }

    private function extractDocx(string $path): string
    {
        $phpWord = IOFactory::load($path);
        $text    = '';

        foreach ($phpWord->getSections() as $section) {
            foreach ($section->getElements() as $element) {
                if (method_exists($element, 'getText')) {
                    $text .= $element->getText() . "\n";
                } elseif (method_exists($element, 'getElements')) {
                    foreach ($element->getElements() as $child) {
                        if (method_exists($child, 'getText')) {
                            $text .= $child->getText() . ' ';
                        }
                    }
                    $text .= "\n";
                }
            }
        }

        return $text;
    }
}
