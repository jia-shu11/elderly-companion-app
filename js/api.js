// API配置
const API_URL = 'https://ithink.isapientia.com/api/app/utv/v1/agent/qa';
const UPLOAD_URL = 'https://ithink.isapientia.com/f/console/api/files/upload';
const TTS_URL = 'http://localhost:8000/tts'; // Edge TTS API

// 全局变量
let token = '';
let endUser = '';
let userId = '';
let uploadToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjY1ZTRlNjYtYmZmZS00NmY3LTk4YjctNDY1MDM3YTRkNTkwIiwiZXhwIjoxNzc2MjE5NDY3LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.cEZH0QH2VQhx4xOCkrG-ak4KEbSKZrAKKtwHv0mptb8';
let contextId = '';
let currentPersonality = 'old_friend'; // 当前角色性格：old_friend 或 xiaoban

// 从localStorage加载设置
function loadSettings() {
    const savedSettings = localStorage.getItem('chatSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        token = settings.token;
        endUser = settings.endUser;
        userId = settings.userId;
        uploadToken = settings.uploadToken;
    }
    // 清除可能存在的旧TTS设置缓存，确保使用角色固定的语音参数
    localStorage.removeItem('tts_voice');
    localStorage.removeItem('tts_rate');
    localStorage.removeItem('tts_pitch');
}

// 保存设置到localStorage
function saveSettingsToStorage(tokenVal, endUserVal, userIdVal, uploadTokenVal) {
    token = tokenVal;
    endUser = endUserVal;
    userId = userIdVal;
    uploadToken = uploadTokenVal;
    localStorage.setItem('chatSettings', JSON.stringify({ token, endUser, userId, uploadToken }));
}

// 获取设置
function getSettings() {
    return { token, endUser, userId, uploadToken };
}

// 生成上下文ID
function generateContextId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 发送消息到API
async function sendMessageToAPI(content, attachedFile = null) {
    // 检查Token
    if (!token) {
        throw new Error('请先设置智能体唯一标识');
    }

    if (!userId) {
        throw new Error('请先设置记忆标识');
    }

    if (!endUser) {
        throw new Error('请先设置用户名');
    }

    if (attachedFile && !uploadToken) {
        throw new Error('请先设置图片上传标识');
    }

    // 准备请求数据
    const requestData = {
        messages: [{ role: 'user', content }],
        inputs: {},
        context_id: contextId || generateContextId(),
    };

    if (endUser) {
        requestData.end_user = endUser;
    }

    if (userId) {
        requestData.inputs.USER_ID = userId;
    }

    // 添加角色性格字段
    requestData.inputs.select = currentPersonality;

    // 如果有附件，添加到inputs
    if (attachedFile) {
        requestData.inputs.BloodTest = {
            type: 'image',
            transfer_method: 'local_file',
            upload_file_id: attachedFile.fileId
        };
    }

    console.log('发送请求:', JSON.stringify(requestData, null, 2));

    // 发送请求
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error('HTTP错误响应:', errorBody);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorBody}`);
    }

    const result = await response.json();
    console.log('收到响应:', JSON.stringify(result, null, 2));

    // 更新上下文ID
    contextId = result.data.context_id || contextId;

    return result.data.answer;
}

// 上传图片
async function uploadImageToAPI(file) {
    if (!userId) {
        throw new Error('请先设置记忆标识');
    }

    if (!uploadToken) {
        throw new Error('请先设置图片上传标识');
    }

    // 创建FormData
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user', userId);

    // 上传图片
    const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${uploadToken}`
        },
        body: formData
    });

    if (!response.ok) {
        throw new Error(`上传失败: ${response.status}`);
    }

    const result = await response.json();
    return result.id;
}

// 重置对话
function resetContext() {
    contextId = generateContextId();
}

// 初始化
loadSettings();
loadPersonality();

// 设置角色性格
function setPersonality(personality) {
    if (personality === 'old_friend' || personality === 'xiaoban') {
        currentPersonality = personality;
        localStorage.setItem('currentPersonality', personality);
        return true;
    }
    return false;
}

// 获取当前角色性格
function getPersonality() {
    return currentPersonality;
}

// 初始化时加载角色性格
function loadPersonality() {
    const saved = localStorage.getItem('currentPersonality');
    if (saved && (saved === 'old_friend' || saved === 'xiaoban')) {
        currentPersonality = saved;
    }
}

// TTS 语音合成功能
async function textToSpeech(text, voice = 'zh-CN-XiaoxiaoNeural', rate = '+0%', pitch = '+0Hz') {
    try {
        const response = await fetch(TTS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                voice: voice,
                rate: rate,
                pitch: pitch
            })
        });

        if (!response.ok) {
            throw new Error(`TTS请求失败: ${response.status}`);
        }

        // 获取音频数据
        const audioBlob = await response.blob();
        
        // 创建音频URL并播放
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // 播放完成后清理
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };
        
        // 返回音频对象，允许外部控制
        return { audio, audioUrl };
    } catch (error) {
        console.error('TTS错误:', error);
        throw error;
    }
}

// 获取可用语音列表
async function getAvailableVoices() {
    const voices = [
        { id: 'zh-CN-XiaoxiaoNeural', name: '晓晓', gender: 'female', language: '中文' },
        { id: 'zh-CN-YunyangNeural', name: '云扬', gender: 'male', language: '中文' },
        { id: 'zh-CN-YunxiNeural', name: '云希', gender: 'male', language: '中文' },
        { id: 'zh-CN-YunjianNeural', name: '云健', gender: 'male', language: '中文' },
        { id: 'zh-CN-YunhaoNeural', name: '云昊', gender: 'male', language: '中文' },
        { id: 'en-US-AriaNeural', name: 'Aria', gender: 'female', language: '英文' },
        { id: 'en-US-GuyNeural', name: 'Guy', gender: 'male', language: '英文' }
    ];
    return voices;
}

// 导出函数
window.AIHealthAPI = {
    sendMessage: sendMessageToAPI,
    uploadImage: uploadImageToAPI,
    saveSettings: saveSettingsToStorage,
    getSettings: getSettings,
    resetContext: resetContext,
    loadSettings: loadSettings,
    setPersonality: setPersonality,
    getPersonality: getPersonality,
    loadPersonality: loadPersonality,
    textToSpeech: textToSpeech,
    getAvailableVoices: getAvailableVoices
};