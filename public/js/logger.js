// =============================================
// 行動ログを記録するモジュール
// 経路分析・モデル学習に使えるように、
// 「イベント」と「移動経路」の2種類を記録する
// 終了時にサーバーへ送り、logs/ フォルダに JSON で保存してもらう
// =============================================

const ActionLogger = {
  data: null,        // 記録中のログ本体
  startMs: 0,        // 開始時刻（ミリ秒）
  timerId: null,     // 位置サンプリング用のタイマー
  SAMPLE_INTERVAL: 200, // 位置を記録する間隔（ミリ秒）

  // 記録開始
  // playerId: スタート画面で入力した名前（空でもOK）
  // layout: 店のレイアウト（陳列台・商品の位置）
  start(playerId, shoppingList, layout) {
    this.startMs = Date.now();
    this.data = {
      sessionId: makeTimestamp(new Date()),
      playerId: playerId,
      startTime: new Date().toISOString(),
      endTime: null,
      sampleIntervalMs: this.SAMPLE_INTERVAL, // path を記録する間隔
      layout: layout,              // 店のレイアウト
      shoppingList: shoppingList,  // 今回のお題（商品IDの配列）
      result: null,                // 終了時に入る
      events: [],                  // クリック・ホバーなどのイベント
      path: []                     // 一定間隔のプレイヤー位置・向き
    };
    // スタート時点（t = 0）の位置を記録
    this.data.path.push({ t: 0, ...getPlayerState() });
    // 一定間隔でプレイヤーの位置を記録
    this.timerId = setInterval(() => {
      this.data.path.push({ t: this.elapsed(), ...getPlayerState() });
    }, this.SAMPLE_INTERVAL);
  },

  // 開始からの経過時間（ミリ秒）
  elapsed() {
    return Date.now() - this.startMs;
  },

  // イベントを1件追加する
  // type: 'click' / 'hover' / 'start' / 'end' など
  add(type, detail) {
    if (!this.data) return;
    this.data.events.push({
      t: this.elapsed(),
      type: type,
      ...detail,
      player: getPlayerState()   // そのときのプレイヤーの位置・向き
    });
  },

  // 記録終了 → サーバーに送る
  // checkedOut: レジでお会計したら true、途中でやめたら false
  // 戻り値は Promise（保存が終わるのを await で待てる）
  finish(checkedOut) {
    if (!this.data) return Promise.resolve(null);
    this.close(checkedOut);
    const log = this.data;
    this.data = null;
    return this.send(log);
  },

  // 記録を締める（結果をまとめる）
  close(checkedOut) {
    clearInterval(this.timerId);
    this.add('end', { checkedOut: checkedOut });
    this.data.endTime = new Date().toISOString();
    const clicks = this.data.events.filter(e => e.type === 'click');
    const correctIds = clicks.filter(e => e.correct).map(e => e.itemId);
    const missed = this.data.shoppingList.filter(id => !correctIds.includes(id));
    this.data.result = {
      checkedOut: checkedOut,                 // レジでお会計したか（false = 途中でやめた）
      allFound: missed.length === 0,          // リストの商品を全部カゴに入れたか
      totalTimeMs: this.elapsed(),            // かかった時間
      pickCount: clicks.length,               // カゴに入れた商品の数
      wrongPickCount: clicks.filter(e => !e.correct).length, // リストにない商品の数
      missedItems: missed                     // 買い忘れた商品
    };
  },

  // サーバーにログを送る（POST /api/logs）
  // サーバーにつながらなかったときは、ログが消えないように JSON をダウンロードする
  async send(log) {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log)
      });
      if (!res.ok) throw new Error('サーバーエラー ' + res.status);
      const json = await res.json();
      return json.file; // 保存されたファイル名
    } catch (err) {
      console.error('ログの送信に失敗しました。ダウンロードで保存します', err);
      this.download(log);
      return null;
    }
  },

  // ページを閉じる・リロードするときに、プレイ途中のログを送る
  // sendBeacon はページが閉じかけていても確実に送ってくれる関数
  sendOnUnload() {
    if (!this.data) return;
    this.close(false);
    const blob = new Blob([JSON.stringify(this.data)], { type: 'application/json' });
    navigator.sendBeacon('/api/logs', blob);
    this.data = null;
  },

  // 予備：JSON ファイルとしてダウンロードする
  download(log) {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'log_' + log.sessionId + '.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
};

// ページを閉じるときに途中までのログを送る
window.addEventListener('pagehide', () => ActionLogger.sendOnUnload());

// 別のタブに切り替えた／戻ってきたことを記録する
// （裏に回っている間は記録の間隔が乱れるので、分析のときにその区間を除けるように）
document.addEventListener('visibilitychange', () => {
  ActionLogger.add('visibility', { hidden: document.hidden });
});

// マウスの状態（画面のどこを指しているか・ボタンを押しているか）
// 位置は画面の幅・高さを 1 とした割合（左上が 0, 0、右下が 1, 1）
// → プレイヤーが「画面のどこに注目しているか」の手がかりになる
const mouseState = { x: null, y: null, down: false };
window.addEventListener('mousemove', (e) => {
  mouseState.x = Math.round(e.clientX / window.innerWidth * 1000) / 1000;
  mouseState.y = Math.round(e.clientY / window.innerHeight * 1000) / 1000;
});
window.addEventListener('mousedown', () => { mouseState.down = true; });
window.addEventListener('mouseup', () => { mouseState.down = false; });

// プレイヤー（カメラ）の現在の位置と向き、マウスの状態を取得
// rotY: 左右の向き（度）、rotX: 上下の向き（度）
// mouseX, mouseY: マウスの画面上の位置（0〜1）、mouseDown: ボタンを押しているか（ドラッグ中など）
function getPlayerState() {
  const obj = document.getElementById('player').object3D;
  const r = (v) => Math.round(v * 100) / 100; // 小数第2位で丸める
  return {
    x: r(obj.position.x),
    y: r(obj.position.y),
    z: r(obj.position.z),
    rotX: r(THREE.MathUtils.radToDeg(obj.rotation.x)),
    rotY: r(THREE.MathUtils.radToDeg(obj.rotation.y)),
    mouseX: mouseState.x,
    mouseY: mouseState.y,
    mouseDown: mouseState.down
  };
}

// 日時を「20261007_153012」の形式にする（ファイル名用）
function makeTimestamp(d) {
  const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' +
         p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}
