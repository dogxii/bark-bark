import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';

import { run } from '../src/cli.js';

test('masks Bark keys in dry-run output', async () => {
  const io = mockIo();
  const code = await run(['push', 'hello', '--key', 'secret123456', '--dry-run'], io);

  assert.equal(code, 0);
  assert.match(io.stdout.text, /secr\.\.\.3456/);
  assert.doesNotMatch(io.stdout.text, /secret123456/);
});

test('reports missing key before creating a push payload', async () => {
  const io = mockIo({
    BB_CONFIG: path.join(os.tmpdir(), `bark-bark-test-missing-key-${process.pid}.json`)
  });

  await assert.rejects(
    () => run(['push', 'hello', '--dry-run'], io),
    /Bark key is required/
  );
});

test('uses configured push defaults', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'bb-cli-'));
  const env = { BB_CONFIG: path.join(dir, 'config.json') };

  try {
    await run(['config', 'set', 'key', 'secret123456'], mockIo(env));
    await run(['config', 'set', 'title', 'Dogxi'], mockIo(env));
    await run(['config', 'set', 'group', 'demo'], mockIo(env));

    const io = mockIo(env);
    await run(['push', 'hello', '--dry-run'], io);

    const result = JSON.parse(io.stdout.text);
    assert.equal(result.payload.title, 'Dogxi');
    assert.equal(result.payload.group, 'demo');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('unsets configured defaults', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'bb-cli-'));
  const env = { BB_CONFIG: path.join(dir, 'config.json') };

  try {
    await run(['config', 'set', 'title', 'Dogxi'], mockIo(env));
    await run(['config', 'unset', 'title'], mockIo(env));

    const io = mockIo(env);
    await run(['config', 'get', 'title'], io);

    assert.equal(io.stdout.text, '\n');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('reads push body from stdin when body is dash', async () => {
  const io = mockIo({}, ['hello from stdin']);
  const code = await run(['push', '-', '--key', 'secret123456', '--dry-run'], io);

  const result = JSON.parse(io.stdout.text);
  assert.equal(code, 0);
  assert.equal(result.payload.body, 'hello from stdin');
});

function mockIo(env = {}, input = []) {
  return {
    env,
    stdin: stdin(input),
    stdout: sink(),
    stderr: sink()
  };
}

function stdin(input) {
  const stream = Readable.from(input);
  stream.isTTY = true;
  return stream;
}

function sink() {
  return {
    text: '',
    write(chunk) {
      this.text += chunk;
    }
  };
}
