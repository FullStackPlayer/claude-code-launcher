# 背景

Claude Code 是一个非常优秀的 Coding Agent，但是它默认只支持 Anthropic 自家的 Claude 系列模型，我希望使用国内优秀的 Coding 大模型作为 Claude Code 的后端，并且可以轻松的在模型之间进行切换。

**1.目前已知官方提供了 Anthropic 兼容接口的国内模型有：**

## 智谱 GLM-4.5

接入文档：
https://docs.bigmodel.cn/cn/guide/develop/claude

环境变量设置：

```shell
export ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
export ANTHROPIC_AUTH_TOKEN=YOUR_API_KEY
# 已经实现了模型自动路由，所以无需显式设置
```

## DeepSeek V3.1

接入文档：
https://api-docs.deepseek.com/zh-cn/guides/anthropic_api

环境变量设置：

```shell
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=DEEPSEEK_API_KEY
export ANTHROPIC_MODEL=deepseek-chat
export ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat
```

## Kimi K2

接入文档：https://platform.moonshot.cn/docs/guide/agent-support

环境变量设置：

```shell
export ANTHROPIC_BASE_URL=https://api.moonshot.cn/anthropic
export ANTHROPIC_AUTH_TOKEN=YOUR_MOONSHOT_API_KEY
# 启动高速版模型使用：kimi-k2-turbo-preview
# 启动低速版模型使用：kimi-k2-0711-preview
export ANTHROPIC_MODEL=kimi-k2-turbo-preview
export ANTHROPIC_SMALL_FAST_MODEL=kimi-k2-turbo-preview
```

**2.注意如果是 windows 系统，设置环境变量使用如下格式：**

```Powershell
$env:ANTHROPIC_BASE_URL="https://api.moonshot.cn/anthropic"
$env:ANTHROPIC_AUTH_TOKEN="YOUR_MOONSHOT_API_KEY"
$env:ANTHROPIC_MODEL="kimi-k2-turbo-preview"
$env:ANTHROPIC_SMALL_FAST_MODEL="kimi-k2-turbo-preview"
```

# 技术选型

- Bun 运行时
- TypeScript 语言
- 利用 Bun 的编译成单个可执行文件能力进行交付

# 功能需求

1. 程序启动后，先检查当前系统是否已经全局安装了 `@anthropic-ai/claude-code` 这个包，如果没有安装则提示用户先安装，然后退出程序

2. 通过一个程序同目录下的 ccl.config.json 文件进行配置，启动时要检查文件是否存在以及内容是否合法：

- providers：必须配置的属性，模型 provider 列表
- default_provider: 可选属性，用来指定使用默认的 provider 来启动 claude code，要注意检查此属性的值必须存在于 providers 数组中

**发现配置文件不存在或者格式、内容有误时，打印错误提示信息并退出**

配置文件示例如下：

````json
{
  "default_provider": "glm-4.5",
  "additionalOTQP": "请使用中文回复。",
  "providers": {
    "glm-4.5": {
      "base_url": "https://open.bigmodel.cn/api/anthropic",
      "auth_token": "GLM_API_KEY"
    },
    "deepseek-3.1": {
      "base_url": "https://api.deepseek.com/anthropic",
      "auth_token": "DEEPSEEK_API_KEY",
      "model": "deepseek-chat",
      "small_fast_model": "deepseek-chat"
    },
    "kimi-k2": {
      "base_url": "https://api.moonshot.cn/anthropic",
      "auth_token": "KIMI_API_KEY",
      "model": "kimi-k2-turbo-preview",
      "small_fast_model": "kimi-k2-turbo-preview"
    },
    "qwen3-coder": {
      "base_url": "https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy",
      "auth_token": "YOUR_BAILIAN_API_KEY"
    }
  }
}```

3. 程序启动时，尝试读取启动参数 `--provider=<provider_name>` 指定的 provider 名称
- 如果该参数存在，则检查配置文件的 providers 属性中是否存在这个 provider
  - 如果存在这个 provider，则直接使用这个 provider 的配置信息来设置环境变量并启动 Claude Code
  - 如果不存在这个 provider，则提示“参数指定的 provider 不存在”，然后以 tui 交互界面模式列出所有 provider 供用户选择（默认选中第1个），用户选择并回车确认后即以被选中 provider 的配置信息来设置环境变量并启动 Claude Code
- 如果该参数不存在，同样以 tui 交互界面模式列出所有 provider 供用户选择，用户选择并回车确认后即以被选中 provider 的配置信息来设置环境变量并启动 Claude Code
  - 默认选中配置文件中 `default_provider` 指定的项目
  - 若无 `default_provider` 指定或者指定值没有匹配则默认选中第1个

**注意设置环境变量的命令在不同操作系统下存在差异**

# 开发步骤

1. 在当前目录下执行 `bun init -y` 来初始化项目
2. 执行 `bun install` 安装其它依赖
3. 帮我挑选一个优秀的交互式 tui 库并安装
4. 创建一个 `src/index.ts` 文件编写代码逻辑
5. 如果需要的话，在 test 目录下创建单元测试
6. 在 `package.json` 文件中添加 start, test, build:xxx 脚本命令（注意 xxx 是编译成可执行文件时的目标操作系统）
7. 运行 `bun test` 测试代码

# 注意

1. 一定要用心处理不同操作系统的差异
2. 打印提示信息时要统一格式，并且根据信息类型设置不同颜色
3. 严格遵循 typescript 的类型系统
4. 启动 Claude Code 的命令是 `claude`
````
