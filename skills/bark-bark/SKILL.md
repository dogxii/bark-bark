---
name: bark-bark
description: Use when an AI agent needs to send Bark notifications with the bark-bark CLI (`bb`), configure or diagnose bark-bark usage, document bark-bark commands, or maintain the bark-bark repository while preserving its zero-dependency, simple, portable design.
---

# Bark Bark

## Core Rule

Keep bark-bark simple: prefer one clear `bb` command, no new dependencies unless unavoidable, and small portable behavior that works in scripts, CI, npx, and bunx.

## Send Notifications

Prefer the installed `bb` command. If it is unavailable and the task allows network/npm execution, use `npx bark-bark`.

```sh
bb push 'hello'
bb push 'hello' --title 'Dogxi'
printf 'build done' | bb push -
```

Use `--dry-run` when validating command construction or when the user has not clearly asked to send a real notification.

```sh
bb push 'hello' --title 'Dogxi' --dry-run
```

## Configure

Use the Bark key from the middle of the Bark app test URL, not a raw APNs device token.

```text
https://api.day.app/<bark-key>/Body
```

Useful commands:

```sh
bb init <bark-key>
bb config set key <bark-key>
bb config set server https://api.day.app
bb config set title Dogxi
bb config unset title
bb config list
bb config path
```

Environment overrides are best for CI:

```sh
BARK_KEY=<bark-key> bb push 'deploy done'
BARK_SERVER=https://api.day.app bb push 'deploy done'
```

## Safety

- Never expose raw Bark keys in user-facing output. Prefer masked examples like `CVGw********EyEh`.
- Do not commit local config files or secrets.
- If Bark returns `failed to get device token from database`, explain that the server did not recognize the Bark key and that a raw APNs device token is likely being used.
- For `--icon`, prefer PNG or JPEG URLs and quote query strings:

```sh
bb push 'hello' --icon 'https://example.com/avatar.jpg?s=80&d=identicon'
```

## Repository Maintenance

When editing the bark-bark repo:

1. Keep changes narrow and dependency-free.
2. Add focused tests for CLI/config/client behavior.
3. Run `npm test` and `npm publish --dry-run` before release work.
4. Keep README examples short and practical.
5. Avoid adding screenshots or generated assets to the npm package unless explicitly requested.
