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
use PHPUnit\Framework\TestCase;
use PrestaShop\PrestaShop\Core\Grid\Query\DoctrineSearchCriteriaApplicatorInterface;
use PrestaShop\PrestaShop\Core\Grid\Query\ManufacturerQueryBuilder;
use PrestaShop\PrestaShop\Core\Grid\Search\SearchCriteria;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-07 — the two public queries of the brand list (list page and total count) built on top of getQueryBuilder().
 */
final class RF07ManufacturerQueryBuilderSearchTest extends TestCase
{
    private function builder(DoctrineSearchCriteriaApplicatorInterface $applicator): ManufacturerQueryBuilder
    {
        // Stub: connection that only creates real QueryBuilders, no database.
        $connection = $this->createStub(Connection::class);
        $connection->method('createQueryBuilder')->willReturnCallback(fn () => new QueryBuilder($connection));
        $connection->method('getDatabasePlatform')->willReturn(new MySQL80Platform());

        return new ManufacturerQueryBuilder($connection, 'ps_', $applicator, [1]);
    }

    private function criteria(): SearchCriteria
    {
        return new SearchCriteria(['name' => 'VV'], 'name', 'asc', 0, 10);
    }

    public function testSearchQuerySelectsTheListColumnsAndAppliesPaginationAndSorting(): void
    {
        // Arrange — mock: the applicator must receive the criteria and the query being built.
        $criteria = $this->criteria();
        $applicator = $this->createMock(DoctrineSearchCriteriaApplicatorInterface::class);
        $applicator->expects($this->once())->method('applyPagination')->with($criteria)->willReturnSelf();
        $applicator->expects($this->once())->method('applySorting')->with($criteria)->willReturnSelf();
        $applicator->expects($this->once())->method('applyDeterministicSorting')
            ->with($criteria, $this->isInstanceOf(QueryBuilder::class), 'm', 'id_manufacturer')->willReturnSelf();

        // Act
        $qb = $this->builder($applicator)->getSearchQueryBuilder($criteria);

        // Assert
        Expect::that($qb->getSQL())
            ->toContain('SELECT m.`id_manufacturer`, m.`name`, m.`active`')
            ->toContain('COUNT(p.`id_product`) AS `products_count`')
            ->toContain('FROM ps_address a')
            ->toContain('AS addresses_count')
            ->toContain('GROUP BY m.`id_manufacturer`')
            ->toContain('m.`name` LIKE :name');
    }

    public function testCountQueryCountsDistinctBrandsWithTheSameFilters(): void
    {
        // Arrange — dummy: the count query never paginates nor sorts.
        $applicator = $this->createMock(DoctrineSearchCriteriaApplicatorInterface::class);
        $applicator->expects($this->never())->method($this->anything());

        // Act
        $qb = $this->builder($applicator)->getCountQueryBuilder($this->criteria());

        // Assert
        Expect::that($qb->getSQL())
            ->toContain('SELECT COUNT(DISTINCT m.`id_manufacturer`)')
            ->toContain('m.`name` LIKE :name')
            ->notToContain('products_count');
    }
}
