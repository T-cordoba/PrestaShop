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

namespace Tests\Integration\VV;

use PrestaShop\PrestaShop\Adapter\Tax\CommandHandler\EditTaxHandler;
use PrestaShop\PrestaShop\Core\Domain\Tax\Exception\TaxException;
use PrestaShop\PrestaShop\Core\Domain\Tax\Exception\TaxNotFoundException;
use PrestaShop\PrestaShop\Core\Domain\Tax\ValueObject\TaxId;
use PrestaShopDatabaseException;
use ReflectionMethod;
use Tax;
use Tests\Integration\VV\Support\FaultyDb;
use Tests\Integration\VV\Support\PathTestCase;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-02 — caja blanca de AbstractTaxHandler::getTax (docs/testing/RF-02-editar-impuesto.md).
 */
final class RF02GetTaxPathsTest extends PathTestCase
{
    private function getTax(int $id): Tax
    {
        $handler = new EditTaxHandler();

        return (new ReflectionMethod($handler, 'getTax'))->invoke($handler, new TaxId($id));
    }

    private function existingTax(): int
    {
        $tax = new Tax();
        $tax->name = [self::defaultLang() => 'VV-WB RF02'];
        $tax->rate = 19;
        $tax->add();
        $this->cleanup(fn () => $tax->delete());

        return (int) $tax->id;
    }

    public function testCamino1ElConstructorLanzaYSeTraduceATaxException(): void
    {
        // Arrange — fake: la lectura del impuesto en BD lanza
        $id = $this->existingTax();
        FaultyDb::install('getRow', new PrestaShopDatabaseException('forzada'));

        // Act / Assert
        $this->expectException(TaxException::class);
        $this->expectExceptionMessage('Failed to create new tax');
        $this->getTax($id);
    }

    public function testCamino2IdInexistenteLanzaTaxNotFound(): void
    {
        $this->expectException(TaxNotFoundException::class);

        $this->getTax(999999);
    }

    public function testCamino3IdExistenteDevuelveElImpuesto(): void
    {
        // Arrange
        $id = $this->existingTax();

        // Act
        $tax = $this->getTax($id);

        // Assert
        Expect::that($tax->id)->toBe($id);
        Expect::that((float) $tax->rate)->toBe(19.0);
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $id = $this->existingTax();
        self::measure('RF-02', fn () => $this->getTax($id), 2000);
    }
}
