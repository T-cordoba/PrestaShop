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

namespace PrestaShopBundle\Command;

use Configuration;
use PrestaShop\PrestaShop\Adapter\Ai\BrandDescriptionWriter;
use PrestaShop\PrestaShop\Adapter\Ai\TaxConfigurationExplainer;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * Runs the AI assistants from the CLI and prints a JSON answer; this is the entry point the DeepEval suites use.
 */
#[AsCommand(name: 'prestashop:ai:assistant', description: 'Run an AI assistant (brand-description | tax-explainer) on a JSON input.')]
final class AiAssistantCommand extends Command
{
    public function __construct(
        private readonly BrandDescriptionWriter $brandDescriptionWriter,
        private readonly TaxConfigurationExplainer $taxConfigurationExplainer,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('assistant', InputArgument::REQUIRED, 'brand-description | tax-explainer')
            ->addArgument('input', InputArgument::REQUIRED, 'JSON: {"brand": "...", "facts": [...]} or {"question": "..."}');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $data = json_decode((string) $input->getArgument('input'), true);
        if (!is_array($data)) {
            $output->writeln(json_encode(['error' => 'The input must be a JSON object']));

            return self::INVALID;
        }

        switch ($input->getArgument('assistant')) {
            case 'brand-description':
                $facts = array_values(array_filter((array) ($data['facts'] ?? []), 'is_string'));
                $result = ['output' => $this->brandDescriptionWriter->write((string) ($data['brand'] ?? ''), $facts), 'context' => $facts];
                break;
            case 'tax-explainer':
                $result = $this->taxConfigurationExplainer->explain((string) ($data['question'] ?? ''), (int) Configuration::get('PS_LANG_DEFAULT'));
                break;
            default:
                $output->writeln(json_encode(['error' => 'Unknown assistant']));

                return self::INVALID;
        }

        $output->writeln(json_encode($result, JSON_UNESCAPED_UNICODE));

        return self::SUCCESS;
    }
}
