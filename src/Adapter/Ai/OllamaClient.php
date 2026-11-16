<?php
/**
 * Copyright since 2007 PrestaShop SA and Contributors
 * PrestaShop is an International Registered Trademark & Property of PrestaShop SA
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the Open Software License (OSL 3.0)
 * that is bundled with this package in the file LICENSE.md.
 * It is also available through the world-wide-web at this URL:
 * https://opensource.org/licenses/OSL-3.0
 * If you did not receive a copy of the license and are unable to
 * obtain it through the world-wide-web, please send an email
 * to license@prestashop.com so we can send you a copy immediately.
 *
 * @author    PrestaShop SA and Contributors <contact@prestashop.com>
 * @copyright Since 2007 PrestaShop SA and Contributors
 * @license   https://opensource.org/licenses/OSL-3.0 Open Software License (OSL 3.0)
 */

declare(strict_types=1);

namespace PrestaShop\PrestaShop\Adapter\Ai;

use RuntimeException;
use Symfony\Contracts\HttpClient\HttpClientInterface;

/**
 * Minimal client for a local Ollama server (/api/generate, non streaming).
 */
final class OllamaClient
{
    public function __construct(
        private readonly HttpClientInterface $httpClient,
        private readonly string $baseUrl,
        private readonly string $model,
    ) {
    }

    public function generate(string $system, string $prompt): string
    {
        $response = $this->httpClient->request('POST', rtrim($this->baseUrl, '/') . '/api/generate', [
            'json' => [
                'model' => $this->model,
                'system' => $system,
                'prompt' => $prompt,
                'stream' => false,
                // Low temperature: the assistants must restate facts, not be creative.
                'options' => ['temperature' => 0.2],
            ],
            'timeout' => 300,
        ]);
        $data = $response->toArray(false);
        if (!isset($data['response']) || !is_string($data['response'])) {
            throw new RuntimeException('Unexpected Ollama response: ' . substr($response->getContent(false), 0, 200));
        }

        return trim($data['response']);
    }

    public function getModel(): string
    {
        return $this->model;
    }
}
