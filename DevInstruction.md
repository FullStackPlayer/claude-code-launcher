# 开发及发布流程

- 1、编写代码
- 2、执行 `bun run start` 进行测试
- 3、执行 `bun run build:xxx:yyy` 命令构建各平台下的可执行文件进行测试，或者执行 `bun run build:all` 构建全部
- 4、修改 `package.json` 文件中的版本号
- 5、在 `./Documents/Releases.md` 文件中添加当前版本的 Release Note
- 6、更新 `README.md` 文件
- 7、执行 `./releases/release2gh.sh` 命令实现自动打包和发布到 github
- 8、将不同平台下的产物分发到各自的 npm 包项目然后依次 publish（注意 claude-code-launcher 本身不用 publish）
- 9、更新 `ccl-cli-installer` 包项目然后 publish
- 10、提交几个相关项目的代码到 Github