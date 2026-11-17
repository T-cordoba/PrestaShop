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

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use PrestaShop\PrestaShop\Core\Domain\Country\AddressFormat\AddressFormatChecker;
use PrestaShop\PrestaShop\Core\Domain\Country\AddressFormat\AddressFormatFieldsProviderInterface;
use Symfony\Contracts\Translation\TranslatorInterface;
use Tests\Unit\VV\Support\Expect;

/**
 * RF-05 — "Object:field" tokens of the address format (the part of validate() outside the white-box paths).
 */
final class RF05AddressFormatCheckerObjectTokenTest extends TestCase
{
    private function checker(): AddressFormatChecker
    {
        // Stub: fixed field catalogue, no database.
        $fields = $this->createStub(AddressFormatFieldsProviderInterface::class);
        $fields->method('getPickerClasses')->willReturn(['Country']);
        $fields->method('getFieldsForClass')->willReturnMap([
            ['Address', ['firstname']],
            ['Country', ['name']],
        ]);
        $fields->method('getRequiredFields')->willReturn([]);
        $translator = $this->createStub(TranslatorInterface::class);
        $translator->method('trans')->willReturnCallback(fn (string $id, array $params) => strtr($id, $params));

        return new AddressFormatChecker($fields, $translator);
    }

    public static function invalidObjectTokens(): iterable
    {
        yield 'missing field' => ['Country:', 'Syntax error with this pattern: Country:.'];
        yield 'missing object' => [':name', 'Syntax error with this pattern: :name.'];
        yield 'too many parts' => ['Country:name:iso', 'Syntax error with this pattern: Country:name:iso.'];
        yield 'object not allowed' => ['Customer:email', 'This object is not allowed: Customer.'];
        yield 'unknown field' => ['Country:capital', 'The field capital does not exist on Country.'];
    }

    #[DataProvider('invalidObjectTokens')]
    public function testInvalidObjectTokenGivesItsError(string $format, string $error): void
    {
        // Act
        $errors = $this->checker()->validate($format);

        // Assert
        Expect::that($errors)->toBe([$error]);
    }

    public function testValidObjectTokenIsCaseInsensitive(): void
    {
        // Act
        $errors = $this->checker()->validate('firstname country:NAME');

        // Assert
        Expect::that($errors)->toBeEmpty();
    }
}
