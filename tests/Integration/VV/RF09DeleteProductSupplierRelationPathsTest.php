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

use Db;
use PrestaShop\PrestaShop\Adapter\Product\Update\ProductSupplierUpdater;
use PrestaShop\PrestaShop\Adapter\Supplier\CommandHandler\DeleteSupplierHandler;
use PrestaShop\PrestaShop\Adapter\Supplier\SupplierAddressProvider;
use PrestaShop\PrestaShop\Core\Domain\Product\ValueObject\ProductId;
use PrestaShop\PrestaShop\Core\Domain\Supplier\ValueObject\SupplierId;
use Product;
use ReflectionMethod;
use Supplier;
use Tests\Integration\VV\Support\PathTestCase;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-09 — caja blanca de AbstractDeleteSupplierHandler::deleteProductSupplierRelation
 * (docs/testing/RF-09-eliminar-proveedor.md).
 */
final class RF09DeleteProductSupplierRelationPathsTest extends PathTestCase
{
    private function newSupplier(): int
    {
        $supplier = new Supplier();
        $supplier->name = 'VV-WB RF09';
        $supplier->active = true;
        $supplier->add();
        $this->cleanup(fn () => $supplier->delete());

        return (int) $supplier->id;
    }

    /** @return int[] product ids whose default supplier is $supplierId, each with a product_supplier relation */
    private function productsOf(int $supplierId, int $count): array
    {
        $ids = [];
        for ($i = 0; $i < $count; ++$i) {
            $product = new Product();
            $product->name = [self::defaultLang() => 'VV-WB RF09 producto ' . $i];
            $product->id_supplier = $supplierId;
            $product->add();
            Db::getInstance()->insert('product_supplier', ['id_product' => (int) $product->id, 'id_product_attribute' => 0, 'id_supplier' => $supplierId]);
            $this->cleanup(fn () => $product->delete());
            $ids[] = (int) $product->id;
        }

        return $ids;
    }

    private function run(int $supplierId, ProductSupplierUpdater $updater): mixed
    {
        // Dummy: la dirección del proveedor no participa en esta unidad.
        $addressProvider = $this->createStub(SupplierAddressProvider::class);
        $handler = new DeleteSupplierHandler($addressProvider, $updater, _DB_PREFIX_);

        return (new ReflectionMethod($handler, 'deleteProductSupplierRelation'))->invoke($handler, new SupplierId($supplierId));
    }

    private static function relations(int $supplierId): int
    {
        return (int) Db::getInstance()->getValue('SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'product_supplier WHERE id_supplier = ' . $supplierId);
    }

    public function testCamino1SinProductosNoReasignaNada(): void
    {
        // Arrange — mock: no debe llamarse
        $supplierId = $this->newSupplier();
        $updater = $this->createMock(ProductSupplierUpdater::class);
        $updater->expects(self::never())->method('resetSupplierAssociations');

        // Act
        $result = $this->run($supplierId, $updater);

        // Assert
        Expect::that($result)->toBe(true);
    }

    public function testCamino2UnProductoSeReasigna(): void
    {
        // Arrange — mock: se llama una vez con el único huérfano
        $supplierId = $this->newSupplier();
        [$productId] = $this->productsOf($supplierId, 1);
        $updater = $this->createMock(ProductSupplierUpdater::class);
        $updater->expects(self::once())->method('resetSupplierAssociations')->with([new ProductId($productId)]);

        // Act
        $result = $this->run($supplierId, $updater);

        // Assert
        Expect::that($result)->toBe(true);
        Expect::that(self::relations($supplierId))->toBe(0);
    }

    public function testCamino3DosProductosSeReasignan(): void
    {
        // Arrange — spy: se capturan los ids recibidos
        $supplierId = $this->newSupplier();
        $productIds = $this->productsOf($supplierId, 2);
        $received = null;
        $updater = $this->createMock(ProductSupplierUpdater::class);
        $updater->method('resetSupplierAssociations')->willReturnCallback(function (array $ids) use (&$received) {
            $received = array_map(fn (ProductId $id) => $id->getValue(), $ids);
        });

        // Act
        $this->run($supplierId, $updater);

        // Assert
        Expect::that($received)->toBe($productIds);
        Expect::that(self::relations($supplierId))->toBe(0);
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $supplierId = $this->newSupplier();
        $updater = $this->createStub(ProductSupplierUpdater::class);
        self::measure('RF-09', fn () => $this->run($supplierId, $updater), 2000);
    }
}
