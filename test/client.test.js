import test from 'node:test';
import assert from 'node:assert/strict';

import { createPushPayload, normalizeServer } from '../src/client.js';

test('creates single-key Bark push payload', () => {
  const payload = createPushPayload({
    key: 'abc',
    body: 'hello',
    title: 'Hi',
    group: 'demo',
    badge: '3',
    copy: true,
    archive: true
  });

  assert.deepEqual(payload, {
    body: 'hello',
    device_key: 'abc',
    title: 'Hi',
    group: 'demo',
    badge: 3,
    autoCopy: '1',
    isArchive: '1'
  });
});

test('creates multi-key Bark push payload', () => {
  const payload = createPushPayload({
    key: 'a,b',
    body: 'hello'
  });

  assert.deepEqual(payload, {
    body: 'hello',
    device_keys: ['a', 'b']
  });
});

test('validates required push input', () => {
  assert.throws(() => createPushPayload({ key: 'abc', body: '' }), /body is required/);
  assert.throws(() => createPushPayload({ key: '', body: 'hello' }), /Bark key is required/);
  assert.throws(() => createPushPayload({ key: 'abc', body: 'hello', level: 'loud' }), /level must/);
});

test('validates icon URLs', () => {
  assert.throws(
    () => createPushPayload({ key: 'abc', body: 'hello', icon: 'file:///tmp/a.png' }),
    /http:\/\/ or https:\/\//
  );
});

test('normalizes accidentally escaped icon query characters', () => {
  const payload = createPushPayload({
    key: 'abc',
    body: 'hello',
    icon: 'https://example.com/a.png\\?s\\=80\\&d\\=x'
  });

  assert.equal(payload.icon, 'https://example.com/a.png?s=80&d=x');
});

test('normalizes server URL', () => {
  assert.equal(normalizeServer('https://api.day.app///'), 'https://api.day.app');
  assert.throws(() => normalizeServer('api.day.app'), /must start/);
});
