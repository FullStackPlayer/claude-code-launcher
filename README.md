# Claude Code Launcher (ccl)

Claude Code 模型启动器 - 让您轻松切换使用不同的 AI 模型作为 Claude Code 的后端。

## 前言

在 Coding Agent 领域，目前 Claude Code 还是当之无愧的王者，谁能想到一个 cli 工具，竟然把之前的领头羊 Cursor 干得半死不活（还不是蓄意针对的前提下）。

可惜，Claude Code 虽好，却有两个无法忽视的缺憾（对中国开发者来说）：

1. 模型锁定，官方只支持 Anthropic 家的 Claude 系列模型（好用真好用，但是也真不便宜）；
2. Anthropic 对中国开发者非常不友好，具体情况我就不说了，懂的都懂；

我当然知道 `claude-code-router` 项目，它很棒，几乎可以代理和桥接任何模型，甚至可以高度定制模型路由器，给开发者带来了更多选择，本人也曾受益于这个项目，非常感谢作者。

然而，现在环境正在起变化，进入2025年下半年，国产开源编程大模型先后爆发，智谱GLM-4.5、Kimi K2、DeepSeek V3.1、通义千问 Qwen3-Coder，这几个优秀代表，已经可以挑战业界公认的最佳编程模型 Claude 系列，虽然暂时还没有完成超越，但是成为平替已经毫无问题。

更重要的是，截至目前[2025.08]，除了 Qwen3-Coder 模型，前三家都直接提供了 Anthropic 兼容 api 接口（如果还有更多家这样做的请让我知道），这也就意味着这几家供应商官方下场支持自家模型成为 Claude Code 的模型，实测结果也非常优秀，且价格便宜。

在上述背景下，我选择直接给 Claude Code 接入这几家的官方 api 使用，付费尽管微薄，却也是对这些优秀开源企业的认可和支持。并且从逻辑上来讲，官方出手对 Claude Code 进行适配，效果应该会好于 claude-code-router 先逆向再适配的方式，还可以获得随时的BUG修复和更新。

于是我又开始面临另一个烦恼，有时候你需要同时启动几个不同后端模型的 Claude Code 进程，或者尝试切换进程来解决棘手的问题，说难不难，用命令行设定环境变量而已，但也真的繁琐，不丝滑，作为一个懒人，很难接受这种类似梗阻的体验。

于是就有了这个项目，下面统一简称 ccl。

## 功能特点

- 🚀 支持多个国内优秀的 AI 模型（目前是智谱 GLM-4.5、DeepSeek V3.1、Kimi K2）
- 🎯 命令行参数快速直达模型
- 🖥️ 美观的交互式 TUI 模型选择界面
- ⚙️ 灵活的配置文件管理
- 🔄 跨平台支持（Windows, macOS, Linux）
- 📦 单文件可执行程序

## 安装要求

在使用 ccl 之前，请确保电脑已经安装了 Nodejs，然后使用 npm 全局安装 Claude Code：

```bash
npm install -g @anthropic-ai/claude-code
```

**注意**：安装的包名是 `@anthropic-ai/claude-code`，但启动命令是 `claude`。

如果没有成功安装 claude，ccl 会尝试为你自动安装。

## 配置文件

ccl 首次执行会在同级目录下创建一个 `ccl.config.json` 配置文件，内容如下：

```json
{
  "providers": {
    "glm-4.5": {
      "base_url": "https://open.bigmodel.cn/api/anthropic",
      "auth_token": "YOUR_GLM_API_KEY"
    },
    "deepseek-3.1": {
      "base_url": "https://api.deepseek.com/anthropic",
      "auth_token": "YOUR_DEEPSEEK_API_KEY",
      "model": "deepseek-chat",
      "small_fast_model": "deepseek-chat"
    },
    "kimi-k2": {
      "base_url": "https://api.moonshot.cn/anthropic",
      "auth_token": "YOUR_KIMI_API_KEY",
      "model": "kimi-k2-turbo-preview",
      "small_fast_model": "kimi-k2-turbo-preview"
    }
  }
}
```

配置文件非常一目了然，你只需要将你要用的 provider 下 auth_token 参数替换成自己从服务商那里获取的 API Key 即可。

## 使用方法

### 脚本模式

确保你的电脑已经安装了 bun 运行时，克隆当前仓库到本地，进入目录后执行：

```bash
# 交互式选择 provider
bun run start

# 使用指定 provider 直接运行
bun run start --provider=deepseek-3.1
```

### 可执行文件

首先要构建可执行文件，在项目目录下执行：

```
# 构建所有平台
bun run build:all

# 构建特定平台
bun run build:linux    # Linux x64
bun run build:macos:arm # macOS ARM64
bun run build:macos:x64 # macOS x64
bun run build:windows  # Windows x64
```

然后直接执行构建的可执行文件即可：

```
# 交互式选择
./dist/macos/arm/ccl

# 指定 provider
./dist/macos/arm/ccl --provider=glm-4.5
```

为了方便随时使用，你也可以将可执行文件设置为系统全局命令。

windows 用户可以通过两种方式：

1. 下载解压或者编译出 ccl.exe 直接双击运行即可；
2. 在 PowerShell 中执行 .\ccl.exe 命令，当然也可以加上 --provider=xxx 参数（参见配置文件中的 provider 名称）直接以指定模型启动；

TBD: 自动化安装脚本

## 支持的模型

| Provider | 描述 | 相关文档 |
|----------|------|----------|
| glm-4.5 | 智谱 GLM-4.5 | [文档](https://docs.bigmodel.cn/cn/guide/develop/claude) |
| deepseek-3.1 | DeepSeek V3.1 | [文档](https://api-docs.deepseek.com/zh-cn/guides/anthropic_api) |
| kimi-k2 | Kimi K2 | [文档](https://platform.moonshot.cn/docs/guide/agent-support) |

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
├── src/
│   ├── index.ts          # 主程序入口
│   ├── types.ts          # 类型定义
│   ├── utils.ts          # 工具函数
│   └── types/            # 类型定义文件
│       └── prompts.d.ts  # prompts 库类型定义
├── test/
│   ├── bun-spawn.test.ts # Bun.spawn 测试
│   ├── command.test.ts   # 命令行参数测试
│   ├── launch.test.ts    # 启动功能测试
│   ├── tty-state.test.ts # TTY 状态测试
│   └── utils.test.ts     # 工具函数测试
├── dist/                 # 构建输出
├── ccl.config.json       # 配置文件示例
├── package.json          # 项目配置
├── tsconfig.json         # TypeScript 配置
├── bun.lock              # Bun 依赖锁文件
├── .gitignore            # Git 忽略文件
└── LICENSE               # 许可证文件
```

## 常见问题

TBD

## 贡献

欢迎提交 Issues 和 Pull Requests！

## 跨平台兼容性

本项目支持在不同操作系统上运行，包括 Windows、macOS 和 Linux。为了实现跨平台兼容性，我们采用了以下策略：

### 构建方式

项目使用 Bun 构建针对不同平台的可执行文件：

```
# 构建所有平台
bun run build:all

# 构建特定平台
bun run build:linux    # Linux x64
bun run build:macos:arm # macOS ARM64
bun run build:macos:x64 # macOS x64
bun run build:windows  # Windows x64
```

构建后的可执行文件将被放置在以下目录结构中：
```
dist/
├── linux/
│   └── ccl
├── macos/
│   ├── arm/
│   │   └── ccl
│   └── x64/
│       └── ccl
└── windows/
    └── ccl.exe
```

### 安装和使用

无论在哪个平台，都可以通过以下方式安装和使用：

```bash
# 全局安装（推荐）
npm install -g .

# 或者使用 npx 运行
npx claude-code-launcher

# 直接运行构建后的可执行文件
./dist/linux/ccl --provider=glm-4.5  # Linux
./dist/macos/arm/ccl --provider=glm-4.5  # macOS ARM
./dist/macos/x64/ccl --provider=glm-4.5  # macOS x64
./dist/windows/ccl.exe --provider=glm-4.5  # Windows
```

启动脚本会自动检测操作系统和架构，并选择正确的可执行文件运行。
