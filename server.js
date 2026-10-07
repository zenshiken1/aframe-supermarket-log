// =============================================
// Node.js サーバー
// 役割は2つだけ：
//   1. public/ フォルダの中身（ゲーム画面・フォント）をブラウザに渡す
//   2. ブラウザから送られてきた行動ログを logs/ フォルダに保存する
//
// 起動方法： npm start
// ブラウザで http://localhost:3000 を開く
// =============================================

const express = require('express'); // Webサーバーを簡単に作るためのライブラリ
const fs = require('fs');           // ファイルを読み書きする（Node.js 標準）
const path = require('path');       // ファイルのパスを組み立てる（Node.js 標準）

const app = express();
const PORT = 3000;
const LOG_DIR = path.join(__dirname, 'logs');

// logs フォルダがなければ作る
fs.mkdirSync(LOG_DIR, { recursive: true });

// 送られてきた JSON を読めるようにする（ログは大きくなるので上限を 20MB に）
app.use(express.json({ limit: '20mb' }));

// 1. ゲーム画面（public フォルダ）を公開
//    例：public/index.html → http://localhost:3000/index.html
app.use(express.static(path.join(__dirname, 'public')));

// 2. ログの保存（POST /api/logs）
app.post('/api/logs', (req, res) => {
  const log = req.body;

  // 最低限のチェック：sessionId が「数字8桁_数字6桁」の形でなければ受け付けない
  // （変な名前のファイルを作られないようにするため）
  if (!log || !/^\d{8}_\d{6}$/.test(log.sessionId)) {
    return res.status(400).json({ ok: false, error: 'sessionId がおかしいです' });
  }

  // ファイル名を決める。同じ名前があれば _2, _3 … をつけて上書きしない
  let fileName = `log_${log.sessionId}.json`;
  let n = 2;
  while (fs.existsSync(path.join(LOG_DIR, fileName))) {
    fileName = `log_${log.sessionId}_${n}.json`;
    n++;
  }

  // JSON ファイルとして書き出す（null, 2 は「インデント2つで見やすく」という意味）
  fs.writeFileSync(path.join(LOG_DIR, fileName), JSON.stringify(log, null, 2), 'utf-8');

  console.log(`ログを保存しました: logs/${fileName}`);
  res.json({ ok: true, file: fileName });
});

// 保存済みログの一覧（確認用）： http://localhost:3000/api/logs
app.get('/api/logs', (req, res) => {
  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.json'));
  res.json(files);
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`サーバー起動中: http://localhost:${PORT}`);
  console.log('止めるときは Ctrl + C');
});
