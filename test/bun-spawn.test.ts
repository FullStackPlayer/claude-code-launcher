import { expect, test, describe } from 'bun:test';

describe('Bun.spawn Tests', () => {
  test('should be able to use Bun.spawn', () => {
    // 验证 Bun.spawn 是否可用
    expect(typeof Bun.spawn).toBe('function');
  });

  test('should handle simple command execution', async () => {
    // 测试简单的命令执行
    const proc = Bun.spawn(['echo', 'hello'], {
      stdout: 'pipe'
    });
    
    const output = await new Response(proc.stdout).text();
    expect(output.trim()).toBe('hello');
    
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test('should handle command with environment variables', async () => {
    // 测试环境变量传递
    const proc = Bun.spawn(['env'], {
      env: { TEST_VAR: 'test_value' },
      stdout: 'pipe'
    });
    
    const output = await new Response(proc.stdout).text();
    expect(output).toContain('TEST_VAR=test_value');
    
    const exitCode = await proc.exited;
    expect(exitCode).toBe(0);
  });

  test('should handle non-existent command gracefully', async () => {
    // 测试不存在的命令
    try {
      const proc = Bun.spawn(['nonexistent-command-12345'], {
        stdout: 'pipe',
        stderr: 'pipe'
      });
      
      const exitCode = await proc.exited;
      expect(exitCode).not.toBe(0);
    } catch (error) {
      // Bun.spawn 可能会抛出错误，这也是正常的
      expect(error).toBeDefined();
    }
  });
});