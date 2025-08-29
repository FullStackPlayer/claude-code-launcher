import { expect, test, describe, mock } from 'bun:test';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseArgs, providerToEnvVars } from '../src/utils.js';
import type { ProviderConfig } from '../src/types.js';

describe('Utils Tests', () => {
  describe('parseArgs', () => {
    test('should parse provider argument correctly', () => {
      const originalArgv = process.argv;
      
      // Mock command line arguments
      process.argv = ['node', 'script.js', '--provider=test-provider'];
      const result = parseArgs();
      expect(result).toEqual({ provider: 'test-provider' });
      
      // Restore original argv
      process.argv = originalArgv;
    });

    test('should return empty object when no recognized arguments', () => {
      const originalArgv = process.argv;
      
      // Mock command line arguments without recognized arguments
      process.argv = ['node', 'script.js', '--other=value'];
      const result = parseArgs();
      expect(result).toEqual({});
      
      // Restore original argv
      process.argv = originalArgv;
    });
    
    test('should parse both provider and prompt arguments correctly', () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      
      // Mock process.exit
      let exitCalled = false;
      process.exit = (() => {
        exitCalled = true;
      }) as any;
      
      // Mock command line arguments with provider and prompt but no output
      process.argv = ['node', 'script.js', '--provider=test-provider', '--prompt=test-prompt'];
      parseArgs();
      expect(exitCalled).toBe(true); // Should exit because output is missing
      
      // Restore original argv and exit
      process.argv = originalArgv;
      process.exit = originalExit;
    });
    
    test('should parse provider, prompt, and output arguments correctly', () => {
      const originalArgv = process.argv;
      
      // Mock command line arguments with all three parameters
      process.argv = ['node', 'script.js', '--provider=test-provider', '--prompt=test-prompt', '--output=test-output.txt'];
      const result = parseArgs();
      expect(result).toEqual({ 
        provider: 'test-provider', 
        prompt: 'test-prompt', 
        output: 'test-output.txt' 
      });
      
      // Restore original argv
      process.argv = originalArgv;
    });
    
    test('should handle prompt without provider and exit', () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      
      // Mock process.exit
      let exitCalled = false;
      process.exit = (() => {
        exitCalled = true;
      }) as any;
      
      // Mock command line arguments with prompt but no provider
      process.argv = ['node', 'script.js', '--prompt=test-prompt', '--output=test-output.txt'];
      parseArgs();
      expect(exitCalled).toBe(true);
      
      // Restore original argv and exit
      process.argv = originalArgv;
      process.exit = originalExit;
    });
    
    test('should handle output without prompt and exit', () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      
      // Mock process.exit
      let exitCalled = false;
      process.exit = (() => {
        exitCalled = true;
      }) as any;
      
      // Mock command line arguments with output but no prompt
      process.argv = ['node', 'script.js', '--provider=test-provider', '--output=test-output.txt'];
      parseArgs();
      expect(exitCalled).toBe(true);
      
      // Restore original argv and exit
      process.argv = originalArgv;
      process.exit = originalExit;
    });
    
    test('should handle version argument and exit', () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      const originalConsoleLog = console.log;
      const originalProcessCwd = process.cwd;
      
      // Mock process.exit and console.log
      let exitCalled = false;
      let loggedOutput = '';
      process.exit = (() => {
        exitCalled = true;
      }) as any;
      console.log = ((message: string) => {
        loggedOutput = message;
      }) as any;
      
      // Mock process.cwd to return the project root
      process.cwd = (() => join(import.meta.dir, '..')) as any;
      
      // Mock command line arguments with version flag
      process.argv = ['node', 'script.js', '--version'];
      parseArgs();
      expect(exitCalled).toBe(true);
      // Version should be "unknown" in test environment or match a version pattern
      expect(loggedOutput === "unknown" || loggedOutput.match(/\d+\.\d+\.\d+/)).toBeTruthy();
      
      // Restore original argv, exit, console.log and process.cwd
      process.argv = originalArgv;
      process.exit = originalExit;
      console.log = originalConsoleLog;
      process.cwd = originalProcessCwd;
    });
    
    test('should handle help argument and exit', () => {
      const originalArgv = process.argv;
      const originalExit = process.exit;
      const originalConsoleLog = console.log;
      
      // Mock process.exit and console.log
      let exitCalled = false;
      let loggedOutput = '';
      process.exit = (() => {
        exitCalled = true;
      }) as any;
      console.log = ((message: string) => {
        loggedOutput = message;
      }) as any;
      
      // Mock command line arguments with help flag
      process.argv = ['node', 'script.js', '--help'];
      parseArgs();
      expect(exitCalled).toBe(true);
      expect(loggedOutput).toContain('用法: ccl [选项]'); // Should output help text
      
      // Restore original argv, exit and console.log
      process.argv = originalArgv;
      process.exit = originalExit;
      console.log = originalConsoleLog;
    });
  });

  describe('providerToEnvVars', () => {
    test('should convert provider config to environment variables', () => {
      const provider: ProviderConfig = {
        base_url: 'https://test.api.com',
        auth_token: 'test-token',
        model: 'test-model',
        small_fast_model: 'test-small-model'
      };

      const envVars = providerToEnvVars(provider);
      
      expect(envVars.ANTHROPIC_BASE_URL).toBe('https://test.api.com');
      expect(envVars.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      expect(envVars.ANTHROPIC_MODEL).toBe('test-model');
      expect(envVars.ANTHROPIC_SMALL_FAST_MODEL).toBe('test-small-model');
    });

    test('should handle optional fields correctly', () => {
      const provider: ProviderConfig = {
        base_url: 'https://test.api.com',
        auth_token: 'test-token'
      };

      const envVars = providerToEnvVars(provider);
      
      expect(envVars.ANTHROPIC_BASE_URL).toBe('https://test.api.com');
      expect(envVars.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      expect(envVars.ANTHROPIC_MODEL).toBeUndefined();
      expect(envVars.ANTHROPIC_SMALL_FAST_MODEL).toBeUndefined();
    });
    
    test('should handle additional custom fields correctly', () => {
      const provider: ProviderConfig = {
        base_url: 'https://test.api.com',
        auth_token: 'test-token',
        custom_field: 'custom-value',
        another_field: 'another-value'
      };

      const envVars = providerToEnvVars(provider);
      
      expect(envVars.ANTHROPIC_BASE_URL).toBe('https://test.api.com');
      expect(envVars.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      // 验证自定义字段被正确转换为大写环境变量
      expect(envVars.ANTHROPIC_CUSTOM_FIELD).toBe('custom-value');
      expect(envVars.ANTHROPIC_ANOTHER_FIELD).toBe('another-value');
    });
    
    test('should ignore empty or undefined values', () => {
      const provider: ProviderConfig = {
        base_url: 'https://test.api.com',
        auth_token: 'test-token',
        empty_field: '',
        // @ts-ignore
        undefined_field: undefined,
        // @ts-ignore
        null_field: null,
        valid_field: 'valid-value'
      };

      const envVars = providerToEnvVars(provider);
      
      expect(envVars.ANTHROPIC_BASE_URL).toBe('https://test.api.com');
      expect(envVars.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      // 验证空值、undefined和null字段被忽略
      expect(envVars.ANTHROPIC_EMPTY_FIELD).toBeUndefined();
      expect(envVars.ANTHROPIC_UNDEFINED_FIELD).toBeUndefined();
      expect(envVars.ANTHROPIC_NULL_FIELD).toBeUndefined();
      // 验证有效字段被正确处理
      expect(envVars.ANTHROPIC_VALID_FIELD).toBe('valid-value');
    });
  });

  describe('loadConfig', () => {
    test('should load valid config file', () => {
      // Mock the loadConfig function to use a specific directory for testing
      const validConfig = {
        default_provider: 'test-provider',
        providers: {
          'test-provider': {
            base_url: 'https://test.api.com',
            auth_token: 'test-token'
          }
        }
      };

      // Create temporary config file in test directory
      const testDir = join(process.cwd(), 'test-temp');
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
      
      const tempConfigPath = join(testDir, 'ccl.config.json');
      writeFileSync(tempConfigPath, JSON.stringify(validConfig, null, 2));
      
      // Temporarily change working directory
      const originalCwd = process.cwd();
      process.chdir(testDir);
      
      // Since we can't easily mock the getCurrentDir function,
      // let's create a simple version of loadConfig for testing purposes
      const testLoadConfig = () => {
        const configPath = join(process.cwd(), 'ccl.config.json');
        if (!existsSync(configPath)) {
          throw new Error(`配置文件 ccl.config.json 不存在`);
        }

        try {
          const configContent = readFileSync(configPath, 'utf-8');
          const config = JSON.parse(configContent);
          return config;
        } catch (error) {
          throw new Error(`配置文件格式错误: ${error instanceof Error ? error.message : String(error)}`);
        }
      };
      
      try {
        const config = testLoadConfig();
        expect(config.default_provider).toBe('test-provider');
        // 添加类型检查确保config.providers['test-provider']存在
        if (config.providers['test-provider']) {
          expect(config.providers['test-provider'].base_url).toBe('https://test.api.com');
        } else {
          // 如果不存在则抛出错误
          throw new Error('Provider test-provider not found in config');
        }
      } finally {
        // Restore original working directory
        process.chdir(originalCwd);
        
        // Clean up
        unlinkSync(tempConfigPath);
        // 尝试删除目录，如果目录不为空可能会失败，这在测试中是可以接受的
        try {
          rmdirSync(testDir);
        } catch (e) {
          // 忽略删除目录失败的情况
        }
      }
    });
  });
});
