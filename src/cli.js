import { createRequire } from 'node:module';
import { parseArgv } from './args.js';
import {
  applyEnv,
  getConfigValue,
  loadConfig,
  publicConfig,
  saveConfig,
  setConfigValue,
  unsetConfigValue
} from './config.js';
import { pingServer, pushNotification } from './client.js';

const { version: VERSION } = createRequire(import.meta.url)('../package.json');

export async function run(argv, io) {
  const parsed = parseArgv(argv);
  const command = parsed.command;

  if (parsed.options.version) {
    write(io.stdout, `bb ${VERSION}\n`);
    return 0;
  }

  if (!command || command === 'help' || (parsed.options.help && command !== 'push')) {
    write(io.stdout, helpText());
    return 0;
  }

  switch (command) {
    case 'push':
    case 'p':
      return pushCommand(parsed, io);
    case 'config':
      return configCommand(parsed, io);
    case 'init':
      return initCommand(parsed, io);
    case 'ping':
      return pingCommand(parsed, io);
    case 'help':
      write(io.stdout, helpText());
      return 0;
    default:
      throw new Error(`unknown command "${command}". Run \`bb help\`.`);
  }
}

async function pingCommand(parsed, io) {
  const { config } = await loadConfig(parsedEnv(io.env, parsed.options));
  const resolved = applyEnv(config, io.env);
  const result = await pingServer({
    server: parsed.options.server || resolved.server,
    timeout: parsed.options.timeout,
    dryRun: parsed.options['dry-run'] === true
  });

  if (parsed.options.json || parsed.options['dry-run']) {
    write(io.stdout, `${JSON.stringify(publicResult(result), null, 2)}\n`);
  } else {
    write(io.stdout, 'ok\n');
  }

  return 0;
}

async function pushCommand(parsed, io) {
  if (parsed.options.help) {
    write(io.stdout, pushHelpText());
    return 0;
  }

  const { path, config } = await loadConfig(parsedEnv(io.env, parsed.options));
  const resolved = applyEnv(config, io.env);
  const body = await resolveBody(parsed, io);

  if (!resolved.key && !parsed.options.key) {
    throw new Error(`Bark key is required. Run \`bb config set key <key>\` or set BARK_KEY. Config checked at ${path}`);
  }

  const result = await pushNotification({
    ...resolved.defaults,
    ...pickPushOptions(parsed.options),
    server: parsed.options.server || resolved.server,
    key: parsed.options.key || resolved.key,
    body,
    dryRun: parsed.options['dry-run'] === true
  });

  if (parsed.options.json || parsed.options['dry-run']) {
    write(io.stdout, `${JSON.stringify(publicResult(result), null, 2)}\n`);
  } else {
    write(io.stdout, 'sent\n');
  }

  return 0;
}

async function configCommand(parsed, io) {
  const [subcommand, key, ...rest] = parsed.positional;
  const env = parsedEnv(io.env, parsed.options);
  const { path, config } = await loadConfig(env);

  switch (subcommand) {
    case undefined:
    case 'list':
      write(io.stdout, `${JSON.stringify(publicConfig(config), null, 2)}\n`);
      return 0;
    case 'path':
      write(io.stdout, `${path}\n`);
      return 0;
    case 'get':
      requireArg(key, 'config get <key>');
      write(io.stdout, `${getConfigValue(config, key)}\n`);
      return 0;
    case 'set': {
      requireArg(key, 'config set <key> <value>');
      const value = rest.join(' ');

      if (!value) {
        throw new Error('config set requires a value');
      }

      const change = prepareConfigSet(config, key, value, parsed.options);

      if (!change.changed) {
        write(io.stdout, `${key} unchanged\n`);
        return 0;
      }

      const next = setConfigValue(config, key, value);
      const file = await saveConfig(next, env);
      write(io.stdout, `saved ${key} to ${file}\n`);
      return 0;
    }
    case 'unset': {
      requireArg(key, 'config unset <key>');
      const next = unsetConfigValue(config, key);
      const file = await saveConfig(next, env);
      write(io.stdout, `unset ${key} in ${file}\n`);
      return 0;
    }
    default:
      throw new Error(`unknown config command "${subcommand}"`);
  }
}

async function initCommand(parsed, io) {
  const env = parsedEnv(io.env, parsed.options);
  const { config } = await loadConfig(env);
  let next = config;
  const key = parsed.options.key || parsed.positional[0];

  if (parsed.options.server) {
    prepareConfigSet(next, 'server', parsed.options.server, parsed.options);
    next = setConfigValue(next, 'server', parsed.options.server);
  }

  if (key) {
    prepareConfigSet(next, 'key', key, parsed.options);
    next = setConfigValue(next, 'key', key);
  }

  if (parsed.options.group) {
    prepareConfigSet(next, 'group', parsed.options.group, parsed.options);
    next = setConfigValue(next, 'group', parsed.options.group);
  }

  const file = await saveConfig(next, env);
  write(io.stdout, `initialized ${file}\n`);

  if (!key) {
    write(io.stdout, 'next: bb config set key <your-bark-key>\n');
  }

  return 0;
}

async function resolveBody(parsed, io) {
  if (parsed.positional.length === 1 && parsed.positional[0] === '-') {
    const input = await readStdin(io.stdin);
    return input.trim();
  }

  const positionalBody = parsed.positional.join(' ').trim();

  if (positionalBody) {
    return positionalBody;
  }

  if (parsed.options.stdin || !io.stdin.isTTY) {
    const input = await readStdin(io.stdin);
    return input.trim();
  }

  throw new Error('push body is required. Example: bb push "hello"');
}

function pickPushOptions(options) {
  return cleanObject({
    archive: options.archive,
    badge: options.badge,
    copy: options.copy,
    group: options.group,
    icon: options.icon,
    level: options.level,
    sound: options.sound,
    subtitle: options.subtitle,
    timeout: options.timeout,
    title: options.title,
    url: options.url
  });
}

function prepareConfigSet(config, key, value, options) {
  const current = getConfigValue(config, key);
  const next = String(value);

  if (current === next) {
    return { changed: false };
  }

  if (current && !options.force) {
    throw new Error(`${key} is already set. Use --force to overwrite.`);
  }

  return { changed: true };
}

function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined)
  );
}

function parsedEnv(env, options) {
  if (!options.config) {
    return env;
  }

  return {
    ...env,
    BB_CONFIG: options.config
  };
}

function requireArg(value, usage) {
  if (!value) {
    throw new Error(`usage: bb ${usage}`);
  }
}

function readStdin(stdin) {
  return new Promise((resolve, reject) => {
    let data = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => {
      data += chunk;
    });
    stdin.on('end', () => resolve(data));
    stdin.on('error', reject);
  });
}

function write(stream, text) {
  stream.write(text);
}

function publicResult(result) {
  if (!result.payload) {
    return result;
  }

  const payload = { ...result.payload };

  if (payload.device_key) {
    payload.device_key = maskSecret(payload.device_key);
  }

  if (payload.device_keys) {
    payload.device_keys = payload.device_keys.map(maskSecret);
  }

  return {
    ...result,
    payload
  };
}

function maskSecret(value) {
  const text = String(value);

  if (text.length <= 8) {
    return '********';
  }

  return `${text.slice(0, 4)}...${text.slice(-4)}`;
}

function helpText() {
  return `bb ${VERSION}

Usage:
  bb push <body> [options]
  bb config <list|get|set|unset|path>
  bb init [key] [--server <url>]
  bb ping

Examples:
  bb init <your-bark-key>
  bb push 'hello from bark-bark'
  bb push 'deploy done' --title Deploy --group ci
  echo 'stdin message' | bb push -
  echo 'stdin message' | bb push --stdin

Global options:
  --config <path>  Use a custom config file
  --force          Overwrite existing config values
  -h, --help       Show help
  -v, --version    Show version

Environment:
  BARK_KEY / BB_KEY        Bark device key
  BARK_SERVER / BB_SERVER  Bark server, defaults to https://api.day.app
  BARK_GROUP / BB_GROUP    Default notification group
`;
}

function pushHelpText() {
  return `Usage:
  bb push <body> [options]

Options:
  -t, --title <text>       Notification title
  --subtitle <text>        Notification subtitle
  -k, --key <key>          Bark key, comma-separated for multiple devices
  -s, --server <url>       Bark server
  -g, --group <name>       Notification group
  -u, --url <url>          URL to open from the notification
  --level <level>          active, timeSensitive, passive, critical
  --badge <number>         App badge number
  --sound <name>           Bark sound name
  --icon <url>             Notification icon URL
  --copy                   Auto copy body in Bark
  --archive                Save notification in Bark history
  --timeout <ms>           Request timeout, default 15000
  --dry-run                Print request payload without sending
  --json                   Print full JSON result
`;
}
