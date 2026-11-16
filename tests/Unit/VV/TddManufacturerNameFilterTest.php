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
 * TDD — DEF found in CP-07-04: the brand name filter must treat LIKE wildcards as literal characters.
 */
final class TddManufacturerNameFilterTest extends TestCase
{
    #[DataProvider('nameFilters')]
    public function testTheNameFilterMatchesTheTypedTextLiterally(string $typed, string $expectedParameter): void
    {
        // Arrange
        $connection = $this->createStub(Connection::class);
        $connection->method('createQueryBuilder')->willReturnCallback(fn () => new QueryBuilder($connection));
        $connection->method('getDatabasePlatform')->willReturn(new MySQL80Platform());
        $builder = new ManufacturerQueryBuilder($connection, 'ps_', $this->createStub(DoctrineSearchCriteriaApplicatorInterface::class), [1]);

        // Act
        $qb = (new ReflectionMethod($builder, 'getQueryBuilder'))->invoke($builder, ['name' => $typed]);

        // Assert
        Expect::that($qb->getParameter('name'))->toBe($expectedParameter);
    }

    public static function nameFilters(): iterable
    {
        yield 'plain text is unchanged' => ['Studio', '%Studio%'];
        yield 'percent sign is literal' => ['%', '%\%%'];
        yield 'underscore is literal' => ['_', '%\_%'];
        yield 'backslash is literal' => ['a\b', '%a\\\\b%'];
    }
}
