import { expect, test, describe, mock } from 'bun:test';
import { launchClaudeCode } from '../src/utils.js';
import type { EnvVars } from '../src/types.js';

// 模拟 Bun.spawn
const mockSpawn = mock((cmdArgs, options) => {
  // 根据 stdout 选项决定返回的 mock 对象
  const isPiped = options.stdout === "pipe";
  
  return {
    stdout: isPiped ? {
      getReader: () => ({
        read: mock(() => Promise.resolve({ done: true }))
      })
    } : "inherit",
    stderr: isPiped ? {
      getReader: () => ({
        read: mock(() => Promise.resolve({ done: true }))
      })
    } : "inherit",
    exited: Promise.resolve(0),
    kill: mock(() => {})
  };
});

// 模拟 process.on
const mockProcessOn = mock(() => {});

// 模拟 Bun.file
let capturedFileName = '';
const mockFile = mock((fileName) => {
  capturedFileName = fileName;
  return {
    writer: () => ({
      write: mock(() => {}),
      flush: mock(() => Promise.resolve()),
      end: mock(() => Promise.resolve())
    })
  };
});

describe('Launch Tests', () => {
  // ... existing tests ...
  
  test('输出捕获测试 > should capture process output', async () => {
    // 保存原始的 Bun.spawn 和 process.on
    const originalSpawn = Bun.spawn;
    const originalProcessOn = process.on;
    const originalFile = Bun.file;
    
    // 模拟 Bun.spawn 和 process.on
    Bun.spawn = mockSpawn as any;
    process.on = mockProcessOn as any;
    Bun.file = mockFile as any;
    
    const envVars: EnvVars = {
      ANTHROPIC_BASE_URL: 'https://test.com',
      ANTHROPIC_AUTH_TOKEN: 'test-token'
    };
    
    // 调用函数
    await launchClaudeCode(envVars);
    
    // 验证 Bun.spawn 被调用
    expect(mockSpawn).toHaveBeenCalled();
    
    // 验证 process.on 被调用注册信号处理
    expect(mockProcessOn).toHaveBeenCalledWith("SIGINT", expect.any(Function));
    expect(mockProcessOn).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
    
    // 恢复原始函数
    Bun.spawn = originalSpawn;
    process.on = originalProcessOn;
    Bun.file = originalFile;
  });
  
  test('文件输出测试 > should write to file when output is specified', async () => {
    // 保存原始的 Bun.spawn 和 process.on
    const originalSpawn = Bun.spawn;
    const originalProcessOn = process.on;
    const originalFile = Bun.file;
    
    // 模拟 Bun.spawn 和 process.on
    Bun.spawn = mockSpawn as any;
    process.on = mockProcessOn as any;
    Bun.file = mockFile as any;
    
    const envVars: EnvVars = {
      ANTHROPIC_BASE_URL: 'https://test.com',
      ANTHROPIC_AUTH_TOKEN: 'test-token'
    };
    
    const prompt = "test prompt";
    const output = "test-output.md";
    
    // 调用函数
    await launchClaudeCode(envVars, prompt, output);
    
    // 验证 Bun.spawn 被调用
    expect(mockSpawn).toHaveBeenCalled();
    
    // 验证 Bun.file 被调用且文件名包含时间戳后缀
    expect(mockFile).toHaveBeenCalledWith(expect.stringMatching(/^.*_\d{6}\d{6}\.md$/));
    
    // 恢复原始函数
    Bun.spawn = originalSpawn;
    process.on = originalProcessOn;
    Bun.file = originalFile;
  });
  
  test('additionalOTQP测试 > should append additionalOTQP to prePrompt', async () => {
    // 保存原始的 Bun.spawn 和 process.on
    const originalSpawn = Bun.spawn;
    const originalProcessOn = process.on;
    const originalFile = Bun.file;
    
    // 模拟 Bun.spawn 和 process.on
    let capturedArgs: any[] = [];
    const mockSpawnWithArgs = mock((cmdArgs, options) => {
      capturedArgs = cmdArgs;
      // 根据 stdout 选项决定返回的 mock 对象
      const isPiped = options.stdout === "pipe";
      
      return {
        stdout: isPiped ? {
          getReader: () => ({
            read: mock(() => Promise.resolve({ done: true }))
          })
        } : "inherit",
        stderr: isPiped ? {
          getReader: () => ({
            read: mock(() => Promise.resolve({ done: true }))
          })
        } : "inherit",
        exited: Promise.resolve(0),
        kill: mock(() => {})
      };
    });
    
    Bun.spawn = mockSpawnWithArgs as any;
    process.on = mockProcessOn as any;
    Bun.file = mockFile as any;
    
    const envVars: EnvVars = {
      ANTHROPIC_BASE_URL: 'https://test.com',
      ANTHROPIC_AUTH_TOKEN: 'test-token'
    };
    
    const prompt = "test prompt";
    const output = "test-output.md";
    const additionalOTQP = "这是用户自定义的OTQP内容";
    
    // 调用函数
    await launchClaudeCode(envVars, prompt, output, additionalOTQP);
    
    // 验证 Bun.spawn 被调用
    expect(mockSpawnWithArgs).toHaveBeenCalled();
    
    // 验证 additionalOTQP 被正确追加到 prePrompt
    const promptArgIndex = capturedArgs.indexOf('-p');
    expect(promptArgIndex).toBeGreaterThan(-1);
    expect(capturedArgs[promptArgIndex + 1]).toContain(additionalOTQP);
    
    // 验证文件名包含时间戳后缀
    expect(capturedFileName).toMatch(/^.*_\d{6}\d{6}\.md$/);
    
    // 恢复原始函数
    Bun.spawn = originalSpawn;
    process.on = originalProcessOn;
    Bun.file = originalFile;
  });
});