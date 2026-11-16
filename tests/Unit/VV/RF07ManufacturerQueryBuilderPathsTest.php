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

namespace Tests\Unit\VV;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Platforms\MySQL80Platform;
use Doctrine\DBAL\Query\QueryBuilder;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use PrestaShop\PrestaShop\Core\Grid\Query\DoctrineSearchCriteriaApplicatorInterface;
use PrestaShop\PrestaShop\Core\Grid\Query\ManufacturerQueryBuilder;
use ReflectionMethod;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-07 — caja blanca de ManufacturerQueryBuilder::getQueryBuilder (docs/testing/RF-07-listar-filtrar-marcas.md).
 */
final class RF07ManufacturerQueryBuilderPathsTest extends TestCase
{
    private const SHOP_IDS = [1];

    private function getQueryBuilder(array $filters): QueryBuilder
    {
        // Stub: conexión que solo fabrica QueryBuilders reales, sin BD.
        $connection = $this->createStub(Connection::class);
        $connection->method('createQueryBuilder')->willReturnCallback(fn () => new QueryBuilder($connection));
        $connection->method('getDatabasePlatform')->willReturn(new MySQL80Platform());
        // Dummy: getQueryBuilder nunca usa el aplicador de criterios.
        $applicator = $this->createStub(DoctrineSearchCriteriaApplicatorInterface::class);

        $builder = new ManufacturerQueryBuilder($connection, 'ps_', $applicator, self::SHOP_IDS);

        return (new ReflectionMethod($builder, 'getQueryBuilder'))->invoke($builder, $filters);
    }

    public function testCamino1SinFiltrosSoloRestringeLaTienda(): void
    {
        // Arrange
        $filters = [];

        // Act
        $qb = $this->getQueryBuilder($filters);

        // Assert
        Expect::that($qb->getSQL())
            ->toContain('FROM ps_manufacturer m')
            ->toContain('ms.`id_shop` IN (:contextShopIds)')
            ->notToContain('LIKE');
        Expect::that($qb->getParameters())->toHaveCount(1)->toHaveKey('contextShopIds');
    }

    public function testCamino2FiltroNoPermitidoSeIgnora(): void
    {
        // Arrange
        $filters = ['actions' => 'x'];

        // Act
        $qb = $this->getQueryBuilder($filters);

        // Assert
        Expect::that($qb->getSQL())->notToContain('actions');
        Expect::that($qb->getParameters())->toHaveCount(1)->notToHaveKey('actions');
    }

    public function testCamino3FiltroDeNombreUsaLikeEntreComodines(): void
    {
        // Arrange
        $filters = ['name' => 'VV'];

        // Act
        $qb = $this->getQueryBuilder($filters);

        // Assert
        Expect::that($qb->getSQL())->toContain('m.`name` LIKE :name');
        Expect::that($qb->getParameter('name'))->toBe('%VV%');
    }

    public function testCamino4FiltroDeEstadoUsaIgualdad(): void
    {
        // Arrange
        $filters = ['active' => '0'];

        // Act
        $qb = $this->getQueryBuilder($filters);

        // Assert
        Expect::that($qb->getSQL())->toContain('m.`active` = :active');
        Expect::that($qb->getParameter('active'))->toBe('0');
    }

    /**
     * Prueba parametrizada: cada filtro permitido produce su condición, sin importar el orden.
     */
    #[DataProvider('filtrosPermitidos')]
    public function testCadaFiltroPermitidoAgregaSuCondicion(string $filtro, string $valor, string $condicion): void
    {
        // Arrange / Act
        $qb = $this->getQueryBuilder([$filtro => $valor]);

        // Assert
        Expect::that($qb->getSQL())->toContain($condicion);
    }

    public static function filtrosPermitidos(): iterable
    {
        yield 'id' => ['id_manufacturer', '3', 'm.`id_manufacturer` = :id_manufacturer'];
        yield 'nombre' => ['name', 'Studio', 'm.`name` LIKE :name'];
        yield 'estado' => ['active', '1', 'm.`active` = :active'];
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $inicioCpu = getrusage();
        $inicio = hrtime(true);
        for ($i = 0; $i < 20000; ++$i) {
            $this->getQueryBuilder(['name' => 'VV', 'active' => '1']);
        }
        $fin = getrusage();
        $ttot = (hrtime(true) - $inicio) / 1e6;
        $tcpu = (($fin['ru_utime.tv_sec'] - $inicioCpu['ru_utime.tv_sec']) * 1e3 + ($fin['ru_utime.tv_usec'] - $inicioCpu['ru_utime.tv_usec']) / 1e3)
            + (($fin['ru_stime.tv_sec'] - $inicioCpu['ru_stime.tv_sec']) * 1e3 + ($fin['ru_stime.tv_usec'] - $inicioCpu['ru_stime.tv_usec']) / 1e3);
        fwrite(STDERR, sprintf("\n[METRICAS RF-07] Tcpu=%.1fms Ttot=%.1fms Mproc=%.1fMB\n", $tcpu, $ttot, memory_get_peak_usage(true) / 1048576));

        self::assertGreaterThan(0, $ttot);
    }
}
