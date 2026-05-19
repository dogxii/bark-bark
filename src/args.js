const OPTION_ALIASES = new Map([
  ['h', 'help'],
  ['v', 'version'],
  ['t', 'title'],
  ['s', 'server'],
  ['k', 'key'],
  ['g', 'group'],
  ['u', 'url']
]);

const VALUE_OPTIONS = new Set([
  'badge',
  'config',
  'group',
  'icon',
  'key',
  'level',
  'server',
  'sound',
  'subtitle',
  'timeout',
  'title',
  'url'
]);

const BOOLEAN_OPTIONS = new Set([
  'archive',
  'copy',
  'dry-run',
  'help',
  'json',
  'stdin',
  'version'
]);

export function parseArgv(argv) {
  const positional = [];
  const options = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--') {
      positional.push(...argv.slice(index + 1));
      break;
    }

    if (arg.startsWith('--')) {
      const equalIndex = arg.indexOf('=');
      const rawName = equalIndex === -1 ? arg.slice(2) : arg.slice(2, equalIndex);
      const value = equalIndex === -1 ? undefined : arg.slice(equalIndex + 1);

      if (!rawName) {
        throw new Error('invalid empty option');
      }

      if (BOOLEAN_OPTIONS.has(rawName)) {
        options[rawName] = value === undefined ? true : parseBoolean(rawName, value);
        continue;
      }

      if (VALUE_OPTIONS.has(rawName)) {
        options[rawName] = value ?? readOptionValue(argv, ++index, rawName);
        continue;
      }

      throw new Error(`unknown option --${rawName}`);
    }

    if (arg.startsWith('-') && arg !== '-') {
      const rawName = arg.slice(1);
      const name = OPTION_ALIASES.get(rawName);

      if (!name) {
        throw new Error(`unknown option -${rawName}`);
      }

      if (BOOLEAN_OPTIONS.has(name)) {
        options[name] = true;
        continue;
      }

      options[name] = readOptionValue(argv, ++index, name);
      continue;
    }

    positional.push(arg);
  }

  return {
    command: positional[0],
    positional: positional.slice(1),
    options
  };
}

function readOptionValue(argv, index, name) {
  const value = argv[index];

  if (value === undefined) {
    throw new Error(`missing value for --${name}`);
  }

  return value;
}

function parseBoolean(name, value) {
  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  throw new Error(`invalid boolean value for --${name}`);
}
