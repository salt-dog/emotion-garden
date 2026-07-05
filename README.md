# 情绪花园本地 Demo v2

这是一个纯前端本地 demo。它没有接入真实后端和 AI API，当前使用 mock 逻辑模拟对话、开花、推荐作品和记忆保存。

## 运行方式

方式一：直接双击 `index.html`。

方式二：在本文件夹打开终端，运行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 功能流程

1. 进入主页，看到横屏温室场景。
2. 点击左侧花架，进入“记忆区”。
3. 点击右侧园艺台，进入“交互区”。
4. 交互区中，用户可以持续输入。植物阶段为：空花盆 pot → 播种 seed → 花苞 bud → 浇水 water → 花苞 bud → 浇水 water 循环。
5. 从第二轮输入后，页面会出现“整理成花”按钮。用户仍然可以继续输入，也可以主动开花。
6. 点击“整理成花”后，进入百合花 flower 状态并显示推荐作品卡片。
7. 用户确认看完后，记忆被保存到 localStorage，花回到花架，页面返回主页。
8. 主页花架根据记忆数量显示不同差分素材，超过三朵仍显示三朵状态。

## 素材替换说明

请保持下面这些文件路径和文件名不变，直接用正式素材覆盖占位图即可。

```text
assets/home/greenhouse-bg.png
主页横屏温室背景，只含空花架底图。

assets/home/shelf-state-0.png
主页左侧空花架透明差分素材。

assets/home/shelf-state-1.png
主页左侧一盆花状态透明差分素材。

assets/home/shelf-state-2.png
主页左侧两盆花状态透明差分素材。

assets/home/shelf-state-3.png
主页左侧三盆花状态透明差分素材。

assets/memory/memory-shelf-bg.png
记忆区完整花架特写背景。

assets/memory/lily-card-flower.png
有贺卡的百合花记忆素材。

assets/interaction/workbench-bg.png
交互区完整园艺工作台全屏背景。

assets/interaction/pot.png
空花盆阶段。

assets/interaction/seed.png
播种阶段。

assets/interaction/bud.png
发芽并出现花苞阶段。

assets/interaction/water.png
花苞浇水阶段。

assets/interaction/flower-lily.png
百合花开花阶段。
```

## 占位素材尺寸建议

主页和交互区背景建议使用 16:9 横屏，例如 1920×1080。

主页花架差分素材建议使用 1920×1080 透明 PNG，与 `greenhouse-bg.png` 完全对齐。

植物阶段素材建议使用透明 PNG，比例可以为 4:5 或接近竖图，代码会自动 `object-fit: contain`。

记忆花素材建议使用透明 PNG，比例可以为 4:5。

## 以后接后端时的接口方向

当前 mock 逻辑集中在 `app.js` 中的这些函数：

- `mockAssistantResponse()`：模拟 AI 对话回复和植物阶段推进。
- `buildRecommendationDraft()`：模拟生成推荐作品和记忆草稿。
- `completeInteraction()`：模拟保存记忆。

正式接后端时，可以把这些函数替换成真实接口：

```text
POST /api/sessions
POST /api/sessions/{session_id}/messages
POST /api/sessions/{session_id}/bloom
POST /api/sessions/{session_id}/complete
GET  /api/memories
```
