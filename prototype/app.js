// PoseCam 交互原型 - 核心用户旅程模拟

const app = document.getElementById('app');

let state = {
    mode: 'couple',
    scene: 'cafe',
    guideIndex: 0
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

const photographerGuides = {
    couple: {
        cafe: [
            { pose: '侧身依靠', advice: '利用窗边侧光，让模特侧身站立，脸部转向光源，轮廓会更柔和。', focal: '2x', line: '你靠在那个窗边，头稍微歪一点，对，这个光线打在脸上很好看。' },
            { pose: '牵手对视', advice: '两人坐对角线位置，手自然牵在一起，不要正对镜头。', focal: '1x', line: '你们俩牵手坐那边，眼神自然交流，不要看镜头，我抓拍。' },
            { pose: '坐姿互动', advice: '利用咖啡桌做前景，增加画面层次感。', focal: '1.5x', line: '把咖啡杯举起来，身体往前倾一点，这样显得脸更小。' }
        ],
        beach: [
            { pose: '回眸一笑', advice: '逆光拍摄，让海平面保持在画面下方三分之一。', focal: '1x', line: '往海边走两步，然后回头看我，不要停，海风把头发吹起来特别自然。' },
            { pose: '并肩漫步', advice: '低角度拍摄，突出天空和海面。', focal: '1x', line: '你们俩并肩慢慢走，我数到三同时回头看。' },
            { pose: '侧身依靠', advice: '让模特靠在礁石或栏杆上，避免正面直拍。', focal: '2x', line: '靠在那个栏杆上，侧一点脸，逆光轮廓会很好看。' }
        ],
        exhibition: [
            { pose: '侧身依靠', advice: '人物与画作形成对角线，头顶预留空间。', focal: '1x', line: '你和那幅画站成对角线，人物放在画面右边。' },
            { pose: '回眸一笑', advice: '利用展厅顶光，模特回头时脸部受光均匀。', focal: '2x', line: '往前走一步，然后回头看我，光线正好打在脸上。' },
            { pose: '坐姿互动', advice: '坐在展厅长椅上，以作品为背景。', focal: '1.5x', line: '坐在长椅边上，腿往前伸，背景那幅画刚好做衬托。' }
        ],
        park: [
            { pose: '侧身依靠', advice: '以树干为视觉支撑点，人物放在画面一侧。', focal: '2x', line: '站在那棵树旁边，人和树形成一个呼应。' },
            { pose: '并肩漫步', advice: '林荫道纵深感强，适合抓拍动态。', focal: '1x', line: '你们俩牵手沿着小路走，我喊你们的时候自然回头。' },
            { pose: '坐姿互动', advice: '逆光拍摄，让树叶光斑做背景。', focal: '1.5x', line: '坐在草地上，头稍微抬一点，逆光会让头发发光。' }
        ],
        indoor: [
            { pose: '坐姿互动', advice: '靠近窗户利用自然光，避免顶光直射。', focal: '1.5x', line: '靠在沙发上，脸转向窗户那边，让自然光打亮半边脸。' },
            { pose: '侧身依靠', advice: '用门框或墙角做引导线。', focal: '2x', line: '靠在门框边上，身体形成一个斜线，画面会更有层次。' },
            { pose: '牵手对视', advice: '两人保持一前一后，增加画面纵深。', focal: '1x', line: '你站在前面一点，ta 在后面看着你，这样有层次感。' }
        ],
        street: [
            { pose: '并肩漫步', advice: '利用街道延伸线，人物放在画面下方三分之一。', focal: '1x', line: '你们俩往前走，我喊你的时候再回头，街道线条会引导视线。' },
            { pose: '回眸一笑', advice: '以店铺招牌为背景，增加城市氛围。', focal: '2x', line: '站在那个招牌下面，背对我，回头的时候笑一下。' },
            { pose: '侧身依靠', advice: '找一面有纹理的墙做背景。', focal: '2x', line: '靠在那面墙上，手插口袋，肩膀放松。' }
        ]
    },
    friends: {
        cafe: [
            { pose: '并排靠肩', advice: '两人肩膀轻靠，头部一高一低增加层次。', focal: '1x', line: '你们俩肩膀靠一起，头一高一低，不要站得太整齐。' },
            { pose: '对镜自拍', advice: '手机举高，两人脸往中间靠拢。', focal: '0.5x', line: '把手机举高一点，你们俩脸往中间靠，对，就是这个感觉。' },
            { pose: '咖啡桌旁', advice: '利用咖啡杯做道具，手自然摆放。', focal: '1x', line: '围着桌子坐，手自然搭在杯子上，不要都看着镜头。' }
        ],
        beach: [
            { pose: '搂肩大笑', advice: '逆光拍摄，两人侧身对镜头。', focal: '1x', line: '互相搂着肩膀，大笑一下，逆光会让你们头发发光。' },
            { pose: '并排靠肩', advice: '海平面做背景，人物放在画面中间偏下。', focal: '1x', line: '并排站，一人看镜头一人看旁边，这样更自然。' },
            { pose: '牵手走路', advice: '抓拍背影，低角度突出天空。', focal: '1x', line: '你们俩牵手往海边走，我拍你们背影。' }
        ],
        exhibition: [
            { pose: '并排靠肩', advice: '与画作平行站立，保持适当间距。', focal: '1x', line: '并排站在画前面，但不要靠得太近，留出呼吸感。' },
            { pose: '咖啡桌旁', advice: '展厅休息区，以艺术装置为背景。', focal: '1.5x', line: '坐在休息区，背后是那个装置，姿态放松一点。' },
            { pose: '对镜自拍', advice: '利用展厅镜子，拍出空间感。', focal: '0.5x', line: '对着镜子自拍，把展厅空间也拍进去。' }
        ],
        park: [
            { pose: '并排靠肩', advice: '以大树为背景，两人分站画面两侧。', focal: '1x', line: '你们俩分站两边，中间留出空间给那棵树。' },
            { pose: '牵手走路', advice: '林荫小路纵深感强。', focal: '1x', line: '牵手往前走，步伐慢一点，我抓拍。' },
            { pose: '咖啡桌旁', advice: '公园长椅坐姿，腿往前伸显腿长。', focal: '1.5x', line: '坐在长椅上，腿往前伸，上半身保持挺拔。' }
        ],
        indoor: [
            { pose: '并排靠肩', advice: '沙发或地毯上，姿态放松。', focal: '1x', line: '你们俩靠在一起，就像平时聊天一样，不要绷着。' },
            { pose: '对镜自拍', advice: '利用镜子反射增加趣味。', focal: '0.5x', line: '对着镜子拍，一个人看镜子一个人看镜头。' },
            { pose: '牵手走路', advice: '在室内走廊或窗边抓拍。', focal: '1x', line: '从窗边往里面走，自然互动，不要刻意摆。' }
        ],
        street: [
            { pose: '并排靠肩', advice: '利用街景做背景，人物放在画面一侧。', focal: '1x', line: '靠在墙边并排站，一个人酷一点一个人笑一点。' },
            { pose: '牵手走路', advice: '斑马线或街道线条引导视线。', focal: '1x', line: '过马路的时候牵手走，注意安全，我抓拍自然瞬间。' },
            { pose: '咖啡桌旁', advice: '街边咖啡馆外摆区。', focal: '1.5x', line: '坐在街边，背后是来往的人群，会很有生活感。' }
        ]
    },
    family: {
        cafe: [
            { pose: '亲子依偎', advice: '家长半蹲与孩子同高，脸朝向光源。', focal: '1x', line: '你蹲下来和宝宝一样高，脸转向窗户那边。' },
            { pose: '咖啡桌旁', advice: '利用桌子和杯子做互动道具。', focal: '1.5x', line: '宝宝拿着杯子，你在旁边看着他，自然互动。' },
            { pose: '亲子依偎', advice: '窗边坐姿，家长手臂环绕孩子。', focal: '1x', line: '坐在窗边，手臂轻轻环绕宝宝，对，很温馨。' }
        ],
        beach: [
            { pose: '奔跑回头', advice: '低角度抓拍，突出孩子和天空。', focal: '1x', line: '宝宝往前跑，你叫他名字，他回头的时候笑一下。' },
            { pose: '亲子依偎', advice: '逆光拍摄，家长抱起孩子。', focal: '1x', line: '把宝宝抱起来，逆光会让你们俩轮廓很好看。' },
            { pose: '牵手散步', advice: '沿着海岸线走，抓拍背影。', focal: '1x', line: '你们俩牵手沿着海边走，慢一点，我拍背影。' }
        ],
        exhibition: [
            { pose: '亲子依偎', advice: '在作品前蹲下与孩子同高。', focal: '1x', line: '蹲在宝宝旁边，一起看那幅画，我抓拍侧脸。' },
            { pose: '奔跑回头', advice: '展厅空间宽敞，适合抓拍动态。', focal: '1x', line: '让宝宝在前面走，你喊他回头，自然一点。' },
            { pose: '牵手散步', advice: '以展厅作品为背景，保持自然。', focal: '1x', line: '牵着宝宝的手慢慢走，不要看镜头，看前面的画。' }
        ],
        park: [
            { pose: '亲子依偎', advice: '草地坐姿，家长手臂环绕孩子。', focal: '1x', line: '坐在草地上，手臂轻轻环绕宝宝，脸转向我这边。' },
            { pose: '奔跑回头', advice: '空旷草地适合抓拍动态。', focal: '1x', line: '让宝宝往前跑几步，回头的时候挥手。' },
            { pose: '牵手散步', advice: '林荫小路，自然抓拍。', focal: '1x', line: '牵着宝宝的手慢慢走，边走边说话，我抓拍。' }
        ],
        indoor: [
            { pose: '亲子依偎', advice: '沙发或地毯上，利用窗户自然光。', focal: '1x', line: '坐在地毯上，脸转向窗户，宝宝靠在你身上。' },
            { pose: '咖啡桌旁', advice: '以餐桌或游戏桌做互动场景。', focal: '1.5x', line: '你们俩一起玩桌上的东西，不要看镜头，自然互动。' },
            { pose: '奔跑回头', advice: '客厅或走廊抓拍动态。', focal: '1x', line: '让宝宝往你这边跑，张开手臂迎接他。' }
        ],
        street: [
            { pose: '亲子依偎', advice: '街边安全区域，以建筑为背景。', focal: '1x', line: '站在那家店门口，你蹲下来搂着宝宝。' },
            { pose: '牵手散步', advice: '人行道边走边拍，注意安全。', focal: '1x', line: '牵着宝宝的手慢慢走，我在旁边抓拍。' },
            { pose: '奔跑回头', advice: '选择人少安全的街道抓拍。', focal: '1x', line: '让宝宝往前面跑几步，回头的时候笑。' }
        ]
    }
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

// 获取当前 AI 摄影师建议
function getCurrentGuide() {
    const guides = photographerGuides[state.mode][state.scene] || photographerGuides.couple.cafe;
    return guides[state.guideIndex % guides.length];
}

// 渲染取景器
function renderViewfinder() {
    const modeLabels = { couple: '情侣模式', friends: '闺蜜模式', family: '亲子模式' };
    const sceneLabels = { cafe: '咖啡馆', beach: '海边', exhibition: '展览', park: '公园', indoor: '室内', street: '街拍' };
    const guide = getCurrentGuide();

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
            
            <div class="focal-hint">建议焦段：${guide.focal}</div>
            
            <div class="ai-photographer-panel">
                <div class="panel-header">
                    <span class="panel-title">🧠 AI 摄影师</span>
                    <button class="refresh-btn" onclick="nextGuide()">换一组</button>
                </div>
                <div class="guide-pose">${guide.pose}</div>
                <div class="guide-advice">${guide.advice}</div>
            </div>
            
            <div class="dialogue-box">
                <div class="label">💬 话术锦囊</div>
                <div class="text">${guide.line}</div>
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

function nextGuide() {
    const guides = photographerGuides[state.mode][state.scene] || photographerGuides.couple.cafe;
    state.guideIndex = (state.guideIndex + 1) % guides.length;
    const viewfinder = document.getElementById('viewfinder');
    viewfinder.outerHTML = renderViewfinder();
    showScreen('viewfinder');
}

// 启动
init();
