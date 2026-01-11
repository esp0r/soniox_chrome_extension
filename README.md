# Soniox Live Subtitles Chrome Extension

实时捕获网页音频，使用 Soniox API 进行语音转文字和翻译，并以双语字幕的形式在网页上叠加显示。

## 安装步骤

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 开启右上角的「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension` 文件夹

## 使用方法

1. 在 [Soniox Console](https://console.soniox.com) 获取 API Key
2. 打开任意包含音频/视频的网页（如 YouTube）
3. 点击扩展图标，输入 API Key
4. 选择源语言和目标语言
5. 点击 "Start Capture" 开始捕获
6. 字幕将显示在网页底部

## 功能特点

- ✅ 实时语音识别
- ✅ 双向翻译支持
- ✅ 双语字幕显示
- ✅ 支持 60+ 种语言
- ✅ 说话人识别
- ✅ 语言自动识别

## 调试

打开 Chrome DevTools 查看控制台日志：
- **Popup**: 右键点击扩展图标 → 检查弹出内容
- **Background**: chrome://extensions → 服务工作进程
- **Content Script**: 网页的 DevTools 控制台
- **Offscreen**: chrome://extensions → 详情 → 检查视图

## 文件结构

```
extension/
├── manifest.json      # 扩展配置
├── background.js      # Service Worker
├── popup.html/js      # 弹出界面
├── content.js/css     # 字幕注入脚本
├── offscreen.html/js  # 音频处理和 WebSocket
└── README.md
```

## 注意事项

- 需要在播放音频的标签页上使用
- API Key 会保存在本地存储中
- 关闭标签页会自动停止捕获
