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

use Tax;

/**
 * Answers merchant questions about the shop's tax configuration (RF-01, RF-02), grounded on the taxes stored in
 * the shop: the taxes are retrieved first and given to the model as its only source.
 */
final class TaxConfigurationExplainer
{
    private const SYSTEM = 'Eres el asistente de configuración fiscal de una tienda en línea. Respondes en español, en máximo 3 frases. '
        . 'Respondes SOLO con la información del contexto. Si el contexto no contiene la respuesta, di exactamente: '
        . '"No tengo esa información en la configuración de la tienda." No des asesoría legal ni inventes tasas.';

    public function __construct(private readonly OllamaClient $client)
    {
    }

    /**
     * @return array{output: string, context: string[]}
     */
    public function explain(string $question, int $langId): array
    {
        $context = $this->retrieveContext($langId);
        $prompt = sprintf("Contexto (impuestos configurados en la tienda):\n- %s\n\nPregunta: %s", implode("\n- ", $context), $question);

        return ['output' => $this->client->generate(self::SYSTEM, $prompt), 'context' => $context];
    }

    /**
     * @return string[]
     */
    private function retrieveContext(int $langId): array
    {
        $lines = [];
        foreach (Tax::getTaxes($langId, true) as $tax) {
            $lines[] = sprintf('Impuesto activo "%s": tasa %s %%', $tax['name'], rtrim(rtrim((string) $tax['rate'], '0'), '.'));
        }

        return $lines;
    }
}
