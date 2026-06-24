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
        { id: 'lean', icon: '💑', name: '侧身依靠' },
        { id: 'back', icon: '🚶', name: '回眸一笑' },
        { id: 'hand', icon: '🤝', name: '牵手对视' },
        { id: 'shoulder', icon: '🫂', name: '搭肩依偎' },
        { id: 'walk', icon: '🚶‍♀️', name: '并肩漫步' },
        { id: 'sit', icon: '🪑', name: '坐姿互动' }
    ],
    friends: [
        { id: 'lean', icon: '👯', name: '并排靠肩' },
        { id: 'back', icon: '🙆', name: '回头比耶' },
        { id: 'hand', icon: '🤳', name: '对镜自拍' },
        { id: 'shoulder', icon: '🫂', name: '搂肩大笑' },
        { id: 'walk', icon: '🚶', name: '牵手走路' },
        { id: 'sit', icon: '🪑', name: '咖啡桌旁' }
    ],
    family: [
        { id: 'lean', icon: '👨‍👩‍👧', name: '亲子依偎' },
        { id: 'back', icon: '🏃', name: '奔跑回头' },
        { id: 'hand', icon: '✋', name: '挥手互动' },
        { id: 'shoulder', icon: '🫂', name: '抱起孩子' },
        { id: 'walk', icon: '🚶', name: '牵手散步' },
        { id: 'sit', icon: '🪑', name: '草地坐姿' }
    ]
};

const dialogues = {
    cafe: [
        '"你靠在那个窗边，头稍微歪一点，对，光线打在脸上很好看。"',
        '"把咖啡杯举起来，眼神看一下窗外，不要看镜头。"',
        '"身体往前倾一点，这样显得脸更小，肩膀也自然。"',
        '"笑一下，想象一下我刚才说的那个梗。"'
    ],
    beach: [
        '"海风把头发吹起来特别自然，你侧一点脸。"',
        '"往海边走两步，然后回头看我，不要停。"',
        '"手轻轻拨一下头发，对，就是那个感觉。"',
        '"这个光线特别好，保持这个姿势，三二一。"'
    ],
    exhibition: [
        '"你和那幅画站成对角线，人物放在画面右边。"',
        '"侧身看画，我抓拍一个自然的眼神。"',
        '"往前走一步，让头顶留一点空间给天花板。"',
        '"这个角度很有艺术感，别动，再来一张。"'
    ],
    park: [
        '"站在那棵树旁边，人和树形成一个呼应。"',
        '"你抬头看树叶，我拍一个侧脸轮廓。"',
        '"坐在长椅边上，腿往前伸，这样会显得腿长。"',
        '"逆光很美，你稍微转一下头，让光打在脸上。"'
    ],
    indoor: [
        '"靠在沙发上，手自然搭在扶手上，放松。"',
        '"脸转向窗户那边，让自然光打亮半边脸。"',
        '"眼睛看镜头上方一点，这样显得更有神。"',
        '"这个居家氛围很好，笑一下就像平时一样。"'
    ],
    street: [
        '"你往前走，我喊你的时候再回头。"',
        '"站在那个招牌下面，人放在画面左边。"',
        '"手插口袋，肩膀放松，对，很自然。"',
        '"这个背景虚化会很好看，保持三秒钟。"'
    ]
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
                <h2>选择拍摄模式</h2>
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
                <h2>选择场景</h2>
                <p>AI 会根据场景推荐最佳姿势和构图</p>
            </div>
            <div class="grid">
                ${sceneGrid}
            </div>
            <button class="btn-primary" style="margin-top: auto;" onclick="goToPose()">下一步</button>
        </div>
    `;
}

// 渲染姿势选择
function renderPoseSelect() {
    const poseCards = poses[state.mode].map(p => `
        <div class="template-card ${state.pose === p.id ? 'selected' : ''}" onclick="selectPose('${p.id}')">
            <span class="pose-icon">${p.icon}</span>
            <span class="pose-name">${p.name}</span>
        </div>
    `).join('');

    return `
        <div class="screen" id="pose">
            <div class="header">
                <h2>选择姿势模板</h2>
                <p>选择一个参考姿势，拍摄时会有 AR 引导线</p>
            </div>
            <div class="template-list">
                ${poseCards}
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

    return `
        <div class="screen viewfinder" id="viewfinder">
            <div class="camera-preview"></div>
            <div class="composition-grid"></div>
            <div class="pose-overlay"></div>
            
            <div class="top-bar">
                <button class="icon-btn" onclick="goToPose()">✕</button>
                <div class="mode-tag">${modeLabels[state.mode]} · ${sceneLabels[state.scene]}</div>
                <button class="icon-btn">⚙️</button>
            </div>
            
            <div class="focal-hint">建议焦段：2x 半身</div>
            
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
    app.innerHTML = renderSplash() + renderModeSelect() + renderSceneSelect() + renderPoseSelect() + renderViewfinder() + renderReview();
}

// 导航函数
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function goToMode() { showScreen('mode'); }
function goToScene() { showScreen('scene'); }
function goToPose() { renderPoseCards(); showScreen('pose'); }
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
    document.querySelectorAll('#pose .template-card').forEach(card => {
        card.classList.toggle('selected', card.onclick.toString().includes(id));
    });
}

function renderPoseCards() {
    // 重新渲染姿势选择页面
    const poseScreen = document.getElementById('pose');
    poseScreen.outerHTML = renderPoseSelect();
}

// 启动
init();
