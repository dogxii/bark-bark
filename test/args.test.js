import test from 'node:test';
import assert from 'node:assert/strict';

import { parseArgv } from '../src/args.js';

test('parses push command with body and options', () => {
  const parsed = parseArgv(['push', 'hello', 'world', '--title', 'Greeting', '-g', 'demo']);

  assert.equal(parsed.command, 'push');
  assert.deepEqual(parsed.positional, ['hello', 'world']);
  assert.deepEqual(parsed.options, {
    title: 'Greeting',
    group: 'demo'
  });
});

test('parses equals options and booleans', () => {
  const parsed = parseArgv(['push', '--title=Hi', '--dry-run', '--json=false', 'body']);

  assert.equal(parsed.command, 'push');
  assert.deepEqual(parsed.positional, ['body']);
  assert.equal(parsed.options.title, 'Hi');
  assert.equal(parsed.options['dry-run'], true);
  assert.equal(parsed.options.json, false);
});

test('rejects unknown options', () => {
  assert.throws(() => parseArgv(['push', '--wat']), /unknown option/);
});
