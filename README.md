# Claude Code Launcher (ccl)

Claude Code 模型启动器 - 让您轻松切换使用不同的 AI 模型作为 Claude Code 的后端。

## 注意

推荐通过 `npm install -g ccl-cli-installer` 快速将 `ccl` 作为系统命令安装到你的系统，方便随处使用。

## 前言

在 Coding Agent 领域，目前 Claude Code 还是当之无愧的王者，谁能想到一个 cli 工具，竟然把之前的领头羊 Cursor 干得半死不活（还不是蓄意针对的前提下）。

可惜，Claude Code 虽好，却有两个无法忽视的缺憾（对中国开发者来说）：

1. 模型锁定，官方只支持 Anthropic 家的 Claude 系列模型（好用真好用，但是也真不便宜）；
2. Anthropic 对中国开发者非常不友好，具体情况我就不说了，懂的都懂；

我当然知道 `claude-code-router` 项目，它很棒，几乎可以代理和桥接任何模型，甚至可以高度定制模型路由器，给开发者带来了更多选择，本人也曾受益于这个项目，非常感谢作者。

然而，现在环境正在起变化，进入 2025 年下半年，国产开源编程大模型先后爆发，智谱GLM、Kimi K2、DeepSeek、MiniMax M2，这几个优秀代表，已经可以挑战业界公认的最佳编程模型 Claude 系列，虽然暂时还没有完成超越，但是成为平替已经毫无问题。

更重要的是，截至目前[2025.12]，这几家都直接提供了 Anthropic 兼容 api 接口（如果还有更多家这样做的请让我知道），甚至还推出了专门面向程序员的编程套餐，这也就意味着这几家供应商官方下场支持自家模型成为 Claude Code 的后端模型，实测结果也非常优秀，且价格便宜。

[更新] 2025.12.05：截至目前，已经特别对 Claude Code 进行了适配的有以下几家国内优秀模型，ccl 均已支持：

- GLM-4.6
- MiniMax-M2
- DeepSeek-3.2
- Kimi-K2-thinking-turbo

在上述背景下，我选择直接给 Claude Code 接入这几家的官方 api 使用，付费尽管微薄，却也是对这些优秀开源企业的认可和支持。并且从逻辑上来讲，官方出手对 Claude Code 进行适配，效果应该会好于 claude-code-router 逆向再适配的方式，还可以获得官方同步的 BUG 修复和更新。

然而我又开始面临另一个烦恼，有时候你需要同时启动几个不同后端模型的 Claude Code 进程，或者尝试切换使用不同模型的进程来解决棘手的问题，说难不难，用命令行设定环境变量而已，但也真的繁琐，不丝滑，作为一个懒人，很难接受这种类似梗阻的体验。

于是就有了这个项目，下面统一简称 ccl。

## 鸣谢

阿里出品的 Qoder 帮我完成了这个项目的绝大多数代码，为我节省了很多时间，表现堪称经验，值得推荐给大家！

## 功能特点

- 🚀 支持多个国内优秀的 AI 模型（目前是智谱GLM、MiniMax M2、DeepSeek、Kimi K2）
- 🖥️ 美观的交互式 TUI 模型选择界面
- 🎯 命令行参数快速直达
- ⚙️ 灵活的配置文件管理
- 🔄 跨平台支持（Windows, macOS, Linux）
- 📦 单文件可执行程序（支持一键安装成系统命令）
- 📚 支持快捷单次请求输出（一行命令让 Claude Code 使用指定模型解答单个问题并输出结果）
- 🛠️ 设定工作路径（可以更加灵活的充当 agent tool 角色）

## 安装要求

在使用 ccl 之前，请确保电脑已经安装了 Nodejs，然后使用 npm 全局安装 Claude Code：

```bash
npm install -g @anthropic-ai/claude-code
```

**注意**：安装的包名是 `@anthropic-ai/claude-code`，但启动命令是 `claude`。

万一你还没有安装 claude 就启动了 ccl 也没事儿，它会尝试为你自动安装。

## 配置文件

ccl 首次执行会在可执行文件同级目录（ts 脚本模式则是入口 ts 文件的同级目录）下创建一个 `ccl.config.json` 配置文件，内容非常一目了然，你只需要将你要用的 provider 下 auth_token 参数替换成自己从服务商那里获取的 API Key 即可，理论上还可以自由添加新的 provider，只要它支持 Anthropic 接口协议即可。

**注意 additionalOTQP 配置**

`additionalOTQP`（一次性请求提示词）是一个可选的全局配置项，允许你定义用户自定义的提示词，它会在每个单次请求时自动追加到预设的提示词后面。这个功能特别适用于为特定模型单次请求补充统一要求的场景，例如：

- 指定回复语言（如"请使用中文回复"）
- 添加特定格式要求（如"请在回复中包含'Claude Code'字样"）
- 设置特定的行为规范（如"请不要使用代码块格式"）

示例配置：
```json
{
  "additionalOTQP": "请使用中文回复，并在回复中包含'Claude Code'字样。",
  // ... 其他配置
}
```

## 使用方法

### Bun 支持下的 ts 脚本模式（跨平台通用）

确保你的电脑已经安装了 bun 运行时，克隆当前仓库到本地，进入目录后执行：

```bash
# 安装依赖包
bun install

# 交互式选择 provider
bun run start

# 使用指定 provider 直接运行，无需选择
bun run start --provider=DeepSeek-3.2
```

### 使用可执行文件

#### 获得

1. 你可以到 release 页面下载可执行文件。

2. 也可以自己构建可执行文件，克隆仓库到本地后，在项目目录下执行：

```bash
# 安装依赖
bun install

# 构建所有平台
bun run build:all

# 构建特定平台
bun run build:linux:x64
bun run build:darwin:arm64
bun run build:darwin:x64
bun run build:win32:x64
```

#### 运行

**macOS & linux**

```
# 交互式选择
./dist/darwin/arm64/ccl

# 指定 provider
./dist/darwin/arm64/ccl --provider=GLM-4.6
```

为了方便随时使用，推荐你将 ccl 安装成为当前系统命令，我提供了一个专门的包来实现它，请执行 `npm install -g ccl-cli-installer` 进行安装。

**windows**

windows 用户可以通过两种方式：

1. 下载后解压出 `ccl.exe` 直接双击运行即可；
2. 在 PowerShell 中执行 `.\ccl.exe` 命令，当然也可以加上 `--provider=xxx` 参数（参见配置文件中的 provider 名称）直接以指定模型启动；

### 命令行参数

ccl 支持以下命令行参数：

```bash
# 指令类参数
--provider=<provider>  指定要使用的 provider name，参见配置文件 providers 节点
--prompt=<prompt>      指定要发送给 Claude Code 的提示词
--output=<file>        指定输出文件名或路径名，单次请求的响应将被保存到该文件中
--pwd=<path>           指定工作目录路径

# 响应类参数
--config-file, -cf     返回配置文件路径
--version, -v          显示版本号
--help, -h             显示帮助信息
```

当使用 `--output` 参数时，ccl 会自动为文件名添加时间戳后缀，以防止文件同名覆盖。如果输出路径包含目录部分，ccl 会自动检查目录是否存在，不存在则创建目录。

示例：
```bash
# 使用指定 provider 并将输出保存到文件
./ccl --provider=GLM-4.6 --prompt="写一个Hello World程序" --output=hello_js.md

# 输出到带目录的路径
./ccl --provider=GLM-4.6 --prompt="写一个Hello World程序" --output=output/hello_js.md

# 改变工作目录
./ccl --pwd="../"

# 显示版本号
./ccl --version

# 显示帮助信息
./ccl --help
```

## 支持的模型

| Provider     | 描述          | 相关文档                                                         |
| ------------ | ------------- | ---------------------------------------------------------------- |
| GLM-4.6      | 智谱 GLM-4.6  | [文档](https://docs.bigmodel.cn/cn/guide/develop/claude)         |
| MiniMax-M2   | MiniMax M2    | [文档](https://platform.minimaxi.com/docs/guides/text-ai-coding-tools)         |
| DeepSeek-3.2 | DeepSeek V3.2 | [文档](https://api-docs.deepseek.com/zh-cn/guides/anthropic_api) |
| Kimi-K2      | Kimi K2       | [文档](https://platform.moonshot.cn/docs/guide/agent-support)    |

如有同学发现新的国产模型也官方支持了 Anthropic API，欢迎告诉我。

## 开发

```
# 安装依赖
bun install

# 运行开发模式
bun run dev

# 运行测试
bun test

# 启动应用
bun run start
```

## 项目结构

```
claude-code-launcher/
├── .gitignore            # Git 忽略文件配置
├── .vscode/              # VS Code 编辑器配置
│   └── settings.json     # VS Code 设置
├── DevInstruction.md     # 开发指南文档
├── Documents/            # 文档目录
│   ├── Releases.md       # 发布日志
│   ├── Requirements.md   # 项目需求文档
│   └── TechStacks.md     # 技术栈说明
├── LICENSE               # 开源许可证
├── README.md             # 项目说明文档
├── bun.lock              # Bun 依赖锁文件
├── package.json          # 项目配置文件
├── tsconfig.json         # TypeScript 配置文件
├── releases/             # 发布文件目录
│   └── release2gh.sh     # GitHub Release 发布脚本
├── scripts/              # 构建脚本目录
│   └── build.ts          # 构建脚本
├── src/                  # 源代码目录
│   ├── index.ts          # 主程序入口
│   ├── types.ts          # 类型定义
│   ├── utils.ts          # 工具函数
│   └── types/
│       └── prompts.d.ts  # prompts 库类型定义
└── test/                 # 测试目录
    ├── bun-spawn.test.ts # Bun.spawn 测试
    ├── command.test.ts   # 命令行参数测试
    ├── launch.test.ts    # 启动功能测试
    ├── tty-state.test.ts # TTY 状态测试
    └── utils.test.ts     # 工具函数测试
```
