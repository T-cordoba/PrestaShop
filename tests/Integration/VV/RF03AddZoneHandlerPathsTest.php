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

use ObjectModel;
use PrestaShop\PrestaShop\Adapter\Zone\CommandHandler\AddZoneHandler;
use PrestaShop\PrestaShop\Core\Domain\Zone\Command\AddZoneCommand;
use PrestaShop\PrestaShop\Core\Domain\Zone\Exception\MissingZoneRequiredFieldsException;
use PrestaShop\PrestaShop\Core\Domain\Zone\Exception\ZoneException;
use PrestaShopDatabaseException;
use ReflectionProperty;
use Tests\Integration\VV\Support\FaultyDb;
use Tests\Integration\VV\Support\PathTestCase;
use Tests\Unit\VV\Support\Expect;
use Zone;

/**
 * RF-03 — caja blanca de AddZoneHandler::handle (docs/testing/RF-03-crear-zona.md).
 */
final class RF03AddZoneHandlerPathsTest extends PathTestCase
{
    private ReflectionProperty $requiredCache;

    protected function setUp(): void
    {
        parent::setUp();
        $this->requiredCache = new ReflectionProperty(ObjectModel::class, 'fieldsRequiredDatabase');
    }

    protected function tearDown(): void
    {
        $this->requiredCache->setValue(null, null);
        parent::tearDown();
    }

    private function handle(string $name): int
    {
        $zoneId = (new AddZoneHandler())->handle(new AddZoneCommand($name, true, [1]))->getValue();
        $this->cleanup(fn () => (new Zone($zoneId))->delete());

        return $zoneId;
    }

    public function testCamino1LaValidacionDeObligatoriosLanza(): void
    {
        // Arrange — se vacía la caché de obligatorios y el fake hace lanzar la consulta que la recarga
        $this->requiredCache->setValue(null, null);
        FaultyDb::install('executeS', new PrestaShopDatabaseException('forzada'));

        // Act / Assert
        $this->expectException(ZoneException::class);
        $this->expectExceptionMessageMatches('/Failed to add new zone/');
        $this->handle('VV-WB RF03 c1');
    }

    public function testCamino2CampoObligatorioFaltante(): void
    {
        // Arrange — Zone.name registrado como obligatorio personalizado; la petición no lo trae
        $this->requiredCache->setValue(null, ['Zone' => [1 => 'name']]);

        // Act / Assert
        $this->expectException(MissingZoneRequiredFieldsException::class);
        $this->handle('');
    }

    public function testCamino3AddLanzaConNombreInvalido(): void
    {
        $this->expectException(ZoneException::class);
        $this->expectExceptionMessageMatches('/Failed to add new zone/');

        $this->handle('<script>alert(1)</script>');
    }

    public function testCamino4AddDevuelveFalse(): void
    {
        // Arrange — fake: la inserción devuelve false
        FaultyDb::install('insert', false);

        // Act / Assert
        $this->expectException(ZoneException::class);
        $this->handle('VV-WB RF03 c4');
    }

    public function testCamino5AssociateWithShopsLanza(): void
    {
        self::markTestSkipped('No forzable en este entorno: con multitienda desactivada associateWithShops() retorna antes de tocar la BD.');
    }

    public function testCamino6DatosValidosCreanLaZona(): void
    {
        // Act
        $zoneId = $this->handle('VV-WB RF03 c6');

        // Assert
        $zone = new Zone($zoneId);
        Expect::that($zone->name)->toBe('VV-WB RF03 c6');
        Expect::that((bool) $zone->active)->toBe(true);
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        self::measure('RF-03', fn () => $this->handle('VV-WB metricas'));
    }
}
