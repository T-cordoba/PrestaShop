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

namespace Tests\Unit\VV\Support;

use PHPUnit\Framework\Assert;

/**
 * Fluent assertions on top of PHPUnit: expect($x)->toContain('a')->toHaveCount(2).
 */
final class Expect
{
    private function __construct(private readonly mixed $actual)
    {
    }

    public static function that(mixed $actual): self
    {
        return new self($actual);
    }

    public function toBe(mixed $expected): self
    {
        Assert::assertSame($expected, $this->actual);

        return $this;
    }

    public function toContain(string $needle): self
    {
        is_array($this->actual)
            ? Assert::assertContains($needle, $this->actual)
            : Assert::assertStringContainsString($needle, $this->actual);

        return $this;
    }

    public function notToContain(string $needle): self
    {
        is_array($this->actual)
            ? Assert::assertNotContains($needle, $this->actual)
            : Assert::assertStringNotContainsString($needle, $this->actual);

        return $this;
    }

    public function toHaveCount(int $count): self
    {
        Assert::assertCount($count, $this->actual);

        return $this;
    }

    public function toHaveKey(string $key): self
    {
        Assert::assertArrayHasKey($key, $this->actual);

        return $this;
    }

    public function notToHaveKey(string $key): self
    {
        Assert::assertArrayNotHasKey($key, $this->actual);

        return $this;
    }

    public function toBeEmpty(): self
    {
        Assert::assertEmpty($this->actual);

        return $this;
    }

    public function toBeInstanceOf(string $class): self
    {
        Assert::assertInstanceOf($class, $this->actual);

        return $this;
    }
}
