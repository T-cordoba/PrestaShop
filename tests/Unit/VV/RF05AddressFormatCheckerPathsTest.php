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

use PHPUnit\Framework\TestCase;
use PrestaShop\PrestaShop\Core\Domain\Country\AddressFormat\AddressFormatChecker;
use PrestaShop\PrestaShop\Core\Domain\Country\AddressFormat\AddressFormatFieldsProviderInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-05 — caja blanca de AddressFormatChecker::validate (docs/testing/RF-05-crear-pais.md).
 */
final class RF05AddressFormatCheckerPathsTest extends TestCase
{
    private function checker(array $requiredFields, ?TranslatorInterface $translator = null): AddressFormatChecker
    {
        // Stub: catálogo fijo de campos, sin BD.
        $fields = $this->createStub(AddressFormatFieldsProviderInterface::class);
        $fields->method('getPickerClasses')->willReturn(['Country']);
        $fields->method('getFieldsForClass')->willReturnMap([
            ['Address', ['firstname', 'lastname', 'address1', 'city']],
            ['Country', ['name']],
        ]);
        $fields->method('getRequiredFields')->willReturn($requiredFields);

        return new AddressFormatChecker($fields, $translator ?? $this->echoTranslator());
    }

    private function echoTranslator(): TranslatorInterface
    {
        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(fn (string $id, array $params) => strtr($id, $params));

        return $translator;
    }

    public function testCamino1FormatoVacioSinObligatoriosNoDaErrores(): void
    {
        // Arrange
        $checker = $this->checker([]);

        // Act
        $errors = $checker->validate('');

        // Assert
        Expect::that($errors)->toBeEmpty();
    }

    public function testCamino2TokenValidoSeUbicaSinErrores(): void
    {
        // Arrange
        $checker = $this->checker([]);

        // Act
        $errors = $checker->validate('firstname');

        // Assert
        Expect::that($errors)->toBeEmpty();
    }

    public function testCamino3TokenInexistenteDaErrorDePropiedad(): void
    {
        // Arrange
        $checker = $this->checker([]);

        // Act
        $errors = $checker->validate('campoFalso');

        // Assert
        Expect::that($errors)->toHaveCount(1)->toContain('This field is not a valid address property: campoFalso.');
    }

    public function testCamino4TokenRepetidoDaErrorDeClaveUsada(): void
    {
        // Arrange
        // Mock: se verifica la interacción con el traductor (una sola traducción, con el dominio de errores).
        $translator = $this->createMock(TranslatorInterface::class);
        $translator->expects(self::once())
            ->method('trans')
            ->with('This key has already been used: %key%.', ['%key%' => 'firstname'], 'Admin.Notifications.Error')
            ->willReturn('clave repetida');
        $checker = $this->checker([], $translator);

        // Act
        $errors = $checker->validate('firstname firstname');

        // Assert
        Expect::that($errors)->toBe(['clave repetida']);
    }

    public function testCamino5FaltaUnCampoObligatorio(): void
    {
        // Arrange
        $checker = $this->checker(['lastname']);

        // Act
        $errors = $checker->validate('firstname');

        // Assert
        Expect::that($errors)->toHaveCount(1)->toContain('The lastname field is required.');
    }

    public function testCamino6DosLineasCubrenElObligatorio(): void
    {
        // Arrange
        $checker = $this->checker(['lastname']);

        // Act
        $errors = $checker->validate("firstname\nlastname");

        // Assert
        Expect::that($errors)->toBeEmpty();
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $checker = $this->checker(['lastname']);
        $inicioCpu = getrusage();
        $inicio = hrtime(true);
        for ($i = 0; $i < 20000; ++$i) {
            $checker->validate("firstname lastname\naddress1\ncity Country:name");
        }
        $fin = getrusage();
        $ttot = (hrtime(true) - $inicio) / 1e6;
        $tcpu = (($fin['ru_utime.tv_sec'] - $inicioCpu['ru_utime.tv_sec']) * 1e3 + ($fin['ru_utime.tv_usec'] - $inicioCpu['ru_utime.tv_usec']) / 1e3)
            + (($fin['ru_stime.tv_sec'] - $inicioCpu['ru_stime.tv_sec']) * 1e3 + ($fin['ru_stime.tv_usec'] - $inicioCpu['ru_stime.tv_usec']) / 1e3);
        fwrite(STDERR, sprintf("\n[METRICAS RF-05] Tcpu=%.1fms Ttot=%.1fms Mproc=%.1fMB\n", $tcpu, $ttot, memory_get_peak_usage(true) / 1048576));

        self::assertGreaterThan(0, $ttot);
    }
}
