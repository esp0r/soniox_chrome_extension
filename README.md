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
4. 选择语音语言提示（可选“Auto Detect / 自动识别”，不发送语言提示）和目标语言
5. 点击 "Start Capture" 开始捕获；语音统一翻译为目标语言，源语言仅作为识别提示
6. 字幕将显示在网页底部

## 功能特点

- ✅ 实时语音识别
- ✅ 单向翻译：识别到的语音统一翻译为所选目标语言
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

## 1.1.0 更新

- 使用 `stt-rt-v5`，通过 WebSocket protocols 传入 API Key，配置消息不再携带 `api_key`。
- 不再记录含 API Key 的配置或消息；仍支持用户在本机填写自己的 Key。
- 弹窗跟随实际采集状态；握手完成后需收到有效结果才显示运行中。
- 网络故障最多重试两次，分别等待 1 秒和 2 秒；认证和请求参数错误不自动重试。
- 重连期间的音频不补发，可能缺失部分字幕；弹窗会显示重连提示。
- 停止时立即释放采集资源，最多等待 5 秒接收最终字幕。最终字幕保留显示，下次开始时清空；超时会提示尾句可能不完整。
- 修复分块字幕空格丢失、重复注入脚本冲突，以及后台重新启动后字幕目标标签页丢失。
- 音频初始化和每次连接等待有效结果的超时为 20 秒；音频上传积压超过约 5 秒时触发恢复。
- 最低要求 Chrome 116。

认证协议参考：[Soniox WebSocket authentication](https://soniox.com/docs/guides/websocket-authentication)。如果以后将扩展作为服务分发并提供统一凭证，应由后端签发临时 Key，不能把共享的长期 Key 打包到扩展里。

## 测试

安装 Node.js 后，在仓库根目录运行：

```sh
node --test tests/*.test.cjs
```

测试使用模拟浏览器音频、Chrome 扩展消息和 WebSocket，覆盖认证、错误恢复、停止收尾、重复注入、后台重启及弹窗状态，不消耗 Soniox 额度。

## 术语表

展开弹窗的 **Glossary**，勾选 **Use glossary**。每行一个原文词；如需指定译名，在原文后输入 Tab，再输入译名。例如 `VALORANT<Tab>无畏契约`（`<Tab>` 表示实际制表符）。可直接编辑、导入 UTF-8 TSV/TXT、导出；设置自动保存在本机，下次开始采集时生效。

如需使用 Tsuzuri / VALORANT 的 52 条日中术语，可通过 **Import .tsv or .txt** 导入 [tsuzuri-zh.tsv](extension/glossaries/tsuzuri-zh.tsv)。该术语表依据两场视频的自动字幕、标题和发布者简介整理，逐词来源及核对时间见 [术语表来源](docs/tsuzuri-glossary.csv)。译名可自行修改，不代表官方译名。

所有原文词发送为 Soniox `context.terms`；有译名的条目同时发送为 `context.translation_terms`。仅当 **Glossary translation language** 与 **Translate Into** 一致时发送译名，切换语言后仍保留原文识别提示。禁用时不发送 context。术语提示不会保证每次识别/翻译都命中。

最多 200 个不同原文词；冲突译名、超过两列和过大文件会提示错误。为低于 Soniox 8,000-token 限制，扩展保守地将序列化 context 限制在 7,500 UTF-8 字节。原始音频、视频元数据、字幕保存在被 Git 忽略的 `artifacts/audio/`，不打包进扩展。字幕转换脚本是 `python scripts/prepare_transcripts.py`。

本次素材：2026-09-25 [个人初配信](https://www.youtube.com/watch?v=M9sb87e-IVM)（59:20），以及 2026-09-27 [VALORANT 第一期](https://www.youtube.com/watch?v=8GlaHUbu95o)（2:49:34）。两段音频已转为 16 kHz 单声道 FLAC，并通过全长解码检查。TXT/SRT 来自 YouTube 日语自动字幕，未另外提交 Soniox 转录，也未逐句人工听校；原始字幕保留误识别，术语表则结合发布者简介纠正人名拼写。游戏角色日文拼写参考 [Riot 角色列表](https://playvalorant.com/ja-jp/agents/)。中文译名为此预设的可编辑建议，艺名和标签中无法确认中文名的条目保留原文。`セーブ→保枪` 等词适合这场游戏语境，观看其他内容时建议关闭或更换预设。

真实浏览器验收：

1. 在 `chrome://extensions/` 重新加载扩展，并刷新用于测试的视频页面。
2. 输入有效 API Key，开始采集；确认先显示连接中，收到服务端结果后显示运行中，原文和译文正常更新。
3. 讲话结束后立即点击停止，确认尾句能够补齐、标签页声音正常，弹窗恢复可启动状态；再次启动应清空上一轮字幕。
4. 用无效 Key 启动，应显示认证错误并释放采集；恢复有效 Key 后应能再次启动。
5. 在测试会话中断开网络再恢复，确认显示重连状态；连续失败达到重试上限后显示错误。关闭采集标签页后，重新打开弹窗应不再显示运行中。
