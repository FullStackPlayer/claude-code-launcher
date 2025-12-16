import chalk from "chalk";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import type { AppConfig, ProviderConfig, EnvVars, OSType } from "./types.js";

// 定义版本号常量，构建时会被替换为实际版本号
const VERSION = "x.y.z"; // BUILD_VERSION_INJECTION_PLACEHOLDER

const CONFIG_FILE_NAME = "ccl.config.json";

/**
 * 日志输出工具
 */
export class Logger {
  static info(message: string): void {
    console.log(chalk.blue("[INFO]"), `   ${message}`);
  }

  static success(message: string): void {
    console.log(chalk.green("[SUCCESS]"), message);
  }

  static warning(message: string): void {
    console.log(chalk.yellow("[WARNING]"), message);
  }

  static error(message: string): void {
    console.log(chalk.red("[ERROR]"), `  ${message}`);
  }
}

/**
 * 检查 @anthropic-ai/claude-code 是否已全局安装
 */
export async function checkClaudeCodeInstalled(): Promise<boolean> {
  try {
    const proc = Bun.spawn(["npm", "list", "-g", "@anthropic-ai/claude-code"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    if (exitCode === 0) {
      return true;
    } else {
      // 尝试自动安装
      Logger.warning(
        "未检测到全局安装的 @anthropic-ai/claude-code，正在尝试自动安装..."
      );
      try {
        const installProc = Bun.spawn(
          ["npm", "install", "-g", "@anthropic-ai/claude-code"],
          {
            stdout: "inherit",
            stderr: "inherit",
          }
        );

        const installExitCode = await installProc.exited;
        if (installExitCode === 0) {
          Logger.success("成功安装 @anthropic-ai/claude-code");
          return true;
        } else {
          Logger.error("自动安装失败");
          return false;
        }
      } catch (installError) {
        Logger.error("自动安装过程中出现错误");
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

/**
 * 判断当前环境是否 windows
 */
export function isWindows(): boolean {
  return process.platform === "win32";
}

/**
 * 检查当前的运行模式是脚本还是可执行文件
 */
export function isExecutable(): boolean {
  if (process.execPath.endsWith("ccl") || process.execPath.endsWith("ccl.exe"))
    return true;
  return false;
}

/**
 * 获取当前目录（可执行文件或者被执行脚本所在的目录）
 */
export function getCurrentDir(): string {
  // 通过可执行文件运行
  if (isExecutable()) {
    return dirname(process.execPath);
  }
  return import.meta.dir;
}

/**
 * 读取并验证配置文件
 */
export function loadConfig(): AppConfig | null {
  // 获取可执行文件的真实路径
  let currentDir: string = getCurrentDir();

  // 尝试在可执行文件所在目录查找配置文件，如果找不到配置文件，则尝试自动创建
  let configPath = join(currentDir, CONFIG_FILE_NAME);

  if (!existsSync(configPath)) {
    Logger.warning(
      `配置文件 ${CONFIG_FILE_NAME} 不存在，正在创建默认配置文件...`
    );

    // 创建默认配置文件内容
    const defaultConfig = {
      providers: {
        "GLM-4.6": {
          description:
            "智谱最新模型，支持工具调用和复杂任务，通过自有MCP整合实现视觉理解、联网搜索、网页读取能力",
          base_url: "https://open.bigmodel.cn/api/anthropic",
          auth_token: "GLM_API_KEY",
          api_timeout_ms: "3000000",
          claude_code_disable_nonessential_traffic: "1",
        },
        "MiniMax-M2": {
          description:
            "MiniMax最新模型，擅长多步工具调用和端到端任务规划，同样通过自有MCP整合实现视觉理解、联网搜索能力",
          base_url: "https://api.minimaxi.com/anthropic",
          auth_token: "MINIMAX_API_KEY",
          api_timeout_ms: "3000000",
          claude_code_disable_nonessential_traffic: "1",
          model: "MiniMax-M2",
          small_fast_model: "MiniMax-M2",
          default_opus_model: "MiniMax-M2",
          default_sonnet_model: "MiniMax-M2",
          default_haiku_model: "MiniMax-M2",
        },
        "Kimi-K2": {
          description: "Kimi最新模型，支持多步工具调用与思考",
          base_url: "https://api.moonshot.cn/anthropic",
          auth_token: "KIMI_API_KEY",
          model: "kimi-k2-thinking-turbo",
          default_opus_model: "kimi-k2-thinking-turbo",
          default_sonnet_model: "kimi-k2-thinking-turbo",
          default_haiku_model: "kimi-k2-thinking-turbo",
          claude_code_subagent_model: "kimi-k2-thinking-turbo",
        },
        "DeepSeek-3.2": {
          description:
            "深度求索的最新模型，擅长思考模式、工具调用和复杂任务（支持Claude Code 中通过 Tab 键打开思考模式）",
          base_url: "https://api.deepseek.com/anthropic",
          auth_token: "DEEPSEEK_API_KEY",
          api_timeout_ms: "600000",
          model: "deepseek-chat",
          small_fast_model: "deepseek-chat",
          claude_code_disable_nonessential_traffic: "1",
        },
      },
      default_provider: "GLM-4.6",
      additionalOTQP: `请使用中文回答。`,
    };

    try {
      // 写入默认配置文件
      writeFileSync(
        configPath,
        JSON.stringify(defaultConfig, null, 2),
        "utf-8"
      );
      Logger.warning(`已创建默认配置文件: ${configPath}`);
      Logger.warning("请编辑配置文件，设置正确的 API 密钥后再重新运行程序");
      return null;
    } catch (writeError) {
      Logger.error(
        `创建默认配置文件失败: ${
          writeError instanceof Error ? writeError.message : String(writeError)
        }`
      );
      Logger.error(`请手动创建配置文件 ${CONFIG_FILE_NAME}，内容如下:`);
      Logger.error(JSON.stringify(defaultConfig, null, 2));
      return null;
    }
  }

  try {
    const configContent = readFileSync(configPath, "utf-8");
    const config: AppConfig = JSON.parse(configContent);

    // 验证配置文件格式
    validateConfig(config);

    return config;
  } catch (error) {
    Logger.error(
      `配置文件格式错误: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
}

/**
 * 验证配置文件格式和内容
 */
function validateConfig(config: AppConfig): void {
  if (!config.providers || typeof config.providers !== "object") {
    throw new Error("缺少必需的 providers 属性");
  }

  const providerNames = Object.keys(config.providers);
  if (providerNames.length === 0) {
    throw new Error("providers 不能为空");
  }

  // 验证每个 provider 配置
  for (const [name, provider] of Object.entries(config.providers)) {
    if (!provider.base_url || typeof provider.base_url !== "string") {
      throw new Error(`Provider ${name} 缺少有效的 base_url`);
    }

    if (!provider.auth_token || typeof provider.auth_token !== "string") {
      throw new Error(`Provider ${name} 缺少有效的 auth_token`);
    }
  }

  // 验证 default_provider 是否存在于 providers 中
  if (config.default_provider && !config.providers[config.default_provider]) {
    throw new Error(
      `default_provider "${config.default_provider}" 在 providers 中不存在`
    );
  }
}

/**
 * 解析命令行参数，返回一个结果对象
 */
export function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};

  // 检查是否有 --tui-selector 参数
  const selectorFlag = args.find((arg) => arg === "--tui-selector");
  // 一旦有这个参数立刻返回（因为这个参数是程序自己添加上的，此时程序以子进程形式运行）
  if (selectorFlag) {
    result.tuiSelector = "true";
    return result;
  }

  // 检查是否有 --version 或 -v 参数
  if (args.includes("--version") || args.includes("-v")) {
    console.log(VERSION);
    process.exit(0);
  }

  // 检查是否有 --config-file 或 -cf 参数
  if (args.includes("--config-file") || args.includes("-cf")) {
    console.log(resolve(getCurrentDir(), CONFIG_FILE_NAME));
    process.exit(0);
  }

  // 检查是否有 --help 或 -h 参数
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
用法: 

  # 1. 使用 ccl-cli-installer 包安装的（推荐！！！）
  ccl [选项]

  # 2. 直接使用 ccl-cli-${process.platform}-${process.arch} 架构子包安装的
  ccl-${process.platform}-${process.arch} [选项]

选项:

  # 指令类参数
  --provider=<provider>  指定要使用的 provider name，参见配置文件 providers 节点
  --prompt=<prompt>      指定要发送给 Claude Code 的提示词
  --output=<file>        指定输出文件名或路径名，单次请求的响应将被保存到该文件中
  --pwd=<path>           指定运行在特定工作目录路径

  # 响应类参数
  --config-file, -cf     返回配置文件路径
  --version, -v          显示版本号
  --help, -h             显示帮助信息

注意：

  1. pwd 和 output 参数中涉及到路径，无论 windows 还是 unix-like 环境均支持 '.' 和 '..' 还有 '../' 这些 unix 格式的描述符，windows 环境同样支持 '\\\\' 分隔符，但绝对路径必须以 'C:/' 或者 'C:\\\\' 这样的格式开头。
  2. prompt 和 pwd 以及 output 这种路径相关参数最好用双引号包裹起来，以防止特殊符号带来的异常。
  3. prompt 和 output 参数必须成对出现，还要同时指定 provider 参数，否则无法完成单次调用任务。
  `);
    process.exit(0);
  }

  const providerArg = args.find((arg) => arg.startsWith("--provider="));
  const promptArg = args.find((arg) => arg.startsWith("--prompt="));
  const outputArg = args.find((arg) => arg.startsWith("--output="));
  const pwdArg = args.find((arg) => arg.startsWith("--pwd="));

  // 如果有 --prompt 或 --output 参数但没有 --provider 参数，则报错并终止程序
  if ((promptArg || outputArg) && !providerArg) {
    Logger.error(
      "使用 --prompt 或 --output 参数时必须同时指定 --provider 参数"
    );
    process.exit(1);
  }

  // 如果有 --output 参数但没有 --prompt 参数，则报错并终止程序
  if (outputArg && !promptArg) {
    Logger.error("使用 --output 参数时必须同时指定 --prompt 参数");
    process.exit(1);
  }

  // 如果有 --prompt 参数但没有 --output 参数，则报错并终止程序
  if (promptArg && !outputArg) {
    Logger.error("使用 --prompt 参数时必须同时指定 --output 参数");
    process.exit(1);
  }

  // 解析 provider 参数
  if (providerArg) {
    const provider = providerArg.split("=")[1];
    if (provider) {
      result.provider = provider;
    }
  }

  // 解析 prompt 参数
  if (promptArg) {
    const prompt = promptArg.split("=")[1];
    if (prompt) {
      result.prompt = prompt;
    }
  }

  // 解析 output 参数
  if (outputArg) {
    const output = outputArg.split("=")[1];
    if (output) {
      result.output = output;
    }
  }

  // 解析 pwd 参数
  if (pwdArg) {
    const pwd = pwdArg.split("=")[1];
    if (pwd) {
      result.pwd = pwd;
    }
  }

  return result;
}

/**
 * 将 provider 配置转换为环境变量
 */
export function providerToEnvVars(provider: ProviderConfig): EnvVars {
  // 初始化环境变量对象，包含必需的属性
  const envVars: EnvVars = {
    ANTHROPIC_BASE_URL: provider.base_url,
    ANTHROPIC_AUTH_TOKEN: provider.auth_token,
  };

  // 遍历 provider 对象的所有属性
  for (const [key, value] of Object.entries(provider)) {
    // 跳过必需的属性，因为它们已经处理过了
    if (key === "base_url" || key === "auth_token") {
      continue;
    }

    // 跳过对 claude code 运行无用的属性
    if (key === "description") {
      continue;
    }

    // claude_code 命名空间下的属性不需要加 Anthropic 前缀
    if (key.startsWith("claude_code_") || key.startsWith("api_")) {
      envVars[key.toUpperCase()] = value;
      continue;
    }

    // 将属性名转换为大写并添加 ANTHROPIC_ 前缀
    const envKey = `ANTHROPIC_${key.toUpperCase()}`;

    // 只有当值存在且不为空时才添加到环境变量中
    if (value !== undefined && value !== null && value !== "") {
      // @ts-ignore 我们动态添加属性到 envVars 对象
      envVars[envKey] = value;
    }
  }

  return envVars;
}

/**
 * 设置环境变量并启动 Claude Code
 */
export async function launchClaudeCode(
  envVars: EnvVars,
  prompt?: string,
  output?: string,
  additionalOTQP?: string
): Promise<void> {
  Logger.info("正在启动 Claude Code...");

  const env = { ...process.env, ...envVars };

  try {
    // 使用 Bun.spawn 提供更好的交互式支持
    // 注意 windows 下的启动命令
    const claudeCmd = isWindows() ? "claude.cmd" : "claude";

    // 构建命令参数
    const cmdArgs: string[] = [claudeCmd];

    // 如果有 prompt 参数，则添加 -p 参数
    if (prompt && prompt.trim() !== "") {
      let prePrompt = `注意！此次会话中，你必须将生成的所有内容都直接返回，代码内容请使用代码块包裹，永远不要对本地文件系统进行任何更改！如果你生成的内容中用到了markdown层级标题，请从第二级开始！`;

      // 如果有 additionalOTQP 配置选项，则追加到 prePrompt 后面
      if (additionalOTQP && additionalOTQP.trim() !== "") {
        prePrompt += `${additionalOTQP.trim()}`;
      }

      cmdArgs.push("-p", `${prePrompt} ==> 我的问题如下: ${prompt.trim()}`);
    }

    // console.log(cmdArgs);

    // 根据是否指定了输出文件来决定 stdout 的处理方式
    const stdoutOption = output && output.trim() !== "" ? "pipe" : "inherit";

    // 计算执行时长
    const startTime = performance.now();
    const proc = Bun.spawn(cmdArgs, {
      env,
      stdin: "inherit",
      stdout: stdoutOption,
      stderr: stdoutOption,
    });

    Logger.success(`Claude Code 启动成功！${(prompt && prompt.trim() !== "") ? ('正在后台回答问题：' + prompt.trim()) : ''}\n`);

    // 如果指定了输出文件，则将 stdout 写入文件
    if (output && output.trim() !== "") {
      // 解析输出路径∂
      const outputPath = output.trim();

      // 生成时间戳 (YYMMDDhhmmss格式)
      const now = new Date();
      const timestamp = `${(now.getFullYear() % 100)
        .toString()
        .padStart(2, "0")}${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}${now
        .getHours()
        .toString()
        .padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now
        .getSeconds()
        .toString()
        .padStart(2, "0")}`;

      let finalOutputPath: string;

      // 检查是否包含目录路径
      if (outputPath.includes("/") || outputPath.includes("\\")) {
        // 处理带目录的路径（绝对路径或相对路径）
        const dir = dirname(outputPath);

        // 检查目录是否存在，不存在则创建
        if (!existsSync(dir)) {
          try {
            mkdirSync(dir, { recursive: true });
          } catch (mkdirError) {
            Logger.error(
              `创建目录失败: ${
                mkdirError instanceof Error
                  ? mkdirError.message
                  : String(mkdirError)
              }`
            );
            process.exit(1);
          }
        }

        // 在文件名后添加时间戳
        const fileName = outputPath.split(/[/\\]/).pop() || "output";
        const dirPath = outputPath.substring(
          0,
          outputPath.length - fileName.length
        );
        const fileNameWithoutExt = fileName.substring(
          0,
          fileName.lastIndexOf(".")
        );
        const fileExt = fileName.substring(fileName.lastIndexOf("."));
        finalOutputPath = `${dirPath}${fileNameWithoutExt}_${timestamp}${fileExt}`;
      } else {
        // 仅文件名，在文件名后添加时间戳
        const fileNameWithoutExt = outputPath.substring(
          0,
          outputPath.lastIndexOf(".")
        );
        const fileExt = outputPath.substring(outputPath.lastIndexOf("."));
        finalOutputPath = `${fileNameWithoutExt}_${timestamp}${fileExt}`;
      }

      const file = Bun.file(finalOutputPath);
      const writer = file.writer();
      writer.write(`# 原始问题\n\n${prompt}\n\n# Claude Code 输出\n\n`);
      // 捕获标准输出内容并写入
      if (proc.stdout) {
        // 读取子进程的 stdout 并写入文件
        const reader = proc.stdout.getReader();
        const writeToFile = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // 写入文件
              writer.write(value);
              await writer.flush();

              // 同时输出到控制台（可选）
              process.stdout.write(value);
            }
          } catch (error) {
            Logger.error(`写入文件时出错: ${error}`);
          } finally {
            await writer.end();
          }
        };

        // 开始写入文件
        writeToFile().catch((error) => {
          Logger.error(`文件写入失败: ${error}`);
        });
      }
      // 捕获错误输出内容并写入
      if (proc.stderr) {
        // 读取子进程的 stdout 并写入文件
        const reader = proc.stderr.getReader();
        const writeToFile = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // 写入文件
              writer.write(value);
              await writer.flush();

              // 同时输出到控制台（可选）
              process.stderr.write(value);
            }
          } catch (error) {
            Logger.error(`写入文件时出错: ${error}`);
          } finally {
            await writer.end();
          }
        };

        // 开始写入文件
        writeToFile().catch((error) => {
          Logger.error(`文件写入失败: ${error}`);
        });
      }
    }

    // 处理信号
    let isShuttingDown = false;
    const handleSignal = (signal: string) => {
      if (!isShuttingDown) {
        console.log("");
        Logger.info(`正在关闭 Claude Code... (信号: ${signal})`);
        proc.kill();
      }
      isShuttingDown = true;
    };

    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));

    // 等待进程结束
    const exitCode = await proc.exited;

    console.log("");
    if (exitCode === 0) {
      Logger.success("Claude Code 正常退出");
      if (prompt && prompt.trim() !== "") Logger.info(`任务执行时长: ${Math.round((performance.now() - startTime) / 1000)}秒\n`);
    } else {
      Logger.error(`Claude Code 退出，退出码: ${exitCode}\n`);
      process.exit(exitCode);
    }
  } catch (error) {
    Logger.error(
      `启动 Claude Code 失败: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
}
