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

use Db;
use DbPDO;
use Throwable;

/**
 * Fake of the Db singleton: real connection, but the next call to a chosen method returns a forced value
 * or throws. Used to reach the "add()/save() returned false or threw" paths of the handlers.
 */
final class FaultyDb extends DbPDO
{
    private static ?Db $original = null;

    /** @var array<string, mixed> */
    private array $faults = [];

    public static function install(string $method, mixed $outcome): self
    {
        $db = new self(_DB_SERVER_, _DB_USER_, _DB_PASSWD_, _DB_NAME_);
        $db->faults[$method] = $outcome;
        self::$original ??= Db::getInstance();
        Db::$instance[0] = $db;

        return $db;
    }

    public static function restore(): void
    {
        if (null !== self::$original) {
            Db::$instance[0] = self::$original;
            self::$original = null;
        }
    }

    private function fault(string $method): ?array
    {
        if (!array_key_exists($method, $this->faults)) {
            return null;
        }
        $outcome = $this->faults[$method];
        unset($this->faults[$method]);
        if ($outcome instanceof Throwable) {
            throw $outcome;
        }

        return ['value' => $outcome];
    }

    public function insert($table, $data, $null_values = false, $use_cache = true, $type = Db::INSERT, $add_prefix = true)
    {
        return ($f = $this->fault('insert')) ? $f['value'] : parent::insert($table, $data, $null_values, $use_cache, $type, $add_prefix);
    }

    public function update($table, $data, $where = '', $limit = 0, $null_values = false, $use_cache = true, $add_prefix = true)
    {
        return ($f = $this->fault('update')) ? $f['value'] : parent::update($table, $data, $where, $limit, $null_values, $use_cache, $add_prefix);
    }

    public function delete($table, $where = '', $limit = 0, $use_cache = true, $add_prefix = true)
    {
        return ($f = $this->fault('delete')) ? $f['value'] : parent::delete($table, $where, $limit, $use_cache, $add_prefix);
    }

    public function execute($sql, $use_cache = true)
    {
        return ($f = $this->fault('execute')) ? $f['value'] : parent::execute($sql, $use_cache);
    }

    public function executeS($sql, $array = true, $use_cache = true)
    {
        return ($f = $this->fault('executeS')) ? $f['value'] : parent::executeS($sql, $array, $use_cache);
    }

    public function getRow($sql, $use_cache = true)
    {
        return ($f = $this->fault('getRow')) ? $f['value'] : parent::getRow($sql, $use_cache);
    }
}
