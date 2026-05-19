# bark-bark

[中文](./README.zh.md) | 英文

A tiny zero-dependency CLI for sending [Bark](https://github.com/Finb/Bark) notifications.

## Quick Start

```sh
bb push 'hello from bark-bark'
```

```sh
bb push 'hello' --title 'Dogxi' --icon 'https://weavatar.com/avatar/554b1d16bf407ccaedc51d762eeb8cd2.jpg'
```

![Bark notification screenshot](https://i.imgur.com/Y9AuXdd.jpeg)

## Install

Run without installing:

```sh
npx bark-bark push 'hello'
bunx bark-bark push 'hello'
```

Install globally:

```sh
npm install -g bark-bark
bb push 'hello'
```

Verify the package without installing:

```sh
npx bark-bark --version
npx bark-bark push 'hello' --key <bark-key>
```

## Configure

Initialize a config file:

```sh
bb init <your-bark-key>
```

Or set values one by one:

```sh
bb config set key <your-bark-key>
bb config set server https://api.day.app
bb config set title Dogxi
bb config set group cli
bb config unset title
```

Show the config path:

```sh
bb config path
```

`bb` reads config from:

```text
~/.config/bark-bark/config.json
```

You can override it with:

```sh
BB_CONFIG=/path/to/config.json bb push 'hello'
```

Use the middle part of the Bark app test URL as the key:

```text
https://api.day.app/CVGw837*******2ULrEyEh/Body
```

```sh
bb config set key <bark-key>
```

Do not use the raw APNs device token here. This CLI uses Bark Server mode, so the server must already know the push key.

## Push

```sh
bb push 'build finished'
bb push 'deploy done' --title Deploy --group ci
bb push 'open dashboard' --url https://example.com
bb push 'server warning' --level timeSensitive
bb push 'with icon' --icon 'https://example.com/avatar.png'
echo 'message from stdin' | bb push -
echo 'message from stdin' | bb push --stdin
bb ping
```

Useful options:

```text
-t, --title <text>       Notification title
--subtitle <text>        Notification subtitle
-k, --key <key>          Bark key, comma-separated for multiple devices
-s, --server <url>       Bark server, defaults to https://api.day.app
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
```

Quote URLs that contain query strings. Do not escape `?`, `=`, or `&` inside quotes:

```sh
bb push 'hello' --icon 'https://weavatar.com/avatar/hash.png?s=80&d=identicon'
```

If query separators are accidentally escaped as `\?`, `\=`, or `\&`, `bb` normalizes them before sending. PNG or JPEG icon URLs are the safest choice for iOS notifications.

## Environment

Command line options override environment variables, and environment variables override the config file.

```sh
BARK_KEY=<your-bark-key> bb push 'hello'
BARK_SERVER=https://api.day.app bb push 'hello'
BARK_GROUP=ci bb push 'deploy done'
```

`BB_KEY`, `BB_SERVER`, and `BB_GROUP` are also supported.

## Development

```sh
npm test
node ./bin/bb.js --help
node ./bin/bb.js push 'hello' --key test --dry-run
```

## Thanks

- [Finb/Bark](https://github.com/Finb/Bark)
- [vikiboss/bark-it](https://github.com/vikiboss/bark-it)
