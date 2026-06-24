// PoseCam 交互原型 - 核心用户旅程模拟

const app = document.getElementById('app');

let state = {
    mode: 'couple',
    scene: 'cafe',
    pose: 'lean'
};

const modes = [
    { id: 'couple', emoji: '💑', title: '情侣模式', desc: '约会、旅行、纪念日' },
    { id: 'friends', emoji: '👯', title: '闺蜜模式', desc: '探店、Citywalk、聚会' },
    { id: 'family', emoji: '👨‍👩‍👧', title: '亲子模式', desc: '公园、旅行、成长记录' }
];

const scenes = [
    { id: 'cafe', emoji: '☕', label: '咖啡馆' },
    { id: 'beach', emoji: '🏖️', label: '海边' },
    { id: 'exhibition', emoji: '🖼️', label: '展览' },
    { id: 'park', emoji: '🌳', label: '公园' },
    { id: 'indoor', emoji: '🛋️', label: '室内' },
    { id: 'street', emoji: '🏙️', label: '街拍' }
];

const poses = {
    couple: [
        { id: 'lean', icon: '💑', name: '侧身依靠', advice: '让人物靠在窗边或墙边，身体形成自然斜线' },
        { id: 'back', icon: '🚶', name: '回眸一笑', advice: '背对镜头走两步，听到提示后自然回头' },
        { id: 'hand', icon: '🤝', name: '牵手对视', advice: '两人牵手站立，眼神自然交流，不要看镜头' },
        { id: 'shoulder', icon: '🫂', name: '搭肩依偎', advice: '一方搭肩，身体轻微倾斜，营造亲密感' },
        { id: 'walk', icon: '🚶‍♀️', name: '并肩漫步', advice: '两人自然并肩走，抓拍动态瞬间' },
        { id: 'sit', icon: '🪑', name: '坐姿互动', advice: '坐姿时腿往前伸，上半身保持挺拔' }
    ],
    friends: [
        { id: 'lean', icon: '👯', name: '并排靠肩', advice: '肩膀轻靠，头部可以一高一低增加层次' },
        { id: 'back', icon: '🙆', name: '回头比耶', advice: '背对镜头回头，手势自然不僵硬' },
        { id: 'hand', icon: '🤳', name: '对镜自拍', advice: '两人把手机举高，脸往中间靠拢' },
        { id: 'shoulder', icon: '🫂', name: '搂肩大笑', advice: '互相搂肩，表情放松大笑' },
        { id: 'walk', icon: '🚶', name: '牵手走路', advice: '牵手向前走，抓拍背影或侧脸' },
        { id: 'sit', icon: '🪑', name: '咖啡桌旁', advice: '围坐桌边，利用咖啡杯做道具' }
    ],
    family: [
        { id: 'lean', icon: '👨‍👩‍👧', name: '亲子依偎', advice: '家长侧身半蹲，与孩子保持同一高度' },
        { id: 'back', icon: '🏃', name: '奔跑回头', advice: '孩子向前跑，听到名字回头，抓拍自然表情' },
        { id: 'hand', icon: '✋', name: '挥手互动', advice: '孩子向镜头挥手，家长在一旁微笑' },
        { id: 'shoulder', icon: '🫂', name: '抱起孩子', advice: '抱起时让孩子脸朝向光源' },
        { id: 'walk', icon: '🚶', name: '牵手散步', advice: '大手牵小手，步伐放慢方便抓拍' },
        { id: 'sit', icon: '🪑', name: '草地坐姿', advice: '坐在草地上，家长手臂自然环绕孩子' }
    ]
};

const dialogues = {
    cafe: [
        '你靠在那个窗边，头稍微歪一点，对，光线打在脸上很好看。',
        '把咖啡杯举起来，眼神看一下窗外，不要看镜头。',
        '身体往前倾一点，这样显得脸更小，肩膀也自然。',
        '笑一下，想象一下我刚才说的那个梗。'
    ],
    beach: [
        '海风把头发吹起来特别自然，你侧一点脸。',
        '往海边走两步，然后回头看我，不要停。',
        '手轻轻拨一下头发，对，就是那个感觉。',
        '这个光线特别好，保持这个姿势，三二一。'
    ],
    exhibition: [
        '你和那幅画站成对角线，人物放在画面右边。',
        '侧身看画，我抓拍一个自然的眼神。',
        '往前走一步，让头顶留一点空间给天花板。',
        '这个角度很有艺术感，别动，再来一张。'
    ],
    park: [
        '站在那棵树旁边，人和树形成一个呼应。',
        '你抬头看树叶，我拍一个侧脸轮廓。',
        '坐在长椅边上，腿往前伸，这样会显得腿长。',
        '逆光很美，你稍微转一下头，让光打在脸上。'
    ],
    indoor: [
        '靠在沙发上，手自然搭在扶手上，放松。',
        '脸转向窗户那边，让自然光打亮半边脸。',
        '眼睛看镜头上方一点，这样显得更有神。',
        '这个居家氛围很好，笑一下就像平时一样。'
    ],
    street: [
        '你往前走，我喊你的时候再回头。',
        '站在那个招牌下面，人放在画面左边。',
        '手插口袋，肩膀放松，对，很自然。',
        '这个背景虚化会很好看，保持三秒钟。'
    ]
};

const focalHints = {
    cafe: '建议焦段：2x 半身特写',
    beach: '建议焦段：1x 环境人像',
    exhibition: '建议焦段：1x 人画互动',
    park: '建议焦段：2x 半身/特写',
    indoor: '建议焦段：1.5x 生活感',
    street: '建议焦段：1x 环境人像'
};

// 渲染启动页
function renderSplash() {
    return `
        <div class="screen splash active" id="splash">
            <div class="logo">📸</div>
            <h1>PoseCam</h1>
            <p>让每个人都能拍出「有情绪、有构图、有故事」的人像照片</p>
            <button class="btn-primary" onclick="goToMode()">开始体验</button>
        </div>
    `;
}

// 渲染模式选择
function renderModeSelect() {
    const modeButtons = modes.map(m => `
        <button class="btn-secondary ${state.mode === m.id ? 'selected' : ''}" onclick="selectMode('${m.id}')">
            <span class="icon">${m.emoji}</span>
            <span class="info">
                <div class="title">${m.title}</div>
                <div class="desc">${m.desc}</div>
            </span>
        </button>
    `).join('');

    return `
        <div class="screen" id="mode">
            <div class="header">
                <div class="header-row">
                    <button class="back-btn" onclick="goToSplash()">&lt;</button>
                    <h2>选择拍摄模式</h2>
                </div>
                <p>PoseCam 会针对不同的关系场景优化引导方式</p>
            </div>
            ${modeButtons}
            <button class="btn-primary" style="margin-top: auto;" onclick="goToScene()">下一步</button>
        </div>
    `;
}

// 渲染场景选择
function renderSceneSelect() {
    const sceneGrid = scenes.map(s => `
        <div class="grid-item ${state.scene === s.id ? 'selected' : ''}" onclick="selectScene('${s.id}')">
            <span class="emoji">${s.emoji}</span>
            <span class="label">${s.label}</span>
        </div>
    `).join('');

    return `
        <div class="screen" id="scene">
            <div class="header">
                <div class="header-row">
                    <button class="back-btn" onclick="goToMode()">&lt;</button>
                    <h2>选择场景</h2>
                </div>
                <p>AI 会根据当前场景和镜头画面提供专业拍摄指导</p>
            </div>
            <div class="grid">
                ${sceneGrid}
            </div>
            <button class="btn-primary" style="margin-top: auto;" onclick="goToViewfinder()">进入取景器</button>
        </div>
    `;
}

// 渲染取景器
function renderViewfinder() {
    const modeLabels = { couple: '情侣模式', friends: '闺蜜模式', family: '亲子模式' };
    const sceneLabels = { cafe: '咖啡馆', beach: '海边', exhibition: '展览', park: '公园', indoor: '室内', street: '街拍' };
    const dialoguesForScene = dialogues[state.scene];
    const currentDialogue = dialoguesForScene[Math.floor(Math.random() * dialoguesForScene.length)];
    const currentPose = poses[state.mode].find(p => p.id === state.pose) || poses[state.mode][0];
    const poseSuggestions = poses[state.mode].map(p => `
        <div class="pose-chip ${state.pose === p.id ? 'active' : ''}" onclick="selectPose('${p.id}')">
            <span class="chip-icon">${p.icon}</span>
            <span class="chip-name">${p.name}</span>
        </div>
    `).join('');

    return `
        <div class="screen viewfinder" id="viewfinder">
            <div class="camera-preview"></div>
            <div class="composition-grid"></div>
            <div class="pose-overlay"></div>
            
            <div class="top-bar">
                <button class="icon-btn back-arrow" onclick="goToScene()">&lt;</button>
                <div class="mode-tag">${modeLabels[state.mode]} · ${sceneLabels[state.scene]}</div>
                <button class="icon-btn">⚙️</button>
            </div>
            
            <div class="focal-hint">${focalHints[state.scene]}</div>
            
            <div class="pose-suggestion-panel">
                <div class="panel-header">
                    <span class="panel-title">📸 姿势建议</span>
                    <span class="panel-subtitle">根据场景推荐</span>
                </div>
                <div class="pose-chips">
                    ${poseSuggestions}
                </div>
                <div class="pose-advice">
                    ${currentPose.advice}
                </div>
            </div>
            
            <div class="dialogue-box">
                <div class="label">💬 话术锦囊</div>
                <div class="text">${currentDialogue}</div>
            </div>
            
            <div class="bottom-controls">
                <div class="shutter-row">
                    <button class="side-btn">🖼️</button>
                    <button class="shutter-btn" onclick="takePhoto()"></button>
                    <button class="side-btn">🔄</button>
                </div>
                <div class="pose-match">姿势匹配度：78% · 再靠近轮廓一点</div>
            </div>
        </div>
    `;
}

// 渲染点评页
function renderReview() {
    return `
        <div class="screen" id="review">
            <div class="header">
                <h2>AI 拍摄点评</h2>
                <p>看看这张照片哪里好，哪里还能改进</p>
            </div>
            
            <div class="review-photo">📸</div>
            
            <div class="score-card">
                <div class="score-item">
                    <div class="stars">★★★★<span class="dim">★</span></div>
                    <div class="label">构图</div>
                </div>
                <div class="score-item">
                    <div class="stars">★★★<span class="dim">★★</span></div>
                    <div class="label">姿势</div>
                </div>
                <div class="score-item">
                    <div class="stars">★★★★<span class="dim">★</span></div>
                    <div class="label">光线</div>
                </div>
            </div>
            
            <div class="feedback-list">
                <h4>改进建议</h4>
                <li>人物头部放在画面上三分之一处会更舒服</li>
                <li>肩膀稍微打开一点，不要缩着</li>
                <li>光线很好，侧脸轮廓清晰</li>
                <li>整体氛围到位，表情自然</li>
            </div>
            
            <div class="action-row">
                <button class="btn-secondary" onclick="goToViewfinder()">再拍一张</button>
                <button class="btn-primary">保存分享</button>
            </div>
        </div>
    `;
}

// 初始化
function init() {
    app.innerHTML = renderSplash() + renderModeSelect() + renderSceneSelect() + renderViewfinder() + renderReview();
}

// 导航函数
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function goToSplash() { showScreen('splash'); }
function goToMode() { showScreen('mode'); }
function goToScene() { showScreen('scene'); }
function goToViewfinder() { showScreen('viewfinder'); }
function takePhoto() { showScreen('review'); }

function selectMode(id) {
    state.mode = id;
    document.querySelectorAll('#mode .btn-secondary').forEach((btn, idx) => {
        btn.classList.toggle('selected', modes[idx].id === id);
    });
}

function selectScene(id) {
    state.scene = id;
    document.querySelectorAll('#scene .grid-item').forEach((item, idx) => {
        item.classList.toggle('selected', scenes[idx].id === id);
    });
}

function selectPose(id) {
    state.pose = id;
    // 重新渲染 viewfinder 以更新姿势建议和 AR 轮廓
    const viewfinder = document.getElementById('viewfinder');
    viewfinder.outerHTML = renderViewfinder();
    showScreen('viewfinder');
}

// 启动
init();
