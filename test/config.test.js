import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  applyEnv,
  configPath,
  defaultConfig,
  getConfigValue,
  loadConfig,
  saveConfig,
  setConfigValue
} from '../src/config.js';

test('uses BB_CONFIG as explicit config path', () => {
  assert.equal(configPath({ BB_CONFIG: './tmp/config.json' }), path.resolve('./tmp/config.json'));
});

test('saves and loads config', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'bb-config-'));
  const env = { BB_CONFIG: path.join(dir, 'config.json') };

  try {
    const config = setConfigValue(setConfigValue(defaultConfig(), 'key', 'abc'), 'group', 'demo');
    await saveConfig(config, env);
    const loaded = await loadConfig(env);

    assert.equal(getConfigValue(loaded.config, 'key'), 'abc');
    assert.equal(getConfigValue(loaded.config, 'group'), 'demo');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('applies environment overrides', () => {
  const config = setConfigValue(defaultConfig(), 'key', 'file-key');
  const resolved = applyEnv(config, {
    BARK_KEY: 'env-key',
    BARK_SERVER: 'https://example.com/',
    BARK_GROUP: 'env-group'
  });

  assert.equal(resolved.key, 'env-key');
  assert.equal(resolved.server, 'https://example.com');
  assert.equal(resolved.defaults.group, 'env-group');
});
