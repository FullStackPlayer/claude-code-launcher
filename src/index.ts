#!/usr/bin/env bun

import {
  Logger,
  checkClaudeCodeInstalled,
  loadConfig,
  parseArgs,
  providerToEnvVars,
  launchClaudeCode,
  isExecutable,
} from "./utils.js";
import prompts from "prompts";

/**
 * 主函数
 */
async function main(): Promise<void> {
  try {
    // console.log('程序参数：', process.argv)
    // 检查是否是 TUI 选择器模式
    const args = process.argv.slice(2);
    // 启动 tui 选择器
    if (args[0] === "--tui-selector") {
      try {
        // TUI 选择器模式
        const configJson = args[1];
        if (configJson) {
          const config = JSON.parse(configJson);
          const selectedProvider = await runTUISelector(config);
          if (selectedProvider) {
            process.stdout.write(selectedProvider);
            process.exit(0);
          } else {
            process.exit(1);
          }
        } else {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(err);
      }
    }

    // 1. 检查 Claude Code 是否已安装
    Logger.info("检查 Claude Code 是否已安装");
    const isInstalled = await checkClaudeCodeInstalled();

    if (!isInstalled) {
      Logger.error("未检测到全局安装的 Claude Code");
      Logger.info("请先运行: npm install -g @anthropic-ai/claude-code");
      process.exit(1);
    }

    Logger.success("检测到 Claude Code 已安装");

    // 2. 加载和验证配置文件
    Logger.info("加载配置文件...");
    const config = loadConfig();
    // 如果配置文件加载失败（null），则停止程序运行
    if (config === null) {
      Logger.warning("程序将在5秒后自动退出...");
      process.stdin.resume();
      setTimeout(() => {
        process.exit(1);
      }, 5000);
    }
    else {
      Logger.success("配置文件加载成功");

      // 3. 解析命令行参数
      const argsResult = parseArgs();
      let selectedProvider = argsResult[0] || '';
      const prompt = argsResult[1] || '';
      const output = argsResult[2] || '';

      if (selectedProvider) {
        // 检查指定的 provider 是否存在
        if (config.providers[selectedProvider]) {
          Logger.info(`使用命令行指定的 provider: ${selectedProvider}`);
        } else {
          Logger.warning(`参数指定的 provider "${selectedProvider}" 不存在`);
          // 注意：这里我们仍然需要 provider，所以即使有 prompt 也要重新选择
          selectedProvider = await selectProviderInteractively(config);
        }
      } else {
        // 交互式选择 provider
        selectedProvider = await selectProviderInteractively(config);
      }

      // 4. 获取选中的 provider 配置
      const providerConfig = config.providers[selectedProvider];
      if (!providerConfig) {
        Logger.error(`Provider "${selectedProvider}" 配置不存在`);
        process.exit(1);
      }

      // 5. 转换为环境变量并启动 Claude Code
      const envVars = providerToEnvVars(providerConfig);
      // 获取 additionalOTQP 配置
      const additionalOTQP = config.additionalOTQP || '';
      await launchClaudeCode(envVars, prompt, output, additionalOTQP);
    }
  } catch (error) {
    Logger.error(
      `程序执行失败: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

async function runTUISelector(config: any): Promise<string | null> {
  try {
    // 保存原始的 stdout
    const originalStdout = process.stdout.write;

    // 重定向 prompts 的输出到 stderr
    process.stdout.write = function (
      chunk: any,
      encoding?: any,
      callback?: any
    ) {
      return process.stderr.write(chunk, encoding, callback);
    };

    const providerNames = Object.keys(config.providers);

    // 确定默认选中项
    let defaultIndex = 0;
    if (config.default_provider && config.providers[config.default_provider]) {
      defaultIndex = providerNames.indexOf(config.default_provider);
    }

    const choices = providerNames.map((name: string, index: number) => ({
      title: name,
      description: `${config.providers[name].base_url}`,
      value: name,
    }));

    const response = await prompts(
      {
        type: "select",
        name: "provider",
        message: "选择 provider:",
        choices,
        initial: defaultIndex,
        stdout: process.stderr, // 将 prompts 输出重定向到 stderr
      },
      {
        onCancel: () => {
          // 用户取消了选择
          process.exit(1);
        },
      }
    );

    // 恢复原始的 stdout
    process.stdout.write = originalStdout;

    if (response.provider) {
      return response.provider;
    }
  } catch (error) {
    console.error(error);
    // TUI 选择出错
    return null;
  }

  return null;
}

async function selectProviderInteractively(config: any): Promise<string> {
  const providerNames = Object.keys(config.providers);

  // 确定默认选中项
  let defaultIndex = 0;
  if (config.default_provider && config.providers[config.default_provider]) {
    defaultIndex = providerNames.indexOf(config.default_provider);
  }

  // 如果不是真实的 TTY 环境，直接返回默认选择
  if (!process.stdin.isTTY) {
    const fallbackProvider =
      providerNames[defaultIndex] || providerNames[0] || "glm-4.5";
    Logger.info(`非交互式环境，使用默认 provider: ${fallbackProvider}`);
    return fallbackProvider;
  }

  Logger.info("请选择要使用的 provider:");

  // 使用子进程运行自己的可执行文件，但以 TUI 模式运行
  try {
    // 获取当前可执行文件的路径
    const currentExecutable = process.execPath;
    const args = [currentExecutable];
    // 如果是脚本执行方式，要添加脚本路径作为第2个参数
    if (!isExecutable()) {
      args.push(import.meta.path);
    }
    args.push("--tui-selector");
    args.push(JSON.stringify(config));

    // console.log('当前可执行文件：', currentExecutable)

    const proc = Bun.spawn(
      args,
      {
        stdout: "pipe",
        stderr: "inherit",
        stdin: "inherit",
      }
    );

    const output = await new Response(proc.stdout).text();
    const exitCode = await proc.exited;

    if (exitCode === 0 && output.trim() && config.providers[output.trim()]) {
      const selectedProvider = output.trim();
      // Logger.success(`使用 TUI 选择了 provider: ${selectedProvider}`);
      return selectedProvider;
    } else if (exitCode === 1) {
      // 用户取消了选择，退出整个应用程序
      Logger.info("用户退出应用程序");
      process.exit(1);
    } else {
      Logger.warning("TUI 隔离进程失败");
    }
  } catch (error) {
    Logger.warning(`TUI 隔离进程出错: ${error}`);
  }

  // 方案 2: 回退到默认选项
  const fallbackProvider =
    providerNames[defaultIndex] || providerNames[0] || "glm-4.5";
  Logger.warning(
    `所有交互式方案失败，回退到默认 provider: ${fallbackProvider}`
  );
  return fallbackProvider;
}

// 启动主程序
if (import.meta.main) {
  main().catch((error) => {
    Logger.error(`未捕获的错误: ${error}`);
    process.exit(1);
  });
}
