"""Calls the PrestaShop AI assistants (bin/console prestashop:ai:assistant) inside the shop container."""
import json
import os
import subprocess
from functools import lru_cache

from deepeval.models import OllamaModel

CONTAINER = os.environ.get('VV_PS_CONTAINER', 'prestashop-prestashop-git-1')
JUDGE = OllamaModel(model=os.environ.get('VV_JUDGE_MODEL', 'qwen2.5:latest'), base_url='http://localhost:11434', temperature=0)


@lru_cache(maxsize=None)
def ask(assistant: str, payload_json: str) -> dict:
    """Returns {"output": str, "context": [str]} — cached so every metric scores the same answer."""
    completed = subprocess.run(
        ['docker', 'exec', '-u', 'www-data', '-w', '/var/www/html', '-e', 'VV_OLLAMA_MODEL=qwen2.5:latest', CONTAINER,
         'php', 'bin/console', '--env=prod', '--no-debug', 'prestashop:ai:assistant', assistant, payload_json],
        capture_output=True, text=True, encoding='utf-8', timeout=600, check=True,
    )
    last_line = [line for line in completed.stdout.splitlines() if line.strip()][-1]
    return json.loads(last_line)


def brand(name: str, facts: list[str]) -> dict:
    return ask('brand-description', json.dumps({'brand': name, 'facts': facts}, ensure_ascii=False))


def tax(question: str) -> dict:
    return ask('tax-explainer', json.dumps({'question': question}, ensure_ascii=False))


def evaluate_and_record(suite: str, case_id: str, test_case, metrics, extra: dict | None = None) -> list[str]:
    """Measures every metric (so all scores are recorded, not only the first failure), appends the case to
    ../reports/deepeval/<suite>.jsonl and returns the failed metric names."""
    import pathlib
    results, failed = [], []
    for metric in metrics:
        metric.measure(test_case)
        name = getattr(metric, 'name', None) or metric.__class__.__name__
        results.append({'metric': name, 'score': metric.score, 'threshold': metric.threshold, 'success': metric.is_successful(), 'reason': metric.reason})
        if not metric.is_successful():
            failed.append(f'{name} ({metric.score:.2f} < {metric.threshold})')
    out = pathlib.Path(__file__).parent.parent / 'reports' / 'deepeval' / f'{suite}.jsonl'
    out.parent.mkdir(parents=True, exist_ok=True)
    record = {'id': case_id, 'input': test_case.input, 'output': test_case.actual_output, 'context': test_case.context, 'metrics': results, **(extra or {})}
    with out.open('a', encoding='utf-8') as f:
        f.write(json.dumps(record, ensure_ascii=False) + '\n')
    return failed
