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

use PrestaShop\PrestaShop\Adapter\Supplier\CommandHandler\ToggleSupplierStatusHandler;
use PrestaShop\PrestaShop\Core\Domain\Supplier\Command\ToggleSupplierStatusCommand;
use PrestaShop\PrestaShop\Core\Domain\Supplier\Exception\CannotToggleSupplierStatusException;
use PrestaShop\PrestaShop\Core\Domain\Supplier\Exception\SupplierException;
use PrestaShop\PrestaShop\Core\Domain\Supplier\Exception\SupplierNotFoundException;
use PrestaShopDatabaseException;
use Supplier;
use Tests\Integration\VV\Support\FaultyDb;
use Tests\Integration\VV\Support\PathTestCase;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-08 — caja blanca de ToggleSupplierStatusHandler::handle (docs/testing/RF-08-activar-desactivar-proveedor.md).
 */
final class RF08ToggleSupplierStatusHandlerPathsTest extends PathTestCase
{
    private function newSupplier(string $name = 'VV-WB RF08'): int
    {
        $supplier = new Supplier();
        $supplier->name = $name;
        $supplier->active = true;
        $supplier->add();
        $this->cleanup(fn () => $supplier->delete());

        return (int) $supplier->id;
    }

    private function toggle(int $id): void
    {
        (new ToggleSupplierStatusHandler())->handle(new ToggleSupplierStatusCommand($id));
    }

    public function testCamino1ElConstructorLanza(): void
    {
        // Arrange — fake: la lectura del proveedor lanza
        $id = $this->newSupplier();
        FaultyDb::install('getRow', new PrestaShopDatabaseException('forzada'));

        // Act / Assert
        $this->expectException(SupplierException::class);
        $this->toggle($id);
    }

    public function testCamino2ProveedorInexistente(): void
    {
        $this->expectException(SupplierNotFoundException::class);

        $this->toggle(999999);
    }

    public function testCamino3ToggleStatusLanza(): void
    {
        // Arrange — fake: the UPDATE of toggleStatus() throws
        $id = $this->newSupplier();
        FaultyDb::install('update', new PrestaShopDatabaseException('forzada'));

        // Act / Assert
        $this->expectException(SupplierException::class);
        $this->toggle($id);
    }

    public function testCamino4ToggleStatusDevuelveFalse(): void
    {
        // Arrange — fake: la actualización devuelve false
        $id = $this->newSupplier();
        FaultyDb::install('update', false);

        // Act / Assert
        $this->expectException(CannotToggleSupplierStatusException::class);
        $this->toggle($id);
    }

    public function testCamino5ProveedorExistenteInvierteSuEstado(): void
    {
        // Arrange
        $id = $this->newSupplier();

        // Act
        $this->toggle($id);

        // Assert
        Expect::that((bool) (new Supplier($id))->active)->toBe(false);
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $id = $this->newSupplier();
        self::measure('RF-08', fn () => $this->toggle($id));
    }
}
