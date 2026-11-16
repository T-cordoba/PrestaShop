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

use Manufacturer;
use PrestaShop\PrestaShop\Adapter\Manufacturer\CommandHandler\AddManufacturerHandler;
use PrestaShop\PrestaShop\Core\Domain\Manufacturer\Command\AddManufacturerCommand;
use PrestaShop\PrestaShop\Core\Domain\Manufacturer\Exception\ManufacturerException;
use Tests\Integration\VV\Support\FaultyDb;
use Tests\Integration\VV\Support\PathTestCase;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-06 — caja blanca de AddManufacturerHandler::handle (docs/testing/RF-06-crear-marca.md).
 */
final class RF06AddManufacturerHandlerPathsTest extends PathTestCase
{
    private function handle(string $name, string $description = 'ok'): int
    {
        $lang = self::defaultLang();
        $command = new AddManufacturerCommand($name, true, [$lang => ''], [$lang => $description], [$lang => ''], [$lang => ''], [1]);
        $id = (new AddManufacturerHandler())->handle($command)->getValue();
        $this->cleanup(fn () => (new Manufacturer($id))->delete());

        return $id;
    }

    public function testCamino1NombreInvalidoLanza(): void
    {
        $this->expectException(ManufacturerException::class);
        $this->expectExceptionMessage('Manufacturer contains invalid field values');

        $this->handle('Marca<>');
    }

    public function testCamino2AddLanzaConDescripcionPeligrosa(): void
    {
        $this->expectException(ManufacturerException::class);
        $this->expectExceptionMessageMatches('/Failed to add new manufacturer/');

        $this->handle('VV-WB RF06 c2', '<script>alert(1)</script>');
    }

    public function testCamino3AddDevuelveFalse(): void
    {
        // Arrange — fake: la inserción devuelve false
        FaultyDb::install('insert', false);

        // Act / Assert
        $this->expectException(ManufacturerException::class);
        $this->handle('VV-WB RF06 c3');
    }

    public function testCamino4AddShopAssociationLanza(): void
    {
        self::markTestSkipped('No forzable en este entorno: con multitienda desactivada associateWithShops() retorna antes de tocar la BD.');
    }

    public function testCamino5DatosValidosCreanLaMarca(): void
    {
        // Act
        $id = $this->handle('VV-WB RF06 c5', '<b>Café</b> de origen');

        // Assert
        $manufacturer = new Manufacturer($id, self::defaultLang());
        Expect::that($manufacturer->name)->toBe('VV-WB RF06 c5');
        Expect::that($manufacturer->description)->toBe('<b>Café</b> de origen');
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        self::measure('RF-06', fn () => $this->handle('VV-WB metricas'));
    }
}
