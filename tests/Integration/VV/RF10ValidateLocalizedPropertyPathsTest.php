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

use FeatureValue;
use PrestaShop\PrestaShop\Adapter\Feature\Validate\FeatureValueValidator;
use PrestaShop\PrestaShop\Core\Domain\Feature\Exception\FeatureValueConstraintException;
use PrestaShop\PrestaShop\Core\Exception\CoreException;
use PrestaShopException;
use ReflectionMethod;
use Tests\Integration\VV\Support\PathTestCase;

/**
 * RF-10 — caja blanca de AbstractObjectModelValidator::validateObjectModelLocalizedProperty, llamada por
 * FeatureValueValidator (docs/testing/RF-10-agregar-valor-caracteristica.md).
 */
final class RF10ValidateLocalizedPropertyPathsTest extends PathTestCase
{
    private function validate(FeatureValue $featureValue): void
    {
        $validator = new FeatureValueValidator();
        (new ReflectionMethod($validator, 'validateObjectModelLocalizedProperty'))
            ->invoke($validator, $featureValue, 'value', FeatureValueConstraintException::class, FeatureValueConstraintException::INVALID_VALUE);
    }

    private static function featureValue(?array $value): FeatureValue
    {
        $featureValue = new FeatureValue();
        $featureValue->id_feature = 1;
        $featureValue->value = $value;

        return $featureValue;
    }

    private function otherLang(): int
    {
        return self::defaultLang() + 1;
    }

    public function testCamino1ValorNuloExigeElIdiomaPorDefecto(): void
    {
        $this->expectException(FeatureValueConstraintException::class);

        $this->validate(self::featureValue(null));
    }

    public function testCamino2ValorValidoNoLanza(): void
    {
        $this->validate(self::featureValue([self::defaultLang() => 'VV Algodón']));

        $this->addToAssertionCount(1);
    }

    public function testCamino3ValorConMarcadoLanza(): void
    {
        $this->expectException(FeatureValueConstraintException::class);

        $this->validate(self::featureValue([self::defaultLang() => 'Lana<b>']));
    }

    public function testCamino4ConfigurationGetLanza(): void
    {
        self::markTestSkipped('No forzable: Configuration::get() lee una caché cargada al arrancar el kernel y no vuelve a consultar la BD.');
    }

    public function testCamino5ValidateFieldLanzaYSeTraduceACoreException(): void
    {
        // Arrange — stub parcial: validateField lanza
        $featureValue = $this->getMockBuilder(FeatureValue::class)->onlyMethods(['validateField'])->getMock();
        $featureValue->value = [self::defaultLang() => 'x'];
        $featureValue->method('validateField')->willThrowException(new PrestaShopException('forzada'));

        // Act / Assert
        $this->expectException(CoreException::class);
        $this->validate($featureValue);
    }

    public function testCamino6FaltaElIdiomaPorDefectoAunqueOtroSeaValido(): void
    {
        $this->expectException(FeatureValueConstraintException::class);

        $this->validate(self::featureValue([$this->otherLang() => 'Lino']));
    }

    public function testCamino7SegundoIdiomaInvalido(): void
    {
        $this->expectException(FeatureValueConstraintException::class);

        $this->validate(self::featureValue([self::defaultLang() => 'ok', $this->otherLang() => 'Lana<b>']));
    }

    public function testMetricasUsoDeCpuYMemoria(): void
    {
        $featureValue = self::featureValue([self::defaultLang() => 'VV Algodón']);
        self::measure('RF-10', fn () => $this->validate($featureValue), 20000);
    }
}
