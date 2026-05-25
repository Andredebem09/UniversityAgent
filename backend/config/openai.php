<?php

return [
    'api_key'         => env('AI_API_KEY'),
    'base_uri'        => 'https://api.deepseek.com/',
    'model'           => env('AI_MODEL', 'deepseek-chat'),
    'request_timeout' => env('AI_REQUEST_TIMEOUT', 90),
];
