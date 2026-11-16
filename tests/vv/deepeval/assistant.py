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
        ['docker', 'exec', '-u', 'www-data', '-w', '/var/www/html', CONTAINER,
         'php', 'bin/console', 'prestashop:ai:assistant', assistant, payload_json],
        capture_output=True, text=True, encoding='utf-8', timeout=600, check=True,
    )
    last_line = [line for line in completed.stdout.splitlines() if line.strip()][-1]
    return json.loads(last_line)


def brand(name: str, facts: list[str]) -> dict:
    return ask('brand-description', json.dumps({'brand': name, 'facts': facts}, ensure_ascii=False))


def tax(question: str) -> dict:
    return ask('tax-explainer', json.dumps({'question': question}, ensure_ascii=False))
