#!/bin/bash

# 获取脚本所在目录和项目根目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 读取项目根目录下 package.json 中的 version 属性
VERSION="v$(jq -r '.version' "$PROJECT_ROOT/package.json")"
echo "项目版本: $VERSION"

# 检查 releases 目录下是否有 $VERSION 命名的子目录，没有则创建
RELEASE_DIR="$SCRIPT_DIR/$VERSION"
if [ ! -d "$RELEASE_DIR" ]; then
  echo "创建目录: $RELEASE_DIR"
  mkdir -p "$RELEASE_DIR"
fi

# 执行 bun build:release 命令进行构建
echo "开始构建项目..."
cd "$PROJECT_ROOT"
bun run build:release

# 检查构建是否成功
if [ $? -ne 0 ]; then
  echo "构建失败，退出脚本"
  exit 1
fi

# 将 dist 目录下的产物文件按照规则进行压缩转存
echo "压缩并转存构建产物..."

# 初始化文件列表
FILES=()

# 压缩并转存各个平台的构建产物
if [ -f "$PROJECT_ROOT/dist/win32/x64/ccl.exe" ]; then
  WINDOWS_ZIP="$RELEASE_DIR/ccl-win32-x64.zip"
  echo "压缩 Windows 版本到 $WINDOWS_ZIP"
  zip -j "$WINDOWS_ZIP" "$PROJECT_ROOT/dist/win32/x64/ccl.exe"
  FILES+=("$WINDOWS_ZIP")
fi

if [ -f "$PROJECT_ROOT/dist/darwin/arm64/ccl" ]; then
  DARWIN_ARM64_ZIP="$RELEASE_DIR/ccl-darwin-arm64.zip"
  echo "压缩 macOS ARM64 版本到 $DARWIN_ARM64_ZIP"
  zip -j "$DARWIN_ARM64_ZIP" "$PROJECT_ROOT/dist/darwin/arm64/ccl"
  FILES+=("$DARWIN_ARM64_ZIP")
fi

if [ -f "$PROJECT_ROOT/dist/darwin/x64/ccl" ]; then
  DARWIN_X64_ZIP="$RELEASE_DIR/ccl-darwin-x64.zip"
  echo "压缩 macOS x64 版本到 $DARWIN_X64_ZIP"
  zip -j "$DARWIN_X64_ZIP" "$PROJECT_ROOT/dist/darwin/x64/ccl"
  FILES+=("$DARWIN_X64_ZIP")
fi

# 检查是否有文件被压缩
if [ ${#FILES[@]} -eq 0 ]; then
  echo "没有找到任何构建产物，退出脚本"
  exit 1
fi

# 读取根目录下 Releases.md 文件，取出 $VERSION 对应名称的一级标题下的内容作为 RELEASE_NOTES 的内容
echo "读取发布说明..."
RELEASE_NOTES=""
if [ -f "$PROJECT_ROOT/Releases.md" ]; then
  # 使用 awk 提取指定版本的发布说明
  RELEASE_NOTES=$(awk -v ver="$VERSION" '
    /^# v[0-9]/{ 
      if (match($0, "^# " ver)) {
        found=1; 
        next
      } else if (found) {
        exit
      }
    } 
    found { 
      if (NR==1) {
        sub(/^\n+/, "")
      }
      notes=notes $0 "\n" 
    } 
    END { 
      if (found) {
        # 移除末尾的空行
        gsub(/\n+$/, "", notes)
        print notes
      }
    }
  ' "$PROJECT_ROOT/Releases.md")
  
  # 如果没有找到对应版本的说明，使用默认说明
  if [ -z "$RELEASE_NOTES" ]; then
    RELEASE_NOTES="Release $VERSION"
  fi
else
  RELEASE_NOTES="Release $VERSION"
fi

# 转义特殊字符
RELEASE_NOTES_ESCAPED=$(printf '%s\n' "$RELEASE_NOTES" | sed 's/`/\\`/g')

# 调试信息
echo "SCRIPT_DIR: $SCRIPT_DIR"
echo "VERSION: $VERSION"
echo "Files to upload:"
for file in "${FILES[@]}"; do
  echo "  $file"
done

# 切换到脚本所在目录
cd "$SCRIPT_DIR"

# 创建 release
echo "创建 GitHub Release..."
gh release create "$VERSION" \
  "${FILES[@]}" \
  --title "Release $VERSION" \
  --notes "$RELEASE_NOTES_ESCAPED" \
  --draft=false \
  --prerelease=false

echo "发布完成！"