// scripts/build.ts
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';

// 读取 package.json 获取版本号
const packageJsonPath = join(process.cwd(), 'package.json');
if (!existsSync(packageJsonPath)) {
  console.error('package.json not found');
  process.exit(1);
}

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// 读取 utils.ts 文件
const utilsPath = join(process.cwd(), 'src', 'utils.ts');
if (!existsSync(utilsPath)) {
  console.error('src/utils.ts not found');
  process.exit(1);
}

let utilsContent = readFileSync(utilsPath, 'utf-8');

// 替换版本号占位符
const versionPlaceholder = 'const VERSION = "x.y.z"; // BUILD_VERSION_INJECTION_PLACEHOLDER';
const versionReplacement = `const VERSION = "${version}";`;
utilsContent = utilsContent.replace(versionPlaceholder, versionReplacement);

// 写入临时文件
const tempUtilsPath = join(process.cwd(), 'src', 'utils.build.ts');
writeFileSync(tempUtilsPath, utilsContent);

// 修改 index.ts 文件引用
const indexPath = join(process.cwd(), 'src', 'index.ts');
if (!existsSync(indexPath)) {
  console.error('src/index.ts not found');
  // 清理临时文件
  if (existsSync(tempUtilsPath)) {
    unlinkSync(tempUtilsPath);
  }
  process.exit(1);
}

let indexContent = readFileSync(indexPath, 'utf-8');
const indexBackupPath = join(process.cwd(), 'src', 'index.orig.ts');
writeFileSync(indexBackupPath, indexContent); // 备份原文件

// 修改导入语句
indexContent = indexContent.replace('./utils.js', './utils.build.js');
writeFileSync(indexPath, indexContent);

// 构建命令映射
const buildCommands: Record<string, string> = {
  'build:linux:x64': 'bun build --compile --target=bun-linux-x64 --outfile dist/linux/x64/ccl src/index.ts',
  'build:darwin:arm64': 'bun build --compile --target=bun-darwin-arm64 --outfile dist/darwin/arm64/ccl src/index.ts',
  'build:darwin:x64': 'bun build --compile --target=bun-darwin-x64 --outfile dist/darwin/x64/ccl src/index.ts',
  'build:windows:x64': 'bun build --compile --target=bun-windows-x64 --outfile dist/windows/x64/ccl.exe src/index.ts'
};

// 获取要执行的构建命令
const buildTarget = process.argv[2] || 'build:linux:x64';

try {
  if (buildCommands[buildTarget]) {
    console.log(`Building for ${buildTarget} with version ${version}`);
    execSync(buildCommands[buildTarget], { stdio: 'inherit' });
    console.log('Build completed successfully');
  } else {
    console.error(`Unknown build target: ${buildTarget}`);
    console.log('Available targets:');
    Object.keys(buildCommands).forEach(target => console.log(`  ${target}`));
    process.exit(1);
  }
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} finally {
  // 恢复 index.ts 文件
  if (existsSync(indexBackupPath)) {
    writeFileSync(indexPath, readFileSync(indexBackupPath, 'utf-8'));
    unlinkSync(indexBackupPath);
  }
  
  // 清理临时文件
  if (existsSync(tempUtilsPath)) {
    unlinkSync(tempUtilsPath);
  }
}