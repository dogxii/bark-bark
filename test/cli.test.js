import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

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

function mockIo(env = {}) {
  return {
    env,
    stdin: { isTTY: true },
    stdout: sink(),
    stderr: sink()
  };
}

function sink() {
  return {
    text: '',
    write(chunk) {
      this.text += chunk;
    }
  };
}
