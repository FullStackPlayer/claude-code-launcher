# v0.9.7

最近国产大模型在编程能力方面取得较大进步，且大都针对 Claude Code 进行了专门适配，甚至还推出了专门的开发者编码套餐，是时候更新一下了。

## 注意

推荐通过 `npm install -g ccl-cli-installer` 快速将 `ccl` 作为系统命令安装到你的系统，方便随处使用。

## 主要更新

- 增加了 MiniMax M2 模型
- GLM 升级到最新的 4.6
- DeepSeek 升级到最新的 3.2
- Kimi K2 升级到最新的 kimi-k2-thinking-turbo 模型
- 移除了 qwen3-coder（反正 qwen 也不在乎对 Claude Code 是否适配）
- 根据各家官方文档丰富了各自环境变量的配置项
- 增加了 linux-x64 架构的支持（主要测试了 Ubuntu 系统），至此，理论上我们也算支持了全平台
- 对于一次性请求增加了耗时统计
- 经测试对 Claude Code 2.0 的支持没有发现问题
- 优化了显示方面的细节

过去几个月一直在游历祖国大好河山，更新晚了，请见谅。

# v0.9.4

## 注意

目前通过 `npm install -g ccl-cli-installer` 即可快速将 `ccl` 命令安装到你的系统，方便随处使用。

## 主要更新内容

1. 新增通过 --pwd=<指定工作路径> 参数改变 Claude Code 运行时工作路径的能力
2. 新增 --config-file 参数获取当前配置文件路径的能力
3. 完善了系统 help 信息

## 目前全部命令行参数如下：

**指令类参数**
- --provider=<provider>  指定要使用的 provider name，参见配置文件 providers 节点
- --prompt=<prompt>      指定要发送给 Claude Code 的提示词
- --output=<file>        指定输出文件名或路径名，单次请求的响应将被保存到该文件中
- --pwd=<path>           指定工作目录路径

**响应类参数**
- --config-file, -cf     返回配置文件路径
- --version, -v          显示版本号
- --help, -h             显示帮助信息

## 详细使用说明

参见 [README.md](https://github.com/FullStackPlayer/claude-code-launcher/blob/main/README.md) 文件

# v0.9.3

为了对齐 npm 各个相关包的版本号，跳过 0.9.3 版本

# v0.9.2

## 主要更新内容

1. 新增 “使用特定模型执行单次请求” 能力
```bash
ccl --provider=glm-4.5 --prompt="世界上人口最少的国家是哪个?" --output=results/result.md
```
2. 新增命令行参数，目前全部参数如下：
```
- `--provider=xxx`：指定要使用的 provider
- `--prompt=yyy`：指定要发送给 Claude Code 的提示词
- `--output=zzz`：指定输出文件名，Claude Code 的响应将被保存到该文件中
- `--version` 或 `-v`：显示版本号
- `--help` 或 `-h`：显示帮助信息
```
3. 完善了构建脚本
4. 配置文件相应增加了 additionalOTQP 节点，以实现用户自定义单次请求补充提示词

## 使用说明

参见 [README.md](https://github.com/FullStackPlayer/claude-code-launcher/blob/main/README.md) 文件

# v0.9.1

## 主要更新内容

1. 增加了对 qwen3-coder 模型的默认支持（仅限阿里云百炼平台下可用）
2. 重新对构建命令进行了标准化处理
3. 更新了 README.md 说明文件

## 注意

如果已经下载过 0.9.0 版本，可以不必升级，只要手动更新配置文件即可支持 qwen3-coder 模型，如下新增后保存重启应用即可：

-----------

{
  "providers": {
    "qwen3-coder": {
      "base_url": "https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy",
      "auth_token": "YOUR_BAILIAN_API_KEY"
    },
    // ... 原代码
  }
}

-----------

## 使用说明

参见 [README.md](https://github.com/FullStackPlayer/claude-code-launcher/blob/main/README.md) 文件

# v0.9.0

这是首个版本发布，可以比较正常的使用。
因为环境限制，我只构建和测试了 win32-x64 和 macos-arm 这两个架构的版本，所以这次发布只包含这两个版本。
Linux 用户和 MacOS Intel 芯片用户请 clone 仓库后自行构建测试，欢迎反馈。

## 使用说明：

windows 用户可以通过两种方式：
1. 下载解压出 ccl.exe 直接双击运行即可；
2. 在 PowerShell 中执行 .\ccl.exe 也可，支持 --provider=xxx 参数（参见配置文件中的 provider 名称）直接以指定模型启动；

macOS 用户直接命令行运行 ./ccl 这个可执行文件即可，--provider 参数同样支持，如果你想让它成为一个全局 cli 工具，自己手动配置一下吧（不会的话问AI，后续我可能会加上自动安装脚本）

**注意**
首次运行会在同目录下创建一个 ccl.config.json 配置文件，把自己的 api key 填进去就能用了。

有问题请在 Issues 反馈，希望大家用的开心。
