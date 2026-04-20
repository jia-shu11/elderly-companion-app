# Edge TTS API

一个基于FastAPI的文本转语音API服务，使用Microsoft Edge TTS引擎。

## 功能特性

- 🎤 支持多种语言和语音类型
- ⚡ 流式音频输出
- 🎵 可自定义语速和音调
- 📦 轻量级API服务
- 🎨 内置Web前端界面

## 安装依赖

```bash
pip install -r requirements.txt
```

## 快速开始

### 启动API服务

```bash
python tts.py
```

服务将在http://0.0.0.0:8000启动

### 使用Web界面

直接打开`index.html`文件即可使用可视化界面。

## API文档

### POST /tts

生成语音并返回MP3音频文件

**请求体**:
```json
{
    "text": "要转换的文本",
    "voice": "语音类型",
    "rate": "语速",
    "pitch": "音调"
}
```

**参数说明**:
- `text`: 必填，要转换的文本内容
- `voice`: 可选，语音类型，默认`zh-CN-XiaoxiaoNeural`
- `rate`: 可选，语速，默认`+0%`
- `pitch`: 可选，音调，默认`+0Hz`

**响应**:
- 返回MP3格式的音频文件

### 可用语音列表

#### 中文
- `zh-CN-XiaoxiaoNeural` - 女声
- `zh-CN-YunyangNeural` - 男声
- `zh-CN-YunxiNeural` - 男声
- `zh-CN-YunjianNeural` - 男声
- `zh-CN-YunhaoNeural` - 男声

#### 英文
- `en-US-AriaNeural` - 女声
- `en-US-GuyNeural` - 男声

## Swagger文档

访问http://localhost:8000/docs可查看完整的API文档并进行在线测试。

## 技术栈

- **FastAPI**: Web框架
- **Uvicorn**: ASGI服务器
- **Edge TTS**: 文本转语音引擎
- **Pydantic**: 数据验证

## 许可证

MIT