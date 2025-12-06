# 技术栈

## 选型
- Bun 运行时
- TypeScript 语言
- 利用 Bun 的编译成单个可执行文件能力进行交付

## 开发步骤

1. 在当前目录下执行 `bun init -y` 来初始化项目
2. 执行 `bun install` 安装其它依赖
3. 帮我挑选一个优秀的交互式 tui 库并安装
4. 创建一个 `src/index.ts` 文件编写代码逻辑
5. 如果需要的话，在 test 目录下创建单元测试
6. 在 `package.json` 文件中添加 start, test, build:xxx 脚本命令（注意 xxx 是编译成可执行文件时的目标操作系统）
7. 运行 `bun test` 测试代码

## 注意

1. 一定要用心处理不同操作系统的差异
2. 打印提示信息时要统一格式，并且根据信息类型设置不同颜色
3. 严格遵循 typescript 的类型系统
4. 启动 Claude Code 的命令是 `claude`

