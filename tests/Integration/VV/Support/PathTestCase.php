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

namespace Tests\Integration\VV\Support;

use Configuration;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;

/**
 * Base for the white-box path tests that need the test database: boots the kernel, restores the Db
 * singleton and deletes what each test created (FIRST: Independent, Repeatable).
 */
abstract class PathTestCase extends KernelTestCase
{
    /** @var callable[] */
    private array $cleanups = [];

    protected function setUp(): void
    {
        parent::setUp();
        self::bootKernel();
    }

    protected function tearDown(): void
    {
        FaultyDb::restore();
        foreach (array_reverse($this->cleanups) as $cleanup) {
            $cleanup();
        }
        $this->cleanups = [];
        parent::tearDown();
    }

    protected function cleanup(callable $cleanup): void
    {
        $this->cleanups[] = $cleanup;
    }

    protected static function defaultLang(): int
    {
        return (int) Configuration::get('PS_LANG_DEFAULT');
    }

    protected static function measure(string $rf, callable $unit, int $iterations = 200): void
    {
        $cpu0 = getrusage();
        $t0 = hrtime(true);
        for ($i = 0; $i < $iterations; ++$i) {
            $unit();
        }
        $cpu1 = getrusage();
        $ttot = (hrtime(true) - $t0) / 1e6;
        $tcpu = ($cpu1['ru_utime.tv_sec'] - $cpu0['ru_utime.tv_sec']) * 1e3 + ($cpu1['ru_utime.tv_usec'] - $cpu0['ru_utime.tv_usec']) / 1e3
            + ($cpu1['ru_stime.tv_sec'] - $cpu0['ru_stime.tv_sec']) * 1e3 + ($cpu1['ru_stime.tv_usec'] - $cpu0['ru_stime.tv_usec']) / 1e3;
        fwrite(STDERR, sprintf("\n[METRICAS %s] Tcpu=%.1fms Ttot=%.1fms Mproc=%.1fMB iteraciones=%d\n", $rf, $tcpu, $ttot, memory_get_peak_usage(true) / 1048576, $iterations));
        self::assertGreaterThan(0, $ttot);
    }
}
