import chalk from "chalk";
import { readFileSync, existsSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import type { AppConfig, ProviderConfig, EnvVars, OSType } from "./types.js";

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

  // 尝试在可执行文件所在目录查找配置文件
  //   console.log(currentDir, process.cwd())
  let configPath = join(currentDir, "ccl.config.json");

  // 如果在可执行文件所在目录找不到配置文件，则尝试在当前工作目录查找
  if (!existsSync(configPath)) {
    Logger.warning(`配置文件 ccl.config.json 不存在，正在创建默认配置文件...`);

    // 创建默认配置文件内容
    const defaultConfig = {
      providers: {
        "glm-4.5": {
          base_url: "https://open.bigmodel.cn/api/anthropic",
          auth_token: "GLM_API_KEY",
        },
        "deepseek-3.1": {
          base_url: "https://api.deepseek.com/anthropic",
          auth_token: "DEEPSEEK_API_KEY",
          model: "deepseek-chat",
          small_fast_model: "deepseek-chat",
        },
        "kimi-k2": {
          base_url: "https://api.moonshot.cn/anthropic",
          auth_token: "KIMI_API_KEY",
          model: "kimi-k2-turbo-preview",
          small_fast_model: "kimi-k2-turbo-preview",
        },
        "qwen3-coder": {
          base_url: "https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy",
          auth_token: "YOUR_BAILIAN_API_KEY",
        },
      },
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
      Logger.error(`请手动创建配置文件 ccl.config.json，内容如下:`);
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
 * 解析命令行参数
 */
export function parseArgs(): string | null {
  const args = process.argv.slice(2);
  const providerArg = args.find((arg) => arg.startsWith("--provider="));

  if (providerArg) {
    const provider = providerArg.split("=")[1];
    return provider || null;
  }

  return null;
}

/**
 * 检测操作系统类型
 */
export function detectOS(): OSType {
  return process.platform === "win32" ? "windows" : "unix";
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
export async function launchClaudeCode(envVars: EnvVars): Promise<void> {
  Logger.info("正在启动 Claude Code...");

  const env = { ...process.env, ...envVars };

  try {
    // 使用 Bun.spawn 提供更好的交互式支持
    // 注意 windows 下的启动命令
    const claudeCmd = isWindows() ? "claude.cmd" : "claude";
    const proc = Bun.spawn([claudeCmd], {
      env,
      stdin: "inherit",
      stdout: "inherit",
      stderr: "inherit",
    });

    Logger.success("Claude Code 启动成功");

    // 处理信号
    const handleSignal = (signal: string) => {
      Logger.info(`\n正在关闭 Claude Code... (信号: ${signal})`);
      proc.kill();
    };

    process.on("SIGINT", () => handleSignal("SIGINT"));
    process.on("SIGTERM", () => handleSignal("SIGTERM"));

    // 等待进程结束
    const exitCode = await proc.exited;

    if (exitCode === 0) {
      console.log("");
      Logger.success("Claude Code 正常退出\n");
    } else {
      console.log("");
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
