// ====== 1. 素材とレシピのデータ設定 ======

const elementsData = {
    'air': { name: 'Air', image: './images/air.png' },
    'earth': { name: 'Earth', image: './images/earth.png' },
    'fire': { name: 'Fire', image: './images/Fire.png' },
    'water': { name: 'Water', image: './images/Water.png' },
    
    'energy': { name: 'Energy', image: './images/energy.png' },
    'mud': { name: 'Mud', image: './images/mud.png' }
};

// 合成レシピ（id同士をカンマ区切りで指定、順不同で機能します）
const recipes = {
    'air,fire': 'energy',
    'earth,water': 'mud'
};


// ====== 2. ゲームの状態管理 ======

// 初期素材（Air, Water, Earth, Fire）
let unlockedElements = ['air', 'earth', 'fire', 'water'];

const board = document.getElementById('board');
const sidebar = document.getElementById('sidebar');

let activeDragEl = null;
let offsetX = 0;
let offsetY = 0;

// ====== 3. 初期化とUI描画 ======

function init() {
    renderSidebar();
}

// 右側の素材リストを描画する（abc順）
function renderSidebar() {
    sidebar.innerHTML = '';
    
    // ABC順にソート
    const sortedElements = [...unlockedElements].sort((a, b) => 
        elementsData[a].name.localeCompare(elementsData[b].name)
    );

    sortedElements.forEach(id => {
        const el = document.createElement('div');
        el.className = 'element-base sidebar-element';
        el.dataset.id = id;
        
        // HTML構造（画像と名前）
        el.innerHTML = `
            <img src="${elementsData[id].image}" alt="${elementsData[id].name}" onerror="this.style.opacity=0">
            <span>${elementsData[id].name}</span>
        `;

        el.addEventListener('pointerdown', (e) => startDragFromSidebar(e, id));
        sidebar.appendChild(el);
    });
}


// ====== 4. ドラッグ＆ドロップ制御 ======

// サイドバーからドラッグを開始したとき（ボード上に複製を生成）
function startDragFromSidebar(e, id) {
    const newEl = createBoardElement(id, e.clientX, e.clientY);
    startDragging(e, newEl);
}

// ボード上に素材の要素を作成する（ダブルタップ判定もここ）
function createBoardElement(id, x, y) {
    const el = document.createElement('div');
    el.className = 'element-base board-element';
    el.dataset.id = id;
    el.innerHTML = `
        <img src="${elementsData[id].image}" alt="${elementsData[id].name}" onerror="this.style.opacity=0">
        <span>${elementsData[id].name}</span>
    `;

    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    board.appendChild(el);

    // ダブルタップで複製する処理
    let lastTapTime = 0;
    el.addEventListener('pointerdown', (e) => {
        const currentTime = new Date().getTime();
        const tapLength = currentTime - lastTapTime;
        
        if (tapLength < 300 && tapLength > 0) {
            // 300ms以内の連続タップなら少しずらして複製
            createBoardElement(id, x + 20, y + 20);
            e.preventDefault();
            return;
        }
        lastTapTime = currentTime;
        startDragging(e, el);
    });

    return el;
}

// ドラッグ処理開始
function startDragging(e, el) {
    activeDragEl = el;
    const rect = el.getBoundingClientRect();
    
    // カーソルと要素の中心のズレを計算
    offsetX = e.clientX - (rect.left + rect.width / 2);
    offsetY = e.clientY - (rect.top + rect.height / 2);
    
    el.style.zIndex = 1000; // 最前面へ

    document.addEventListener('pointermove', onDrag);
    document.addEventListener('pointerup', stopDragging);
}

// ドラッグ中（座標の更新）
function onDrag(e) {
    if (!activeDragEl) return;
    activeDragEl.style.left = `${e.clientX - offsetX}px`;
    activeDragEl.style.top = `${e.clientY - offsetY}px`;
}

// ドラッグ終了と合成判定
function stopDragging(e) {
    if (!activeDragEl) return;
    
    document.removeEventListener('pointermove', onDrag);
    document.removeEventListener('pointerup', stopDragging);

    activeDragEl.style.zIndex = '';

    // 右側のリスト内にドロップした場合は削除する
    const boardRect = board.getBoundingClientRect();
    if (e.clientX > boardRect.right) {
        activeDragEl.remove();
    } else {
        checkCollision(activeDragEl); // 合成できるかチェック
    }
    
    activeDragEl = null;
}


// ====== 5. 合成・衝突判定ロジック ======

// レシピを検索するヘルパー関数
function getRecipeResult(id1, id2) {
    const key1 = `${id1},${id2}`;
    const key2 = `${id2},${id1}`;
    return recipes[key1] || recipes[key2];
}

// 重なりをチェックし、可能なら合成する
function checkCollision(el1) {
    const rect1 = el1.getBoundingClientRect();
    const boardElements = document.querySelectorAll('.board-element');

    for (let el2 of boardElements) {
        if (el1 === el2) continue;
        
        const rect2 = el2.getBoundingClientRect();

        // 当たり判定（重なっているか）
        if (!(rect1.right < rect2.left || 
              rect1.left > rect2.right || 
              rect1.bottom < rect2.top || 
              rect1.top > rect2.bottom)) {
            
            const resultId = getRecipeResult(el1.dataset.id, el2.dataset.id);
            
            if (resultId) {
                // 合成成功時の処理
                const centerX = rect1.left + rect1.width / 2;
                const centerY = rect1.top + rect1.height / 2;
                
                // 元の2つの素材を消去
                el1.remove();
                el2.remove();

                // 新しい素材を生成
                createBoardElement(resultId, centerX, centerY);

                // まだ右側に保存されていなければ追加して再描画
                if (!unlockedElements.includes(resultId)) {
                    unlockedElements.push(resultId);
                    renderSidebar();
                }
                break; // 1度合成したらループを抜ける
            }
        }
    }
}

// ゲーム起動
init();
