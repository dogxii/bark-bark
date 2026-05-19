#!/usr/bin/env node

import { run } from '../src/cli.js';

try {
  const code = await run(process.argv.slice(2), {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
    env: process.env
  });

  process.exitCode = code;
} catch (error) {
  process.stderr.write(`bb: ${error.message}\n`);
  process.exitCode = 1;
}
