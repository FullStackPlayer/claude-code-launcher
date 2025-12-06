# 背景

Claude Code 是一个非常优秀的 Coding Agent，但是它默认只支持 Anthropic 自家的 Claude 系列模型，我希望使用国内优秀的 Coding 大模型作为 Claude Code 的后端，并且可以轻松的在模型之间进行切换。

**1.目前已知官方提供了 Anthropic 兼容接口的国内模型有：**

## GLM-4.6

注意：该模型已支持使用工具调用（视觉理解、联网搜索、网页读取MCP）、复杂任务执行

接入文档：
https://docs.bigmodel.cn/cn/guide/develop/claude

环境变量设置：

```shell
export ANTHROPIC_BASE_URL=https://open.bigmodel.cn/api/anthropic
export ANTHROPIC_AUTH_TOKEN=YOUR_API_KEY
export API_TIMEOUT_MS=3000000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
# 已经实现了模型自动路由，所以无需显式设置模型名称
```

## MiniMax-M2

注意：该模型支持图像理解、联网搜索MCP

接入文档：https://platform.minimaxi.com/docs/guides/text-ai-coding-tools

环境变量设置：
```shell
export ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
export ANTHROPIC_AUTH_TOKEN=MINIMAX_API_KEY
export API_TIMEOUT_MS=3000000
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
export ANTHROPIC_MODEL=MiniMax-M2
export ANTHROPIC_SMALL_FAST_MODEL=MiniMax-M2
export ANTHROPIC_DEFAULT_OPUS_MODEL=MiniMax-M2
export ANTHROPIC_DEFAULT_SONNET_MODEL=MiniMax-M2
export ANTHROPIC_DEFAULT_HAIKU_MODEL=MiniMax-M2
```

## DeepSeek-3.2

注意：该模型支持思考模式、工具调用，但是不支持多模态识别。默认使用 chat 模型，你可以通过把模型名改为 "deepseek-reasoner" 或者在 Claude Code 中按 Tab 键开启思考模式

接入文档：
https://api-docs.deepseek.com/zh-cn/guides/anthropic_api

环境变量设置：

```shell
export ANTHROPIC_BASE_URL=https://api.deepseek.com/anthropic
export ANTHROPIC_AUTH_TOKEN=DEEPSEEK_API_KEY
export API_TIMEOUT_MS=600000
export ANTHROPIC_MODEL=deepseek-chat
export ANTHROPIC_SMALL_FAST_MODEL=deepseek-chat
# 可以通过修改模型名称为 deepseek-reasoner 来启用 thinking 模式
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
```

## Kimi-K2

接入文档：https://platform.moonshot.cn/docs/guide/agent-support

注意：该模型支持多步工具调用与思考

环境变量设置：

```shell
export ANTHROPIC_BASE_URL=https://api.moonshot.cn/anthropic
export ANTHROPIC_AUTH_TOKEN=YOUR_MOONSHOT_API_KEY
export ANTHROPIC_MODEL=kimi-k2-thinking-turbo
export ANTHROPIC_DEFAULT_OPUS_MODEL=kimi-k2-thinking-turbo
export ANTHROPIC_DEFAULT_SONNET_MODEL=kimi-k2-thinking-turbo
export ANTHROPIC_DEFAULT_HAIKU_MODEL=kimi-k2-thinking-turbo
export CLAUDE_CODE_SUBAGENT_MODEL=kimi-k2-thinking-turbo 
# 以上模型名称意味着启用了 thinking 模式
# 如果你要使用非思考模式，将模型名称改为：kimi-k2-turbo-preview
# 如果你要使用慢速模版模型，可以将模型名称替换为：kmi-k2-0905-preview
```


**2.注意如果是 windows 系统，设置环境变量使用如下格式：**

```Powershell
$env:ANTHROPIC_BASE_URL="https://api.moonshot.cn/anthropic"
$env:ANTHROPIC_AUTH_TOKEN="YOUR_MOONSHOT_API_KEY"
$env:ANTHROPIC_MODEL="kimi-k2-turbo-preview"
$env:ANTHROPIC_SMALL_FAST_MODEL="kimi-k2-turbo-preview"
```

# 功能需求

1. 程序启动后，首先解析和检查命令行参数：
- 检查是否以独立 TUI 进程模式运行，如果是的话则渲染 TUI 界面并获取结果并返回（结果会被主进程接收）然后退出
- 如果不是 TUI 子进程模式说明是主进程，那么继续

2. 先检查当前系统是否已经全局安装了 `@anthropic-ai/claude-code` 这个包，如果没有安装则尝试自动安装，自动安装失败则提示用户手动安装

3. 通过一个程序同目录下的 ccl.config.json 文件进行配置，启动时要检查文件是否存在以及内容是否合法：

- providers：必须配置的属性，模型 provider 列表
- default_provider: 可选属性，用来指定使用默认的 provider 来启动 claude code，要注意检查此属性的值必须存在于 providers 数组中，如果没配置则默认使用第一个
- additionalOTQP ：可选属性，额外的单次请求提示词，用来对模型输出进行更严格的限制

**发现配置文件不存在或者格式、内容有误时，打印错误提示信息并退出**

配置文件示例如下：

```json
{
  "providers": {
    "GLM-4.6": {
      "description": "智谱最新模型，支持工具调用和复杂任务，通过自有MCP整合实现视觉理解、联网搜索、网页读取能力",
      "base_url": "https://open.bigmodel.cn/api/anthropic",
      "auth_token": "API_KEY",
      "api_timeout_ms": "3000000",
      "claude_code_disable_nonessential_traffic": "1"
    },
    "MiniMax-M2": {
      "description": "MiniMax最新模型，擅长多步工具调用和端到端任务规划，同样通过自有MCP整合实现视觉理解、联网搜索能力",
      "base_url": "https://api.minimaxi.com/anthropic",
      "auth_token": "API_KEY",
      "api_timeout_ms": "3000000",
      "claude_code_disable_nonessential_traffic": "1",
      "model": "MiniMax-M2",
      "small_fast_model": "MiniMax-M2",
      "default_opus_model": "MiniMax-M2",
      "default_sonnet_model": "MiniMax-M2",
      "default_haiku_model": "MiniMax-M2"
    },
    "Kimi-K2": {
      "description": "Kimi最新模型，支持多步工具调用与思考",
      "base_url": "https://api.moonshot.cn/anthropic",
      "auth_token": "API_KEY",
      "model": "kimi-k2-turbo-preview",
      "default_opus_model": "kimi-k2-thinking-turbo",
      "default_sonnet_model": "kimi-k2-thinking-turbo",
      "default_haiku_model": "kimi-k2-thinking-turbo",
      "claude_code_subagent_model": "kimi-k2-thinking-turbo"
    },
    "DeepSeek-3.2": {
      "description": "深度求索的最新模型，擅长思考模式、工具调用和复杂任务（支持Claude Code 中通过 Tab 键打开思考模式）",
      "base_url": "https://api.deepseek.com/anthropic",
      "auth_token": "API_KEY",
      "api_timeout_ms": "600000",
      "model": "deepseek-chat",
      "small_fast_model": "deepseek-chat",
      "claude_code_disable_nonessential_traffic": "1"
    }
  },
  "additionalOTQP": "请使用中文回答。"
}
```

4. 处理其它命令行参数：
- 响应类
  - "--version" 或者 "-v" - 返回当前版本号
  - "--config-file" 或者 "-cf" - 返回当前配置文件路径
  - "--help" 或者 "-h" - 返回提示信息
- 指令类参数
  - "--provider=<provider>" - 指定要使用的 provider name
  - "--prompt=<prompt>" - 指定要发送给 claude code 的提示词
  - "--output=<file>" - 指定输出文件名或路径，上述提示词的返回结果将被保存在这个文件夹中
  - "--pwd=<path>" - 指定在特定工作目录运行 claude code

5. 此次运行的 provider 有两个来源：
- 用户通过命令行指定
- 命令行未指定，用户通过 TUI 界面进行选择

将选中的 provider 对应的配置信息转为 claude code 的环境变量
**注意设置环境变量的命令在不同操作系统下存在差异**

6. 使用上一步配置好的环境变量来启动 claude code，如果指定了输出结果文件则保存到文件中。

