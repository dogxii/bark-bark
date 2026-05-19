# bark-bark

`bark-bark` 是一个用于发送 [Bark](https://github.com/Finb/Bark) 通知的轻量命令行工具。

[English](./README.md)

命令名是 `bb`：

```sh
bb push 'hello from bark-bark'
```

它没有运行时依赖，适合直接通过 `npx`、`bunx` 或全局安装使用。

## 安装

不安装，直接运行：

```sh
npx bark-bark push 'hello'
bunx bark-bark push 'hello'
```

全局安装：

```sh
npm install -g bark-bark
bb push 'hello'
```

## 配置

初始化配置文件：

```sh
bb init <your-bark-key>
```

也可以逐项设置：

```sh
bb config set key <your-bark-key>
bb config set server https://api.day.app
bb config set group cli
```

查看配置文件路径：

```sh
bb config path
```

`bb` 默认读取：

```text
~/.config/bark-bark/config.json
```

可以通过 `BB_CONFIG` 指定其他配置文件：

```sh
BB_CONFIG=/path/to/config.json bb push 'hello'
```

这里要使用 Bark App 里测试 URL 的 push key。比如 App 里显示：

```text
https://api.day.app/your_key/hello
```

那就配置 `your_key`：

```sh
bb config set key your_key
```

不要在这里填原始 APNs device token。当前 CLI 走的是 Bark Server 模式，服务端必须能在数据库里找到这个 push key。

## 推送

```sh
bb push '构建完成'
bb push '发布成功' --title Deploy --group ci
bb push '打开控制台' --url https://example.com
bb push '服务器告警' --level timeSensitive
bb push '带图标的通知' --icon 'https://example.com/avatar.png'
echo '来自 stdin 的消息' | bb push --stdin
bb ping
```

常用选项：

```text
-t, --title <text>       通知标题
--subtitle <text>        通知副标题
-k, --key <key>          Bark key，多个设备可用英文逗号分隔
-s, --server <url>       Bark 服务地址，默认 https://api.day.app
-g, --group <name>       通知分组
-u, --url <url>          点击通知时打开的 URL
--level <level>          active, timeSensitive, passive, critical
--badge <number>         应用角标数字
--sound <name>           Bark 铃声名称
--icon <url>             通知图标 URL
--copy                   在 Bark 中自动复制消息内容
--archive                保存到 Bark 历史记录
--timeout <ms>           请求超时时间，默认 15000
--dry-run                只打印请求内容，不真正发送
--json                   输出完整 JSON 结果
```

带查询参数的 URL 建议整体加引号，不要在引号里转义 `?`、`=` 或 `&`：

```sh
bb push 'hello' --icon 'https://weavatar.com/avatar/hash.png?s=80&d=identicon'
```

如果不小心写成了 `\?`、`\=` 或 `\&`，`bb` 会在发送前自动修正。iOS 通知图标优先使用 PNG 或 JPEG URL，兼容性最好。

## 环境变量

命令行参数优先级最高，其次是环境变量，最后是配置文件。

```sh
BARK_KEY=<your-bark-key> bb push 'hello'
BARK_SERVER=https://api.day.app bb push 'hello'
BARK_GROUP=ci bb push 'deploy done'
```

也支持 `BB_KEY`、`BB_SERVER` 和 `BB_GROUP`。

## 开发

```sh
npm test
node ./bin/bb.js --help
node ./bin/bb.js push 'hello' --key test --dry-run
```

## 致谢

- [Finb/Bark](https://github.com/Finb/Bark)
- [vikiboss/bark-it](https://github.com/vikiboss/bark-it)
