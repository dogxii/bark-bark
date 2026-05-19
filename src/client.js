const KNOWN_LEVELS = new Set(['active', 'timeSensitive', 'passive', 'critical']);
const USER_AGENT = 'bark-bark';

export function createPushPayload(options) {
  const body = String(options.body || '').trim();

  if (!body) {
    throw new Error('push body is required');
  }

  const keys = normalizeKeys(options.key);

  if (keys.length === 0) {
    throw new Error('Bark key is required. Run `bb config set key <key>` or set BARK_KEY.');
  }

  const payload = { body };

  if (keys.length === 1) {
    payload.device_key = keys[0];
  } else {
    payload.device_keys = keys;
  }

  assignString(payload, 'title', options.title);
  assignString(payload, 'subtitle', options.subtitle);
  assignString(payload, 'group', options.group);
  assignString(payload, 'url', options.url);
  assignString(payload, 'sound', options.sound);
  assignString(payload, 'icon', normalizeIcon(options.icon));
  assignBoolean(payload, 'isArchive', options.archive);
  assignBoolean(payload, 'autoCopy', options.copy);

  if (options.level) {
    if (!KNOWN_LEVELS.has(options.level)) {
      throw new Error('level must be one of active, timeSensitive, passive, critical');
    }

    payload.level = options.level;
  }

  if (options.badge !== undefined && options.badge !== '') {
    const badge = Number.parseInt(options.badge, 10);

    if (!Number.isFinite(badge) || badge < 0) {
      throw new Error('badge must be a non-negative integer');
    }

    payload.badge = badge;
  }

  return payload;
}

export async function pushNotification(options) {
  const server = normalizeServer(options.server);
  const payload = createPushPayload(options);
  const endpoint = `${server}/push`;

  if (options.dryRun) {
    return {
      endpoint,
      payload,
      response: null
    };
  }

  const response = await fetchWithTimeout(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': USER_AGENT
    },
    body: JSON.stringify(payload)
  }, options.timeout);

  const text = await response.text();
  const data = text ? parseJson(text, endpoint) : null;

  if (!response.ok) {
    const detail = data?.message || data?.error || response.statusText;
    throw new Error(withPushHint(`Bark request failed (${response.status}): ${detail}`, detail, payload));
  }

  if (data && typeof data.code === 'number' && data.code !== 200) {
    const detail = data.message || 'unknown error';
    throw new Error(withPushHint(`Bark request failed (${data.code}): ${detail}`, detail, payload));
  }

  return {
    endpoint,
    payload,
    response: data
  };
}

export async function pingServer(options) {
  const server = normalizeServer(options.server);
  const endpoint = `${server}/ping`;

  if (options.dryRun) {
    return {
      endpoint,
      response: null
    };
  }

  const response = await fetchWithTimeout(endpoint, {
    method: 'GET',
    headers: {
      'user-agent': USER_AGENT
    }
  }, options.timeout);

  const text = await response.text();
  const data = text ? parseJson(text, endpoint) : null;

  if (!response.ok) {
    const detail = data?.message || data?.error || response.statusText;
    throw new Error(`Bark ping failed (${response.status}): ${detail}`);
  }

  return {
    endpoint,
    response: data
  };
}

export function normalizeServer(value) {
  const server = String(value || '').trim().replace(/\/+$/, '');

  if (!server) {
    throw new Error('Bark server is required');
  }

  if (!/^https?:\/\//.test(server)) {
    throw new Error('Bark server must start with http:// or https://');
  }

  return server;
}

function normalizeKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function assignString(payload, key, value) {
  if (value !== undefined && value !== '') {
    payload[key] = String(value);
  }
}

function normalizeIcon(value) {
  if (value === undefined || value === '') {
    return value;
  }

  const icon = String(value).replaceAll(/\\([?=&])/g, '$1');

  if (!/^https?:\/\//.test(icon)) {
    throw new Error('icon must be an http:// or https:// URL');
  }

  return icon;
}

function assignBoolean(payload, key, value) {
  if (value === true) {
    payload[key] = '1';
  }
}

async function fetchWithTimeout(url, init, timeout) {
  const timeoutMs = Number.parseInt(timeout || '15000', 10);

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error('timeout must be a positive integer in milliseconds');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Bark request timed out after ${timeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function parseJson(text, endpoint) {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Bark server returned non-JSON response from ${endpoint}`);
  }
}

function withPushHint(message, detail, payload) {
  const key = payload.device_key || payload.device_keys?.[0] || '';
  const looksLikeApnsToken = /^[a-f0-9]{64}$/i.test(key);
  const missingDeviceToken = /failed to get .*device token from database/i.test(detail || '');

  if (!looksLikeApnsToken && !missingDeviceToken) {
    return message;
  }

  return `${message}\nHint: bb uses Bark Server mode and expects the Bark push key from the app test URL, not the raw APNs device token. Copy the key from a URL like https://api.day.app/<key>/hello and run \`bb config set key <key>\`.`;
}
