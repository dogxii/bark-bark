import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const DEFAULT_SERVER = 'https://api.day.app';

const CONFIG_KEYS = new Set([
  'group',
  'icon',
  'key',
  'level',
  'server',
  'sound'
]);

export function defaultConfig() {
  return {
    server: DEFAULT_SERVER,
    key: '',
    defaults: {}
  };
}

export function configPath(env = process.env) {
  if (env.BB_CONFIG) {
    return path.resolve(env.BB_CONFIG);
  }

  if (env.XDG_CONFIG_HOME) {
    return path.join(env.XDG_CONFIG_HOME, 'bark-bark', 'config.json');
  }

  if (process.platform === 'win32' && env.APPDATA) {
    return path.join(env.APPDATA, 'bark-bark', 'config.json');
  }

  const home = env.HOME || os.homedir();
  return path.join(home, '.config', 'bark-bark', 'config.json');
}

export async function loadConfig(env = process.env) {
  const file = configPath(env);
  const base = defaultConfig();

  try {
    const raw = await readFile(file, 'utf8');
    const loaded = JSON.parse(raw);
    return {
      path: file,
      config: normalizeConfig({ ...base, ...loaded })
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { path: file, config: base };
    }

    if (error instanceof SyntaxError) {
      throw new Error(`invalid config JSON at ${file}`);
    }

    throw error;
  }
}

export async function saveConfig(config, env = process.env) {
  const file = configPath(env);
  const normalized = normalizeConfig(config);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return file;
}

export function applyEnv(config, env = process.env) {
  const next = cloneConfig(config);

  if (env.BB_SERVER || env.BARK_SERVER) {
    next.server = env.BB_SERVER || env.BARK_SERVER;
  }

  if (env.BB_KEY || env.BARK_KEY) {
    next.key = env.BB_KEY || env.BARK_KEY;
  }

  if (env.BB_GROUP || env.BARK_GROUP) {
    next.defaults.group = env.BB_GROUP || env.BARK_GROUP;
  }

  return normalizeConfig(next);
}

export function setConfigValue(config, key, value) {
  if (!CONFIG_KEYS.has(key)) {
    throw new Error(`unknown config key "${key}"`);
  }

  const next = cloneConfig(config);

  if (key === 'server' || key === 'key') {
    next[key] = value;
  } else if (value === '') {
    delete next.defaults[key];
  } else {
    next.defaults[key] = value;
  }

  return normalizeConfig(next);
}

export function getConfigValue(config, key) {
  if (!CONFIG_KEYS.has(key)) {
    throw new Error(`unknown config key "${key}"`);
  }

  if (key === 'server' || key === 'key') {
    return config[key] ?? '';
  }

  return config.defaults?.[key] ?? '';
}

export function publicConfig(config) {
  const next = cloneConfig(config);

  if (next.key) {
    next.key = maskKey(next.key);
  }

  return next;
}

export function normalizeConfig(config) {
  const next = {
    server: String(config.server || DEFAULT_SERVER).replace(/\/+$/, ''),
    key: normalizeKey(config.key),
    defaults: normalizeDefaults(config.defaults)
  };

  return next;
}

function normalizeKey(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value || '').trim();
}

function normalizeDefaults(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const defaults = {};

  for (const key of ['group', 'icon', 'level', 'sound']) {
    if (value[key] !== undefined && value[key] !== '') {
      defaults[key] = String(value[key]);
    }
  }

  return defaults;
}

function cloneConfig(config) {
  return {
    server: config.server,
    key: Array.isArray(config.key) ? [...config.key] : config.key,
    defaults: { ...(config.defaults || {}) }
  };
}

function maskKey(value) {
  if (Array.isArray(value)) {
    return value.map(maskKey);
  }

  if (value.length <= 8) {
    return '********';
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}
