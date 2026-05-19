---
name: bark-bark
description: Use when an AI agent needs to send Bark notifications with the bark-bark CLI (`bb`), configure bark-bark, diagnose Bark push errors, or document concise bark-bark command examples.
---

# Bark Bark

## Core Rule

Prefer the shortest clear `bb` command. Use `npx bark-bark` only when `bb` is not installed.

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

Environment overrides are useful in CI:

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
