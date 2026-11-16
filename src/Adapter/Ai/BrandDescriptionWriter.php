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

/**
 * Writes the short description of a brand (RF-06) from the facts the merchant provides.
 */
final class BrandDescriptionWriter
{
    private const SYSTEM = 'Eres redactor de catálogo de una tienda en línea. Escribes en español neutro. '
        . 'Usa EXCLUSIVAMENTE los datos proporcionados: no inventes cifras, premios, fechas, países ni certificaciones. '
        . 'Si un dato no está en la lista, no lo menciones. Máximo 60 palabras, un solo párrafo, sin listas ni emojis.';

    public function __construct(private readonly OllamaClient $client)
    {
    }

    /**
     * @param string[] $facts
     */
    public function write(string $brandName, array $facts): string
    {
        $prompt = sprintf(
            "Marca: %s\nDatos verificados:\n- %s\n\nEscribe la descripción corta de la marca para su ficha en la tienda.",
            $brandName,
            implode("\n- ", $facts)
        );

        return $this->client->generate(self::SYSTEM, $prompt);
    }
}
