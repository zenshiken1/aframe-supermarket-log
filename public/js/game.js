// =============================================
// ゲーム本体
// 1. 店内に商品棚・商品・レジを並べる
// 2. ランダムに買い物リストを作る
// 3. 商品をクリックするとカゴに入る（リストにない物も入る。現実と同じく正解は教えない）
// 4. レジをクリックするとお会計 → 終了
// =============================================

// ---------- 設定 ----------
const LIST_SIZE = 5;      // 買い物リストの商品数
const CLICK_RANGE = 2.5;  // 商品をクリックできる距離（メートル）。これより遠いと反応しない

// 商品棚（ゴンドラ）のサイズ
const SHELF_HEIGHT = 1.8;            // 高さ（目の高さ 1.6m より高いので、棚の向こうは見えない）
const SHELF_WIDTH = 1.2;             // 横幅（x方向。両側に商品を置く）
const SHELF_DEPTH = 8;               // 奥行き（z方向）
const SHELF_Z = -5;                  // 棚の中心の z 座標（z = -9 〜 -1 に置かれる）
const SHELF_LEVELS = [0.3, 0.8, 1.3]; // 棚板の高さ（下段・中段・上段）

// レジ
const REGISTER = { x: 6, z: 6, width: 1.6, depth: 0.8, height: 0.9 };

// スタート地点（入口）
const START_POS = { x: 0, z: 8 };

// 店のレイアウト（棚・商品・レジの位置）を変えたら、この番号を1つ増やす
// → ログに記録されるので、あとで「どの配置のときのデータか」がわかる
const LAYOUT_VERSION = 2;

// 日本語フォント（npm run font で作ったもの）
// ※ A-Frame の標準フォントは英語しか出ないので、日本語用のフォントを指定する
// ※ このファイルに新しい日本語を足したら npm run font をやり直すこと（README 参照）
const JP_FONT = '/fonts/jp-sdf.json';
const JP_FONT_IMAGE = '/fonts/jp-sdf.png';

// 商品棚（x座標と看板の文字）
const SHELVES = [
  { x: -6, label: '果物と野菜' },
  { x: 0,  label: '飲み物と乳製品' },
  { x: 6,  label: 'パン 肉 魚' }
];

// 商品データ
// shelf: どの棚か（SHELVES の番号）
// side:  棚のどちら側か（-1 = 左側（x がマイナス側）、1 = 右側（x がプラス側））
// level: 何段目か（0 = 下段、1 = 中段、2 = 上段）
// z:     棚の前後の位置
// shape: A-Frame の形（a-sphere など）、attrs: 形ごとのサイズ・色
const ITEMS = [
  { id: 'apple',  name: 'りんご',   shelf: 0, side:  1, level: 1, z: -7, shape: 'sphere',   attrs: { radius: 0.15, color: '#d62828' } },
  { id: 'banana', name: 'バナナ',   shelf: 0, side: -1, level: 1, z: -3, shape: 'cylinder', attrs: { radius: 0.06, height: 0.4, color: '#ffe066', rotation: '90 0 0' } },
  { id: 'tomato', name: 'トマト',   shelf: 0, side:  1, level: 0, z: -3, shape: 'sphere',   attrs: { radius: 0.12, color: '#ff5a36' } },
  { id: 'carrot', name: 'にんじん', shelf: 0, side: -1, level: 0, z: -7, shape: 'cone',     attrs: { 'radius-bottom': 0.07, 'radius-top': 0.01, height: 0.35, color: '#f77f00', rotation: '90 0 0' } },

  { id: 'milk',   name: '牛乳',     shelf: 1, side: -1, level: 1, z: -8, shape: 'box',      attrs: { width: 0.2, height: 0.35, depth: 0.2, color: '#ffffff' } },
  { id: 'juice',  name: 'ジュース', shelf: 1, side:  1, level: 1, z: -5, shape: 'box',      attrs: { width: 0.18, height: 0.3, depth: 0.18, color: '#ffb703' } },
  { id: 'tea',    name: 'お茶',     shelf: 1, side:  1, level: 2, z: -2, shape: 'cylinder', attrs: { radius: 0.08, height: 0.3, color: '#2d6a4f' } },
  { id: 'cheese', name: 'チーズ',   shelf: 1, side: -1, level: 0, z: -4, shape: 'box',      attrs: { width: 0.3, height: 0.12, depth: 0.2, color: '#ffd166' } },

  { id: 'bread',  name: 'パン',     shelf: 2, side: -1, level: 2, z: -7, shape: 'box',      attrs: { width: 0.22, height: 0.18, depth: 0.4, color: '#c68b59' } },
  { id: 'egg',    name: '卵',       shelf: 2, side: -1, level: 1, z: -3, shape: 'sphere',   attrs: { radius: 0.09, scale: '1 1.3 1', color: '#f5ebe0' } },
  { id: 'fish',   name: '魚',       shelf: 2, side:  1, level: 0, z: -6, shape: 'box',      attrs: { width: 0.15, height: 0.1, depth: 0.45, color: '#6c8ead' } },
  { id: 'meat',   name: '肉',       shelf: 2, side:  1, level: 1, z: -2, shape: 'box',      attrs: { width: 0.25, height: 0.12, depth: 0.35, color: '#b23a48' } }
];

// 商品の位置を計算する（棚の番号・左右・段から、実際の x, y, z を出す）
function itemPosition(item) {
  return {
    x: SHELVES[item.shelf].x + item.side * 0.3, // 棚の中心から左右に 0.3m
    y: SHELF_LEVELS[item.level] + 0.2,          // 棚板の少し上
    z: item.z
  };
}

// 長方形の範囲（当たり判定・ログ用）
function rect(x, z, width, depth) {
  return { xMin: x - width / 2, xMax: x + width / 2, zMin: z - depth / 2, zMax: z + depth / 2 };
}

// ぶつかる物（棚とレジ）の一覧。collision.js でも使う
const OBSTACLES = [
  ...SHELVES.map(s => ({ type: 'shelf', label: s.label, ...rect(s.x, SHELF_Z, SHELF_WIDTH, SHELF_DEPTH) })),
  { type: 'register', label: 'レジ', ...rect(REGISTER.x, REGISTER.z, REGISTER.width, REGISTER.depth) }
];

// ---------- ゲームの状態 ----------
let shoppingList = []; // 今回のお題（商品IDの配列）
let basket = [];       // カゴに入れた商品ID（リストにない物も入る）
let playing = false;   // プレイ中かどうか

// ---------- 店内を作る ----------
function buildStore() {
  const store = document.getElementById('store');

  // 商品棚
  SHELVES.forEach((s) => {
    // 真ん中の背板（これがあるので棚の向こう側は見えない）
    store.appendChild(makeBox(s.x, SHELF_HEIGHT / 2, SHELF_Z, 0.08, SHELF_HEIGHT, SHELF_DEPTH, '#a1887f'));
    // いちばん下の台
    store.appendChild(makeBox(s.x, SHELF_LEVELS[0] / 2, SHELF_Z, SHELF_WIDTH, SHELF_LEVELS[0], SHELF_DEPTH, '#8d6e63'));
    // 棚板（中段・上段）
    SHELF_LEVELS.slice(1).forEach((y) => {
      store.appendChild(makeBox(s.x, y, SHELF_Z, SHELF_WIDTH, 0.03, SHELF_DEPTH, '#8d6e63'));
    });
    // 看板（棚の手前の端の上）
    store.appendChild(makeText(s.label, `${s.x} 2.2 -1`, 8, '#333'));
  });

  // 商品
  // 「入れ物（group）」の中に「商品の形」を入れて、名札は棚板のふちに付ける
  ITEMS.forEach((item) => {
    const p = itemPosition(item);
    const group = document.createElement('a-entity');
    group.setAttribute('position', `${p.x} ${p.y} ${p.z}`);

    const el = document.createElement('a-' + item.shape);
    for (const key in item.attrs) {
      el.setAttribute(key, item.attrs[key]);
    }
    el.setAttribute('class', 'clickable'); // クリック対象にする
    el.dataset.itemId = item.id;

    // マウスを乗せたとき：名前を表示＆ログ
    el.addEventListener('mouseenter', () => {
      showTooltip(item.name);
      if (playing) ActionLogger.add('hover', { itemId: item.id });
    });
    el.addEventListener('mouseleave', () => showTooltip(null));

    // クリックしたとき
    el.addEventListener('click', () => onItemClick(item, group));

    group.appendChild(el);
    store.appendChild(group);

    // 棚板のふちの値札（商品を取ってもそのまま残る。本物のスーパーと同じ）
    // （棚板から少し手前・下に離しておく。近すぎると回転したときに棚板にめり込む）
    const tagX = SHELVES[item.shelf].x + item.side * (SHELF_WIDTH / 2 + 0.2);
    store.appendChild(makeText(item.name, `${tagX} ${SHELF_LEVELS[item.level] - 0.08} ${item.z}`, 2.5, '#000'));
  });

  // レジ
  const register = makeBox(REGISTER.x, REGISTER.height / 2, REGISTER.z,
                           REGISTER.width, REGISTER.height, REGISTER.depth, '#90a4ae');
  register.setAttribute('class', 'clickable');
  register.addEventListener('mouseenter', () => {
    showTooltip('レジ（クリックでお会計）');
    if (playing) ActionLogger.add('hover', { itemId: 'register' });
  });
  register.addEventListener('mouseleave', () => showTooltip(null));
  register.addEventListener('click', () => onRegisterClick(register));
  store.appendChild(register);
  store.appendChild(makeText('レジ', `${REGISTER.x} 2.0 ${REGISTER.z}`, 8, '#c62828'));
}

// 箱（a-box）を作る
function makeBox(x, y, z, width, height, depth, color) {
  const box = document.createElement('a-box');
  box.setAttribute('position', `${x} ${y} ${z}`);
  box.setAttribute('width', width);
  box.setAttribute('height', height);
  box.setAttribute('depth', depth);
  box.setAttribute('color', color);
  return box;
}

// 日本語の文字（a-text）を作る
// value: 文字、position: 位置、width: 大きさ、color: 色
function makeText(value, position, width, color) {
  const text = document.createElement('a-text');
  text.setAttribute('value', value);
  text.setAttribute('position', position);
  text.setAttribute('width', width);
  text.setAttribute('color', color);
  text.setAttribute('align', 'center');
  text.setAttribute('font', JP_FONT);
  text.setAttribute('font-image', JP_FONT_IMAGE);
  text.setAttribute('shader', 'sdf');   // フォントを SDF で作ったので、それに合わせる
  text.setAttribute('face-camera', '');  // いつもプレイヤーの方を向く（face-camera.js）
  return text;
}

// ---------- 商品をクリックしたときの処理 ----------
// 現実の買い物と同じように、リストにない物でもカゴに入る（正解・不正解は表示しない）
function onItemClick(item, group) {
  if (!playing) return;
  // マウスをドラッグして見回しただけのときはクリックとみなさない
  if (wasDragged()) return;

  // リストにあって、まだカゴに入れていなければ正解（ログ用。画面には出さない）
  const correct = shoppingList.includes(item.id) && !basket.includes(item.id);

  ActionLogger.add('click', {
    itemId: item.id,
    correct: correct,
    itemPos: itemPosition(item), // 商品の位置
    distance: Math.round(distanceTo(group) * 100) / 100 // プレイヤーから商品までの距離
  });

  basket.push(item.id);
  group.parentNode.removeChild(group); // 取った商品は棚から消す
  showTooltip(null);
  showMessage(`${item.name} をカゴに入れた`, '#2a9d8f');
  renderBasket();
}

// ---------- レジをクリックしたときの処理 ----------
function onRegisterClick(register) {
  if (!playing) return;
  if (wasDragged()) return;
  if (basket.length === 0) {
    showMessage('カゴが空っぽです', '#e63946');
    return;
  }
  ActionLogger.add('checkout', {
    distance: Math.round(distanceTo(register) * 100) / 100
  });
  endGame(true);
}

// ---------- ゲーム開始 ----------
function startGame() {
  // 商品をシャッフルして先頭から LIST_SIZE 個を選ぶ
  const ids = ITEMS.map(i => i.id).sort(() => Math.random() - 0.5);
  shoppingList = ids.slice(0, LIST_SIZE);
  basket = [];
  playing = true;

  // スタート画面で入力された名前（空なら 'guest'）
  const playerId = document.getElementById('player-id').value.trim() || 'guest';

  // 名前を入力中に WASD を押すと動いてしまうので、スタート位置に戻す
  const player = document.getElementById('player').object3D;
  player.position.set(START_POS.x, 1.6, START_POS.z);

  renderList();
  renderBasket();
  document.getElementById('start-screen').classList.add('hidden');
  document.getElementById('ui').classList.remove('hidden');

  ActionLogger.start(playerId, shoppingList, getLayout());
  ActionLogger.add('start', {});
}

// ---------- ゲーム終了 ----------
// checkedOut: レジでお会計したら true、途中でやめたら false
// async をつけると、中で await（終わるのを待つ）が使える
async function endGame(checkedOut) {
  if (!playing) return;
  playing = false;

  // 結果をまとめて表示（プレイ中は正解を見せないので、ここで初めて見せる）
  const found = shoppingList.filter(id => basket.includes(id)).length;
  const extra = basket.filter(id => !shoppingList.includes(id)).length;
  document.getElementById('end-title').textContent = checkedOut ? 'お会計しました' : '中断しました';
  document.getElementById('end-text').textContent =
    `リストの商品: ${found} / ${shoppingList.length} 個　リストにない商品: ${extra} 個`;
  document.getElementById('end-screen').classList.remove('hidden');

  const file = await ActionLogger.finish(checkedOut); // サーバーにログを送って保存
  document.getElementById('save-text').textContent =
    file ? `ログを保存しました: logs/${file}` : 'サーバーに送れなかったのでダウンロードしました';
}

// ---------- 店のレイアウト（ログ用） ----------
// 経路分析・モデル学習では「どこに何があったか」が必要なので、毎回ログに入れておく
function getLayout() {
  return {
    version: LAYOUT_VERSION,
    store: { xMin: -STORE_HALF, xMax: STORE_HALF, zMin: -STORE_HALF, zMax: STORE_HALF },
    playerRadius: PLAYER_RADIUS,
    clickRange: CLICK_RANGE,
    startPos: START_POS,
    shelfHeight: SHELF_HEIGHT,
    obstacles: OBSTACLES, // ぶつかる物（棚・レジ）の長方形
    register: { x: REGISTER.x, z: REGISTER.z },
    // 商品の位置
    items: ITEMS.map(i => ({
      id: i.id, name: i.name, shelf: i.shelf, side: i.side, level: i.level,
      ...itemPosition(i)
    }))
  };
}

// プレイヤー（目の位置）から物までの距離
function distanceTo(el) {
  const playerPos = document.getElementById('player').object3D.position;
  const pos = new THREE.Vector3();
  el.object3D.getWorldPosition(pos);
  return playerPos.distanceTo(pos);
}

// ---------- ドラッグ判定 ----------
// マウスを押した位置と離した位置が 5px 以上ずれていたら「ドラッグ」
// （true にすると、A-Frame のクリック処理より先に呼ばれる）
let mouseDownPos = null;
let mouseUpPos = null;
window.addEventListener('mousedown', (e) => { mouseDownPos = { x: e.clientX, y: e.clientY }; }, true);
window.addEventListener('mouseup', (e) => { mouseUpPos = { x: e.clientX, y: e.clientY }; }, true);
function wasDragged() {
  if (!mouseDownPos || !mouseUpPos) return false;
  const dist = Math.hypot(mouseUpPos.x - mouseDownPos.x, mouseUpPos.y - mouseDownPos.y);
  return dist > 5;
}

// ---------- 画面表示まわり ----------
// 買い物リストを描画（メモと同じで、取っても自動では消えない）
function renderList() {
  const ul = document.getElementById('shopping-list');
  ul.innerHTML = '';
  shoppingList.forEach((id) => {
    const li = document.createElement('li');
    li.textContent = ITEMS.find(i => i.id === id).name;
    ul.appendChild(li);
  });
}

// カゴの中身を描画
function renderBasket() {
  const ul = document.getElementById('basket');
  ul.innerHTML = '';
  basket.forEach((id) => {
    const li = document.createElement('li');
    li.textContent = ITEMS.find(i => i.id === id).name;
    ul.appendChild(li);
  });
}

// 商品名のツールチップ（null で非表示）
function showTooltip(text) {
  const tip = document.getElementById('tooltip');
  tip.textContent = text || '';
  tip.style.display = text ? 'block' : 'none';
}

// 画面下のメッセージ（2秒で消える）
let messageTimer = null;
function showMessage(text, color) {
  const msg = document.getElementById('message');
  msg.textContent = text;
  msg.style.color = color;
  clearTimeout(messageTimer);
  messageTimer = setTimeout(() => { msg.textContent = ''; }, 2000);
}

// ---------- 初期化 ----------
// シーンの読み込みが終わってから店内を作る
const scene = document.querySelector('a-scene');
// クリックできる距離を設定（raycaster の far = 光線が届く長さ）
scene.setAttribute('raycaster', 'far', CLICK_RANGE);
if (scene.hasLoaded) buildStore();
else scene.addEventListener('loaded', buildStore);
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('quit-btn').addEventListener('click', () => endGame(false));
document.getElementById('retry-btn').addEventListener('click', () => location.reload());
