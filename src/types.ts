/**
 * Provider 配置接口
 */
export type ProviderConfig = { [key: string]: string; } & {
  /** API 基础 URL */
  base_url: string;
  /** API 认证令牌 */
  auth_token: string;
  /** 模型名称 (可选) */
  model?: string;
  /** 小型快速模型名称 (可选) */
  small_fast_model?: string;
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  /** 默认使用的 provider */
  default_provider?: string;
  /** provider 配置列表 */
  providers: Record<string, ProviderConfig>;
}

/**
 * 环境变量映射接口
 */
export type EnvVars = { [key: string]: string; } &  {
  ANTHROPIC_BASE_URL: string;
  ANTHROPIC_AUTH_TOKEN: string;
  ANTHROPIC_MODEL?: string;
  ANTHROPIC_SMALL_FAST_MODEL?: string;
}

/**
 * 操作系统类型
 */
export type OSType = 'windows' | 'unix';