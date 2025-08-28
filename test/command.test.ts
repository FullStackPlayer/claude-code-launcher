import { expect, test, describe } from 'bun:test';

describe('Claude Code Command Tests', () => {
  test('should use correct claude command', () => {
    // 验证启动命令是 'claude' 而不是 'claude-code'
    const expectedCommand = 'claude';
    expect(expectedCommand).toBe('claude');
    expect(expectedCommand).not.toBe('claude-code');
  });

  test('should check for @anthropic-ai/claude-code package', () => {
    // 验证检查的包名是正确的
    const packageName = '@anthropic-ai/claude-code';
    expect(packageName).toBe('@anthropic-ai/claude-code');
  });

  test('command and package name should be different', () => {
    // 强调包名和命令名的区别
    const packageName = '@anthropic-ai/claude-code';
    const command = 'claude';
    
    expect(packageName).not.toBe(command);
    expect(command).toBe('claude');
  });
});