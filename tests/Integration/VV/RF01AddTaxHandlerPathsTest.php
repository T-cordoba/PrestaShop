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

use PrestaShop\PrestaShop\Adapter\Tax\CommandHandler\AddTaxHandler;
use PrestaShop\PrestaShop\Core\Domain\Tax\Command\AddTaxCommand;
use PrestaShop\PrestaShop\Core\Domain\Tax\Exception\TaxException;
use PrestaShop\PrestaShop\Core\Domain\Tax\ValueObject\TaxId;
use PrestaShopDatabaseException;
use Tax;
use Tests\Integration\VV\Support\FaultyDb;
use Tests\Integration\VV\Support\PathTestCase;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-01 — caja blanca de AddTaxHandler::handle (docs/testing/RF-01-crear-impuesto.md).
 */
final class RF01AddTaxHandlerPathsTest extends PathTestCase
{
    private function command(string $name, mixed $rate): AddTaxCommand
    {
        return new AddTaxCommand([self::defaultLang() => $name], $rate, true);
    }

    public function testCamino1TasaInvalidaLanzaTaxException(): void
    {
        $this->expectException(TaxException::class);
        $this->expectExceptionMessage('Tax contains invalid field values');

        (new AddTaxHandler())->handle($this->command('VV IVA', 'abc'));
    }

    public function testCamino2NombreInvalidoLanzaTaxException(): void
    {
        $this->expectException(TaxException::class);
        $this->expectExceptionMessage('Tax contains invalid field values');

        (new AddTaxHandler())->handle($this->command('IVA<19>', 19));
    }

    public function testCamino3SaveLanzaYSeTraduceATaxException(): void
    {
        // Arrange — fake: la siguiente inserción en BD lanza
        FaultyDb::install('insert', new PrestaShopDatabaseException('forzada'));

        // Act / Assert
        $this->expectException(TaxException::class);
        $this->expectExceptionMessageMatches('/Cannot create tax/');
        (new AddTaxHandler())->handle($this->command('VV IVA', 19));
    }

    public function testCamino4SaveDevuelveFalse(): void
    {
        // Arrange — fake: la siguiente inserción en BD devuelve false
        FaultyDb::install('insert', false);

        // Act / Assert
        $this->expectException(TaxException::class);
        $this->expectExceptionMessageMatches('/Cannot create tax/');
        (new AddTaxHandler())->handle($this->command('VV IVA', 19));
    }

    public function testCamino5DatosValidosCreanElImpuesto(): void
    {
        // Act
        $taxId = (new AddTaxHandler())->handle($this->command('VV-WB RF01', 19));
        $this->cleanup(fn () => (new Tax($taxId->getValue()))->delete());

        // Assert
        Expect::that($taxId)->toBeInstanceOf(TaxId::class);
        $tax = new Tax($taxId->getValue());
        Expect::that((float) $tax->rate)->toBe(19.0);
        Expect::that($tax->name[self::defaultLang()])->toBe('VV-WB RF01');
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $ids = [];
        self::measure('RF-01', function () use (&$ids) {
            $ids[] = (new AddTaxHandler())->handle($this->command('VV-WB metricas', 5))->getValue();
        });
        $this->cleanup(function () use ($ids) {
            foreach ($ids as $id) {
                (new Tax($id))->delete();
            }
        });
    }
}
