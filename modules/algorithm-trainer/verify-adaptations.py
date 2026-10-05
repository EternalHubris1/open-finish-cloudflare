"""Validate local teaching fixtures with independently written reference solvers.

Reads JSON on stdin; no files, network or account data are modified.
"""
import collections
import itertools
import json
import sys


def pair(values, target, offset=0):
    return next([i + offset, j + offset] for i in range(len(values))
                for j in range(i + 1, len(values)) if values[i] + values[j] == target)


def group(words):
    groups = collections.defaultdict(list)
    for word in words:
        groups[tuple(sorted(word))].append(word)
    return sorted(sorted(values) for values in groups.values())


def palindrome(text):
    meaningful = ''.join(char.lower() for char in text if char.isalnum())
    return meaningful == meaningful[::-1]


def profit(prices):
    return max([0] + [prices[j] - prices[i] for i in range(len(prices))
                      for j in range(i + 1, len(prices))])


def substring(text):
    return max([0] + [j - i for i in range(len(text)) for j in range(i + 1, len(text) + 1)
                      if len(set(text[i:j])) == j - i])


def brackets(text):
    while '()' in text or '[]' in text or '{}' in text:
        text = text.replace('()', '').replace('[]', '').replace('{}', '')
    return not text


def parentheses(n):
    answers = []
    for candidate in itertools.product('()', repeat=2 * n):
        text = ''.join(candidate)
        balance = 0
        for char in text:
            balance += 1 if char == '(' else -1
            if balance < 0:
                break
        else:
            if balance == 0:
                answers.append(text)
    return sorted(answers)


def stairs(n):
    left, right = 1, 1
    for _ in range(n):
        left, right = right, left + right
    return left


solvers = {
    'lc-contains-duplicate': lambda values: len(set(values)) < len(values),
    'lc-two-sum': pair,
    'lc-valid-anagram': lambda left, right: sorted(left) == sorted(right),
    'lc-group-anagrams': group,
    'lc-valid-palindrome': palindrome,
    'lc-two-sum-ii-input-array-is-sorted': lambda values, target: pair(values, target, 1),
    'lc-best-time-to-buy-and-sell-stock': profit,
    'lc-longest-substring-without-repeating-characters': substring,
    'lc-binary-search': lambda values, target: values.index(target) if target in values else -1,
    'lc-valid-parentheses': brackets,
    'lc-generate-parentheses': parentheses,
    'lc-climbing-stairs': stairs,
}
tasks = json.load(sys.stdin)
assert {task['id'] for task in tasks} == set(solvers), 'Adapter coverage mismatch'
checked = 0
for task in tasks:
    for fixture in task['tests']:
        actual = solvers[task['id']](*fixture['args'])
        assert actual == fixture['expected'], (task['id'], fixture, actual)
        checked += 1
print(f'{len(tasks)} adapters, {checked} reference fixtures verified')
