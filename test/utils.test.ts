import { expect, test, describe, mock } from 'bun:test';
import { existsSync, writeFileSync, unlinkSync, mkdirSync, rmdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { parseArgs, providerToEnvVars, loadConfig } from '../src/utils.js';
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

    test('should parse pwd argument correctly', () => {
      const originalArgv = process.argv;
      
      // Mock command line arguments with pwd parameter
      process.argv = ['node', 'script.js', '--pwd=/test/path'];
      const result = parseArgs();
      expect(result).toEqual({ pwd: '/test/path' });
      
      // Restore original argv
      process.argv = originalArgv;
    });

    test('should parse all arguments including pwd correctly', () => {
      const originalArgv = process.argv;
      
      // Mock command line arguments with all parameters
      process.argv = ['node', 'script.js', '--provider=test-provider', '--prompt=test-prompt', '--output=test-output.txt', '--pwd=/test/path'];
      const result = parseArgs();
      expect(result).toEqual({ 
        provider: 'test-provider', 
        prompt: 'test-prompt', 
        output: 'test-output.txt',
        pwd: '/test/path'
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
      // Version should be defined
      expect(loggedOutput).toBeDefined();
      
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
      expect(loggedOutput).toContain('用法:'); // Should output help text
      
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
      // Save original functions and variables
      const originalGetCurrentDir = (globalThis as any).getCurrentDir;
      const originalProcessCwd = process.cwd;
      
      // Create a temporary directory for testing
      const testDir = join(process.cwd(), 'test-temp-load-config');
      if (!existsSync(testDir)) {
        mkdirSync(testDir, { recursive: true });
      }
      
      try {
        // Copy the actual config file to the test directory
        const projectConfigPath = join(process.cwd(), 'ccl.config.json');
        const testConfigPath = join(testDir, 'ccl.config.json');
        
        if (existsSync(projectConfigPath)) {
          const configContent = readFileSync(projectConfigPath, 'utf-8');
          writeFileSync(testConfigPath, configContent);
        }
        
        // Mock getCurrentDir to return test directory
        (globalThis as any).getCurrentDir = () => testDir;
        
        // Call loadConfig function
        const config = loadConfig();
        
        // Verify config loading succeeded
        expect(config).not.toBeNull();
        if (config) {
          // Check that the config has the expected structure
          expect(config.providers).toBeDefined();
          expect(Object.keys(config.providers).length).toBeGreaterThan(0);
          // Check for the default provider that we know exists in the actual config
          expect(config.providers['glm-4.5']).toBeDefined();
        }
      } finally {
        // Restore original functions
        if (originalGetCurrentDir) {
          (globalThis as any).getCurrentDir = originalGetCurrentDir;
        } else {
          delete (globalThis as any).getCurrentDir;
        }
        
        // Clean up
        const testConfigPath = join(testDir, 'ccl.config.json');
        if (existsSync(testConfigPath)) {
          unlinkSync(testConfigPath);
        }
        try {
          rmdirSync(testDir);
        } catch (e) {
          // Ignore directory removal errors
        }
      }
    });

    test('should work correctly when process.cwd changes', () => {
      // Save original functions
      const originalGetCurrentDir = (globalThis as any).getCurrentDir;
      
      // Mock getCurrentDir to return project root directory
      const testConfigDir = join(import.meta.dir, '..');
      (globalThis as any).getCurrentDir = () => testConfigDir;
      
      // Save original working directory
      const originalCwd = process.cwd();
      
      // Change working directory to a different path
      process.chdir('/');
      
      try {
        // Call loadConfig function
        const config = loadConfig();
        
        // Verify config loading succeeded
        expect(config).not.toBeNull();
        if (config) {
          expect(config.providers).toBeDefined();
          
          // Verify config contains expected providers
          expect(Object.keys(config.providers).length).toBeGreaterThan(0);
        }
      } finally {
        // Restore original working directory
        process.chdir(originalCwd);
        
        // Restore original getCurrentDir function
        if (originalGetCurrentDir) {
          (globalThis as any).getCurrentDir = originalGetCurrentDir;
        } else {
          delete (globalThis as any).getCurrentDir;
        }
      }
    });
  });
});
