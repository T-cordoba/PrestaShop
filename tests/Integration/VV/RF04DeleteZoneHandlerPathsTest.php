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

use PrestaShop\PrestaShop\Adapter\Zone\CommandHandler\DeleteZoneHandler;
use PrestaShop\PrestaShop\Core\Domain\Zone\Command\DeleteZoneCommand;
use PrestaShop\PrestaShop\Core\Domain\Zone\Exception\DeleteZoneException;
use PrestaShop\PrestaShop\Core\Domain\Zone\Exception\ZoneNotFoundException;
use Tests\Integration\VV\Support\FaultyDb;
use Tests\Integration\VV\Support\PathTestCase;
use Tests\Unit\VV\Support\Expect;
use Zone;

/**
 * RF-04 — caja blanca de DeleteZoneHandler::handle (docs/testing/RF-04-eliminar-zona.md).
 */
final class RF04DeleteZoneHandlerPathsTest extends PathTestCase
{
    private function newZone(): int
    {
        $zone = new Zone();
        $zone->name = 'VV-WB RF04';
        $zone->active = true;
        $zone->add();
        $this->cleanup(fn () => Zone::existsInDatabase((int) $zone->id, 'zone') && $zone->delete());

        return (int) $zone->id;
    }

    public function testCamino1ZonaInexistente(): void
    {
        $this->expectException(ZoneNotFoundException::class);

        (new DeleteZoneHandler())->handle(new DeleteZoneCommand(999999));
    }

    public function testCamino2ElBorradoFalla(): void
    {
        // Arrange — fake: el DELETE devuelve false
        $id = $this->newZone();
        FaultyDb::install('delete', false);

        // Act / Assert
        $this->expectException(DeleteZoneException::class);
        (new DeleteZoneHandler())->handle(new DeleteZoneCommand($id));
    }

    public function testCamino3ZonaExistenteSeElimina(): void
    {
        // Arrange
        $id = $this->newZone();

        // Act
        (new DeleteZoneHandler())->handle(new DeleteZoneCommand($id));

        // Assert
        Expect::that(Zone::existsInDatabase($id, 'zone'))->toBe(false);
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $ids = array_map(fn () => $this->newZone(), range(1, 200));
        self::measure('RF-04', function () use (&$ids) {
            (new DeleteZoneHandler())->handle(new DeleteZoneCommand(array_pop($ids)));
        });
    }
}
