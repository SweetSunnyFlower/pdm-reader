# PDM Reader

PDM Reader 是一个基于 Wails + React 的 PowerDesigner `.pdm` 文件可视化查看工具，用于解析 PDM 模型中的表、字段、主键、外键、索引，并在画布中展示表关系。

## 功能

- 打开一个或多个 PowerDesigner `.pdm` 文件
- 多文件 Tab 展示
- 解析表、字段、主键、外键、索引信息
- React Flow 关系画布
- 表节点支持拖拽
- 画布节点位置按文件保持
- 点击表后自动在画布中选中并居中
- 全局搜索所有已打开的 PDM 文件
- 搜索命中的文件 Tab 会显示蓝色闪动标记
- 全局搜索时只展示命中的 Tab
- Tab 支持横向滚动和左右箭头滚动
- Neumorphism Soft UI 风格界面

## 技术栈

- Wails
- Go
- React
- Vite
- pnpm
- React Router
- React Flow (`@xyflow/react`)
- Tailwind CSS

## 开发环境

需要安装：

- Go
- Node.js
- pnpm
- Wails CLI

检查 Wails 环境：

```bash
wails doctor
```

安装前端依赖：

```bash
pnpm --dir frontend install
```

启动开发模式：

```bash
wails dev
```

## 构建

构建当前平台应用：

```bash
wails build
```

构建 Windows 64 位应用：

```bash
wails build -platform windows/amd64
```

如需 Windows 安装包，可在 Windows 环境安装 NSIS 后执行：

```bash
wails build -platform windows/amd64 -nsis
```

构建产物位于：

```bash
build/bin/
```

## 使用

1. 启动应用。
2. 在首页点击“打开 PDM”。
3. 选择一个或多个 `.pdm` 文件。
4. 在查看器页面中通过左侧表列表、顶部 Tab、全局搜索和中间关系画布查看模型结构。

## 说明

`.pdm` 文件本质上是 XML 文件。不同版本的 PowerDesigner 可能存在结构差异，解析时如果遇到未完全识别的结构，应用会尽量展示已解析内容，并在详情面板中显示解析提示。
