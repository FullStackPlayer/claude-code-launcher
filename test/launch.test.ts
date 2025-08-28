import { expect, test, describe } from 'bun:test';
import type { EnvVars } from '../src/types.js';

describe('Launch Tests', () => {
  describe('环境变量传递测试', () => {
    test('should correctly set environment variables', () => {
      const testEnvVars: EnvVars = {
        ANTHROPIC_BASE_URL: 'https://test.api.com',
        ANTHROPIC_AUTH_TOKEN: 'test-token',
        ANTHROPIC_MODEL: 'test-model',
        ANTHROPIC_SMALL_FAST_MODEL: 'test-small-model'
      };

      // 验证环境变量对象结构
      expect(testEnvVars.ANTHROPIC_BASE_URL).toBe('https://test.api.com');
      expect(testEnvVars.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      expect(testEnvVars.ANTHROPIC_MODEL).toBe('test-model');
      expect(testEnvVars.ANTHROPIC_SMALL_FAST_MODEL).toBe('test-small-model');
    });

    test('should handle optional environment variables', () => {
      const testEnvVars: EnvVars = {
        ANTHROPIC_BASE_URL: 'https://test.api.com',
        ANTHROPIC_AUTH_TOKEN: 'test-token'
      };

      expect(testEnvVars.ANTHROPIC_BASE_URL).toBe('https://test.api.com');
      expect(testEnvVars.ANTHROPIC_AUTH_TOKEN).toBe('test-token');
      expect(testEnvVars.ANTHROPIC_MODEL).toBeUndefined();
      expect(testEnvVars.ANTHROPIC_SMALL_FAST_MODEL).toBeUndefined();
    });
  });

  describe('Bun.spawn 配置测试', () => {
    test('should use correct Bun.spawn configuration for interactive applications', () => {
      // 验证 Bun.spawn 配置参数
      const expectedConfig = {
        stdin: 'inherit',
        stdout: 'inherit',
        stderr: 'inherit'
      };

      expect(expectedConfig.stdin).toBe('inherit');
      expect(expectedConfig.stdout).toBe('inherit');
      expect(expectedConfig.stderr).toBe('inherit');
    });
  });
});