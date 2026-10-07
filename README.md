# 🛒 スーパーで買い物ゲーム（A-Frame + Node.js）

ブラウザの中の 3D スーパーを歩き回って、**買い物リストに書かれた商品をクリックして集める**ゲームです。

遊んでいる間の「どこを歩いたか」「どこを見ていたか」「何をクリックしたか」がすべて記録され、
ゲームが終わると **`logs/` フォルダに JSON ファイルとして自動で保存** されます。
このデータは、あとで **経路分析** や **機械学習モデルの学習** に使うことを想定しています。

> 💡 この README は「プログラミングを始めたばかりの人」向けに書いています。
> わからない言葉が出てきたら、いちばん下の **[用語集](#-用語集)** を見てください。

---

## 目次

1. [まず動かしてみる](#-1-まず動かしてみる)
2. [遊び方](#-2-遊び方)
3. [フォルダとファイルの説明](#-3-フォルダとファイルの説明)
4. [全体の仕組み](#-4-全体の仕組み)
5. [コードの読み方ガイド](#-5-コードの読み方ガイド)
6. [よくある改造](#-6-よくある改造)
7. [日本語フォントについて](#-7-日本語フォントについて)
8. [記録されるデータ（ログ）の説明](#-8-記録されるデータログの説明)
9. [ログを Python で読む・分析する](#-9-ログを-python-で読む分析する)
10. [困ったときは](#-10-困ったときは)
11. [用語集](#-用語集)

---

## 🚀 1. まず動かしてみる

### 1-1. Node.js をインストールする（最初の1回だけ）

このゲームは **Node.js**（JavaScript をパソコン上で動かすソフト）を使います。

1. https://nodejs.org/ja を開く
2. **「LTS」** と書いてある方をダウンロードしてインストール
3. インストールできたか確認する。**ターミナル**を開いて次を入力し、Enter：

   ```bash
   node -v
   ```

   `v22.11.0` のように数字が出れば OK です。

> **ターミナルの開き方**
> - Mac：`Command + スペース` →「ターミナル」と入力して Enter
> - Windows：スタートメニューで「PowerShell」を検索して開く
> - VS Code を使っているなら、メニューの「ターミナル」→「新しいターミナル」でも OK（おすすめ）

### 1-2. このフォルダに移動する

ターミナルで `cd`（change directory ＝ フォルダを移動する命令）を使います。

```bash
cd このフォルダの場所/supermarket-game
```

> 💡 Mac なら `cd `（cd とスペース）まで打ってから、Finder でこのフォルダをターミナルにドラッグ＆ドロップすると、場所が自動で入ります。

### 1-3. 必要なライブラリをインストールする（最初の1回だけ）

```bash
npm install
```

`node_modules` というフォルダができれば成功です（中身は気にしなくて大丈夫）。

### 1-4. サーバーを起動する

```bash
npm start
```

次のように表示されたら起動成功です：

```
サーバー起動中: http://localhost:3000
止めるときは Ctrl + C
```

### 1-5. ブラウザで開く

Chrome で **http://localhost:3000** を開きます。ゲームのスタート画面が出れば OK！

### 1-6. 終わるとき

ターミナルで **`Ctrl + C`** を押すとサーバーが止まります。

> ⚠️ **`index.html` をダブルクリックして開くのは NG です。**
> フォントの読み込みとログの保存にはサーバーが必要なので、必ず `npm start` してから
> `http://localhost:3000` で開いてください。

---

## 🎮 2. 遊び方

| 操作 | やり方 |
|---|---|
| 前後左右に移動 | `W` `A` `S` `D` キー（または矢印キー） |
| 見回す | マウスで画面を **ドラッグ** |
| 商品をカゴに入れる | 商品を **クリック**（2.5m 以内に近づく必要あり） |
| お会計 | **レジ**（入口の右にある灰色の台）をクリック |

1. スタート画面で名前（実験の参加者IDなど）を入力して「スタート」
   - 名前は空でも OK（その場合は `guest` になります）
2. 左上の **買い物リスト** を見ながら、店内を歩いて商品を探す
   - 棚は背が高い（1.8m）ので、通路に入らないと何があるか見えません
   - 商品の名前は、棚板のふちの **値札** に書いてあります
3. 商品をクリックすると **カゴ** に入る（左上の「カゴの中」に出る）
   - **リストにない物でもカゴに入ります。正解かどうかは教えてくれません**（本物の買い物と同じ）
   - 一度カゴに入れた物は戻せません
4. 買い終わったと思ったら **レジをクリック** → お会計して終了
   - 終了画面で初めて「リストの商品をいくつ買えたか」がわかります
   - ログが自動で `logs/` に保存されます
5. 途中でやめたいときは「中断してログ保存」ボタン
   - タブを閉じた場合も、それまでのログが自動で送られます

> 💡 **なぜ時間を表示しないの？ なぜ正解を教えないの？**
> このゲームの目的は「人が普通に買い物するときの動き」を記録することです。
> 時間が見えると急いでしまい、正解がすぐわかると「とりあえず押してみる」動きが増えて、
> 本物の買い物とは違うデータになってしまうからです。歩く速さも人の歩く速さ（約 1.2 m/s）にしてあります。

---

## 📁 3. フォルダとファイルの説明

```
supermarket-game/
├── package.json        ← このプロジェクトの設定（使うライブラリ、npm のコマンド）
├── package-lock.json   ← 自動で作られるファイル。触らなくて OK
├── server.js           ← ★ Node.js のサーバー（画面を配る＋ログを保存する）
│
├── public/             ← ブラウザに送られるファイル（ゲーム本体）
│   ├── index.html      ← ★ 画面の骨組み（3D シーン・買い物リストの表示）
│   ├── js/
│   │   ├── collision.js        ← 当たり判定（棚・レジ・壁を通り抜けないようにする）
│   │   ├── face-camera.js      ← 値札・看板がいつもプレイヤーの方を向くようにする
│   │   ├── update-mouse-ray.js ← 歩いたときにもマウスの光線を更新する（遠くから押せないように）
│   │   ├── game.js             ← ★ ゲームのルール（店の配置・リスト作成・カゴ・レジ）
│   │   └── logger.js           ← ★ 行動ログの記録とサーバーへの送信
│   └── fonts/
│       ├── jp-sdf.json ← 日本語フォント（npm run font で自動生成）
│       └── jp-sdf.png  ← 日本語フォントの画像（npm run font で自動生成）
│
├── font-tools/         ← 日本語フォントを作るための道具
│   ├── make-font.js    ← フォント変換スクリプト
│   └── source/
│       ├── ZenMaruGothic-Bold.ttf ← 元のフォント（Google Fonts）
│       └── OFL.txt                ← フォントのライセンス
│
├── logs/               ← ★ プレイのログがここに保存される
│   └── log_20261007_154302.json など
│
└── node_modules/       ← npm install で入るライブラリ置き場（触らない・Git に入れない）
```

★ がついているのが、まず読んでほしいファイルです。

---

## 🧩 4. 全体の仕組み

このゲームは **「ブラウザ」** と **「サーバー」** の2つが協力して動いています。

```
 ┌───────────── ブラウザ（Chrome）──────────────┐          ┌──── サーバー（server.js）────┐
 │                                              │          │                               │
 │  index.html  … 3D のスーパーと画面の表示     │ ①ページを│                               │
 │  game.js     … ゲームのルール                │ ちょうだい│  public/ のファイルを返す     │
 │  logger.js   … 行動を記録                    │ ───────▶ │                               │
 │                                              │ ◀─────── │                               │
 │   ・0.2秒ごとに位置・向き・マウスをメモ      │          │                               │
 │   ・クリックなどをメモ                        │ ②ログを  │                               │
 │                                              │  送るよ  │  logs/log_日時.json に保存    │
 │   ゲーム終了！ ──────────────────────────────│ ───────▶ │  （POST /api/logs）           │
 │                                              │ ◀─────── │  「保存したよ」と返事         │
 └──────────────────────────────────────────────┘          └───────────────────────────────┘
```

- **なぜサーバーが必要？**
  ブラウザは安全のため、パソコンのフォルダに勝手にファイルを書き込めません。
  そこで「ログをサーバーに送る → サーバー（Node.js）がファイルに書く」という形にしています。
- **localhost:3000 とは？**
  `localhost` は「自分のパソコン」という意味、`3000` はサーバーの受付番号（ポート番号）です。
  つまり「自分のパソコンで動いている 3000 番のサーバー」にアクセスしています。

---

## 📖 5. コードの読み方ガイド

おすすめの読む順番： **index.html → game.js → logger.js → server.js**（余裕があれば collision.js などのコンポーネント）

### 5-1. A-Frame の基本（index.html）

[A-Frame](https://aframe.io/) は、**HTML のタグを書くだけで 3D の世界が作れる**ライブラリです。

```html
<a-scene>                                         <!-- 3D の世界全体 -->
  <a-box position="0 2 -10" width="20" color="#fbe8c8"></a-box>  <!-- 箱（壁） -->
  <a-plane rotation="-90 0 0" width="20" height="20"></a-plane> <!-- 板（床） -->
</a-scene>
```

| よく使うタグ | 意味 |
|---|---|
| `<a-box>` | 箱 |
| `<a-sphere>` | 球 |
| `<a-cylinder>` | 円柱 |
| `<a-cone>` | 円すい |
| `<a-plane>` | 板 |
| `<a-text>` | 文字 |
| `<a-entity>` | 何でもない「入れ物」。カメラやライトにもなる |

**座標（position="x y z"）の向き**（単位はメートル）：

```
          y（上）
          │
          │
          └──────── x（右）
         ╱
        ╱
      z（手前）     ※ 奥に行くほど z はマイナス
```

このゲームでは、プレイヤーは `(0, 1.6, 8)`（入口・目の高さ 1.6m）からスタートし、
奥（z がマイナス）に向かって商品棚が並んでいます。

**上から見た店内の地図**：

```
              z = -10（奥の壁）
   ┌──────────────────────────────────┐
   │                                  │
   │   ┌┃┐       ┌┃┐       ┌┃┐      │  z = -9
   │   │┃│       │┃│       │┃│      │
   │   │┃│ 果物  │┃│ 飲み物│┃│ パン │   ┃ = 背板（向こうが見えない）
   │   │┃│ と    │┃│ と    │┃│ 肉   │   棚の両側に商品が並ぶ
   │   │┃│ 野菜  │┃│ 乳製品│┃│ 魚   │   （下段・中段・上段の3段）
   │   └┃┘       └┃┘       └┃┘      │  z = -1
   │                                  │
   │                         ┌──┐     │
   │                         │レジ│    │  z = 6
   │              😀 スタート └──┘     │  z = 8
   └──────────────────────────────────┘
  x=-10  x=-6      x=0       x=6     x=10
```

プレイヤー（カメラ）の部分：

```html
<a-entity id="player" camera look-controls wasd-controls="acceleration: 7" collision position="0 1.6 8"></a-entity>
```

- `camera` … この位置から世界を見る
- `look-controls` … マウスで見回せるようにする
- `wasd-controls` … WASD キーで動けるようにする。`acceleration` で歩く速さが決まる（7 で約 1.2 m/s）
- `collision` … 自作の当たり判定（`collision.js`）。棚・レジ・壁にぶつかると止まる。
  A-Frame では `AFRAME.registerComponent('名前', {...})` で、こういう機能を自分で作れます
  （`face-camera.js`、`update-mouse-ray.js` も同じしくみです）

### 5-2. ゲームの流れ（game.js）

```
ページを開く
   │
   ▼
buildStore()       … 商品棚・看板・商品・値札・レジを作って並べる
   │
   ▼  「スタート」ボタン
startGame()        … ランダムに5つ選んで買い物リストを作る／ログ記録開始
   │
   ▼  商品をクリック（何回でも）
onItemClick()      … 商品を棚から消してカゴに入れる（正解かどうかはログにだけ書く）
   │
   ▼  レジをクリック
onRegisterClick()  … カゴが空ならメッセージ、そうでなければ終了へ
   │
   ▼
endGame()          … 結果を表示して、ログをサーバーに送る
```

ポイント：

- 商品のデータは `ITEMS` という **配列** にまとめてあります。1行が1つの商品です。
  ```js
  { id: 'apple', name: 'りんご', shelf: 0, side: 1, level: 1, z: -7, shape: 'sphere', attrs: { radius: 0.15, color: '#d62828' } },
  ```
  - `id` … プログラムの中で使う名前（英語）。ログにもこれが記録される
  - `name` … 画面に出す名前（日本語）
  - `shelf` … どの棚に置くか（0 = 果物と野菜、1 = 飲み物と乳製品、2 = パン 肉 魚）
  - `side` … 棚のどちら側か（-1 = 左側、1 = 右側。上から見て x がマイナス側・プラス側）
  - `level` … 何段目か（0 = 下段、1 = 中段、2 = 上段）
  - `z` … 棚の前後の位置
  - `shape` … 形（`sphere` = 球、`box` = 箱 など）
  - `attrs` … 大きさや色
- `document.createElement('a-sphere')` のように、**JavaScript から 3D の物体を作って** 並べています。
  HTML に直接12個書くより、データを変えるだけで商品を増やせるので便利です。
- 実際の位置（x, y, z）は `itemPosition()` 関数が `shelf`・`side`・`level` から計算します。
- `el.addEventListener('click', ...)` で「クリックされたらこの関数を実行してね」と登録しています。
- マウスをドラッグして見回しただけのときは、クリックとして数えません（`wasDragged()`）。
- **商品に 2.5m 以内まで近づかないとクリックできません**（`CLICK_RANGE`）。
  遠くの商品はマウスを乗せても名前が出ず、クリックしても反応しません。

### 5-3. ログの記録（logger.js）

`ActionLogger` という1つのオブジェクトに、ログ関係の機能をまとめています。

| 関数 | やること |
|---|---|
| `start()` | 記録開始。0.2秒ごとに位置・向き・マウスを `path` に追加するタイマーをセット |
| `add()` | イベント（クリックなど）を `events` に1件追加 |
| `finish()` | 記録終了。結果をまとめてサーバーに送る |
| `send()` | `fetch` でサーバーに送る。失敗したら JSON をダウンロード（データを失わないため） |
| `sendOnUnload()` | タブを閉じたときに途中までのログを送る |

### 5-4. サーバー（server.js）

[Express](https://expressjs.com/ja/) というライブラリを使うと、サーバーが数行で書けます。

```js
app.use(express.static('public'));        // public フォルダのファイルをそのまま配る
app.post('/api/logs', (req, res) => {...}); // ログが送られてきたら、ファイルに保存する
```

保存済みのログ一覧は、ブラウザで **http://localhost:3000/api/logs** を開くと見られます。

> ⚠️ `server.js` を書き換えたら、`Ctrl + C` で止めて `npm start` し直してください。
> （`public/` の中のファイルは、ブラウザを再読み込みするだけで反映されます）

---

## 🔧 6. よくある改造

### 商品を増やしたい

1. `public/js/game.js` の `ITEMS` に1行追加し、`LAYOUT_VERSION` を1つ増やす
   ```js
   { id: 'orange', name: 'みかん', shelf: 0, side: 1, level: 2, z: -5, shape: 'sphere', attrs: { radius: 0.1, color: '#ff9f1c' } },
   ```
   - `id` は他とかぶらない英語にする
   - 同じ `shelf`・`side`・`level` の中で、`z` が他の商品とかぶらないようにする（棚は z = -9 〜 -1 の範囲）
2. **新しい漢字・ひらがなを使ったら、フォントを作り直す**（理由は [7章](#-7-日本語フォントについて)）
   ```bash
   npm run font
   ```
3. ブラウザを再読み込み

> 💡 **`LAYOUT_VERSION` って何？**
> 商品・棚・レジの位置を変えると、古いログと新しいログで「地図」が変わります。
> 番号を変えておけば、ログの `layout.version` を見てどちらの配置のデータか区別できます。
> （ログには毎回 `layout` として地図そのものも保存されています）

### 買い物リストの数を変えたい

`game.js` の上の方：

```js
const LIST_SIZE = 5;  // ← ここを変える
```

### クリックできる距離を変えたい

`game.js` の上の方（単位はメートル）：

```js
const CLICK_RANGE = 2.5;  // ← ここを変える
```

> 参考：棚のすぐ前に立つと目の前の商品まで約 1.3〜1.7m です（段によって変わる）。
> 2.0 にすると「1つずつ前まで歩いて取る」、3.0 以上にすると「通路の真ん中からでも取れる」くらいになります。

### 歩く速さを変えたい

`index.html` の `wasd-controls="acceleration: 7"` の数字を変えます。
だいたい **数字 ÷ 5.6 ＝ 秒速（m/s）** です（7 → 約 1.25 m/s、25 → 約 4.5 m/s）。

### 位置を記録する間隔を変えたい

`logger.js` の上の方（単位はミリ秒。200 = 0.2秒）：

```js
SAMPLE_INTERVAL: 200,
```

細かくするほどデータは正確になりますが、ファイルが大きくなります。

---

## 🔤 7. 日本語フォントについて

### なぜ特別なことが必要なの？

A-Frame の 3D の文字（`<a-text>`）は、普通のフォントファイル（.ttf）をそのまま使えません。
**SDF** という特別な形式の「文字の画像（.png）」と「どの文字が画像のどこにあるか（.json）」が必要です。
しかも A-Frame に最初から入っているフォントは **英語だけ** なので、日本語を出すには自分で作る必要があります。

> 💡 SDF（Signed Distance Field）は、各ピクセルに「文字の輪郭までの距離」を記録した画像です。
> 普通の画像と違って、近づいて拡大しても文字の縁がぼやけにくいのが特長です。

### このプロジェクトでのやり方

```
font-tools/source/ZenMaruGothic-Bold.ttf （普通のフォント）
              │
              │  npm run font （font-tools/make-font.js が実行される）
              │   ① game.js の中の '...' や `...` に出てくる文字を全部集める
              │   ② その文字だけを SDF 画像に変換する
              ▼
public/fonts/jp-sdf.png  +  public/fonts/jp-sdf.json
```

- 漢字は何千字もあるので、全部入れると画像がとても大きく（重く）なります。
  そこで **game.js で実際に使っている文字だけ** を入れています。
- そのため、**game.js に新しい日本語を書いたら `npm run font` をやり直す** 必要があります。
  やり忘れると、その文字だけ表示されません。
- `game.js` の `makeText()` 関数で、このフォントを指定しています：
  ```js
  text.setAttribute('font', '/fonts/jp-sdf.json');
  text.setAttribute('font-image', '/fonts/jp-sdf.png');
  text.setAttribute('shader', 'sdf');
  ```

### ちなみに：試してうまくいかなかったこと

- npm の `aframe-japanese-font` パッケージ（作成済みの日本語フォント）
  → 画像の中にゴミ（色のついたブロック）があって、文字の周りに黒い四角が出てしまった
- カラーの **MSDF** 形式で作る
  → このフォントでは一部の文字にゴミが出たので、白黒の **SDF** 形式にした

### フォントを変えたいとき

1. 好きなフォント（.ttf）を `font-tools/source/` に入れる
   （[Google Fonts](https://fonts.google.com/?subset=japanese) のものは無料で使えます）
2. `font-tools/make-font.js` の `FONT_FILE` をそのファイル名に変える
3. `npm run font`

---

## 📊 8. 記録されるデータ（ログ）の説明

1回プレイするごとに、`logs/log_YYYYMMDD_HHMMSS.json` が1つできます。
（例：`log_20261007_154302.json` = 2026年10月7日 15時43分02秒にスタートしたプレイ）

### 全体の形

```json
{
  "sessionId": "20261007_154302",
  "playerId": "bot_A",
  "startTime": "2026-10-07T06:43:02.123Z",
  "endTime": "2026-10-07T06:44:40.389Z",
  "sampleIntervalMs": 200,
  "layout": { "version": 2, "store": {...}, "playerRadius": 0.3, "clickRange": 2.5, "startPos": {...},
              "shelfHeight": 1.8, "obstacles": [...], "register": {...}, "items": [...] },
  "shoppingList": ["apple", "milk", "tea", "egg", "banana"],
  "result": { "checkedOut": true, "allFound": true, "totalTimeMs": 98266,
              "pickCount": 6, "wrongPickCount": 1, "missedItems": [] },
  "events": [ ... ],
  "path": [ ... ]
}
```

| 項目 | 意味 |
|---|---|
| `sessionId` | プレイごとの ID（開始日時） |
| `playerId` | スタート画面で入力した名前 |
| `startTime` / `endTime` | 開始・終了の時刻（※ 世界標準時 UTC。日本時間は +9 時間） |
| `sampleIntervalMs` | `path` を記録する間隔（ミリ秒） |
| `layout` | そのときの店の地図（下の表） |
| `shoppingList` | その回の買い物リスト（商品の `id`） |
| `result.checkedOut` | レジでお会計したら `true`、途中でやめたら `false` |
| `result.allFound` | リストの商品を全部カゴに入れたら `true` |
| `result.totalTimeMs` | かかった時間（ミリ秒。1000 = 1秒） |
| `result.pickCount` | カゴに入れた商品の数 |
| `result.wrongPickCount` | カゴに入れた「リストにない商品」の数 |
| `result.missedItems` | 買い忘れた商品の `id` |

### `layout`：店の地図

| 項目 | 意味 |
|---|---|
| `version` | レイアウトの番号（`game.js` の `LAYOUT_VERSION`） |
| `store` | 歩ける範囲（壁の内側）。`xMin` 〜 `xMax`、`zMin` 〜 `zMax` |
| `playerRadius` | プレイヤーの体の半径。壁・棚・レジにこの距離より近づけない |
| `clickRange` | 商品をクリックできる距離（メートル） |
| `startPos` | スタート地点 |
| `shelfHeight` | 棚の高さ（目の高さ 1.6m より高い ＝ 棚の向こうは見えない） |
| `obstacles` | ぶつかる物（棚とレジ）。`type`（`shelf` / `register`）と長方形 `xMin` 〜 `xMax`、`zMin` 〜 `zMax` |
| `register` | レジの位置 `x, z` |
| `items` | 商品の `id`・名前・`shelf`・`side`・`level`・位置 `x, y, z` |

### `events`：何をしたか

```json
{ "t": 21530, "type": "click", "itemId": "apple", "correct": true,
  "itemPos": { "x": -5.7, "y": 1.0, "z": -7 }, "distance": 1.4,
  "player": { "x": -4.5, "y": 1.6, "z": -6.6, "rotX": -25.6, "rotY": 71.6,
              "mouseX": 0.5, "mouseY": 0.5, "mouseDown": false } }
```

| 項目 | 意味 |
|---|---|
| `t` | スタートからの経過時間（ミリ秒） |
| `type` | `start`（開始）／ `hover`（商品やレジにマウスを乗せた）／ `click`（商品をカゴに入れた）／ `checkout`（レジでお会計）／ `visibility`（別のタブに切り替えた・戻った）／ `end`（終了） |
| `itemId` | 対象の商品（hover と click のとき。レジは `register`） |
| `correct` | リストにある商品だったか（click のとき。**プレイヤーには見せていない**） |
| `itemPos` | 商品の位置（click のとき） |
| `distance` | プレイヤーの目から商品・レジまでの距離（メートル、click と checkout のとき） |
| `checkedOut` | レジでお会計したか（end のとき） |
| `hidden` | `true` = 別のタブに移った、`false` = 戻ってきた（visibility のとき） |
| `player` | そのときのプレイヤーの位置と向き（下の表） |

### `path`：どこを歩いて、どこを見ていたか

0.2 秒ごとに1件記録されます（40秒遊ぶと約200件）。最初の1件は必ず `t = 0`（スタート地点）です。

```json
{ "t": 8203, "x": -4.5, "y": 1.6, "z": -2.3, "rotX": 0, "rotY": 90, "mouseX": 0.43, "mouseY": 0.61, "mouseDown": false }
```

| 項目 | 意味 |
|---|---|
| `t` | スタートからの経過時間（ミリ秒） |
| `x`, `z` | 床の上の位置（メートル）。地図は [5-1](#5-1-a-frame-の基本indexhtml) を参照 |
| `y` | 目の高さ（ずっと 1.6） |
| `rotY` | 左右の向き（度）。**0 = 奥を向いている**、**+90 = 左**、**-90 = 右**、±180 = 手前 |
| `rotX` | 上下の向き（度）。0 = 正面、マイナス = 下を見ている、プラス = 上を見ている |
| `mouseX`, `mouseY` | マウスの画面上の位置。画面の左上が `0, 0`、右下が `1, 1`（まだ動かしていなければ `null`） |
| `mouseDown` | マウスのボタンを押しているか（`true` のときはたいてい、ドラッグで見回している） |

> 💡 **マウスの位置はなぜ記録するの？**
> `rotY`・`rotX` は「顔の向き」ですが、人は画面の真ん中だけを見ているわけではありません。
> 商品を選ぶときはマウスの矢印を見ているので、`mouseX`・`mouseY` は
> 「画面のどこに注目していたか」の手がかりになります（視線計測の代わり）。

> 💡 `rotY` はぐるぐる回ると 360 を超えたり -360 を下回ったりします。
> 分析するときは `rotY % 360` などで範囲をそろえると扱いやすいです。

### モデル学習に使うときの注意

- **`playerId` が `bot_` で始まるログはテスト用のロボットが作ったもの** です。
  ロボットは決まったルートをまっすぐ歩くだけなので、学習には使わないでください。
- **レイアウトのバージョン（`layout.version`）が違うログを混ぜないでください。**
  バージョン 1（低い陳列台・正解表示あり・速さ 4.5m/s）と 2（今の形）では、遊び方そのものが違います。
- 記録の間隔はだいたい 200ms ですが、少しずれます（190〜210ms くらい）。
  きっちりそろえたいときは `t` を使って補間してください。
- `visibility` の `hidden: true` 〜 `false` の間はタブが裏に回っていて、記録が飛んでいることがあります。
  その区間は分析から外すのがおすすめです。
- `result.checkedOut` が `false` のログは途中でやめたプレイです。目的に応じて除外してください。
- 「次にどの商品を取りに行くか」のラベルは、`events` の `click` の順番から作れます。
  リストにない物を取った（`correct: false`）動きも、本物の買い物で起こる行動として残しています。
  最後の目的地はレジ（`layout.register`）です。
- 商品の位置は `layout.items`、障害物（棚・レジ）は `layout.obstacles` にあります。

---

## 🐍 9. ログを Python で読む・分析する

### 全部のログを読み込む

```python
import json
import glob

logs = []
for path in sorted(glob.glob("logs/*.json")):
    with open(path, encoding="utf-8") as f:
        logs.append(json.load(f))

print(len(logs), "件のログ")
for log in logs:
    print(log["playerId"], log["result"])
```

### pandas の表にする

```python
import pandas as pd

# path（移動経路）を1つの表にまとめる
rows = []
for log in logs:
    for p in log["path"]:
        rows.append({"session": log["sessionId"], "player": log["playerId"], **p})
path_df = pd.DataFrame(rows)
print(path_df.head())

# クリックだけの表
clicks = []
for log in logs:
    for e in log["events"]:
        if e["type"] == "click":
            clicks.append({"session": log["sessionId"], "t": e["t"],
                           "item": e["itemId"], "correct": e["correct"]})
click_df = pd.DataFrame(clicks)
print(click_df)
```

### 歩いた経路を地図に描く

```python
import matplotlib.pyplot as plt

fig, ax = plt.subplots(figsize=(6, 6))

# 棚とレジ（ログの layout から描く）
for o in logs[0]["layout"]["obstacles"]:
    color = "burlywood" if o["type"] == "shelf" else "lightslategray"
    ax.add_patch(plt.Rectangle((o["xMin"], o["zMin"]), o["xMax"] - o["xMin"],
                               o["zMax"] - o["zMin"], color=color))

# プレイごとに経路を描く
for log in logs:
    xs = [p["x"] for p in log["path"]]
    zs = [p["z"] for p in log["path"]]
    ax.plot(xs, zs, label=log["playerId"])

    # リストの商品を取った場所に ● 、リストにない商品に ×
    for e in log["events"]:
        if e["type"] == "click":
            ax.scatter(e["player"]["x"], e["player"]["z"],
                       marker="o" if e["correct"] else "x", color="black")

ax.set_xlim(-10, 10)
ax.set_ylim(10, -10)   # 奥（z がマイナス）を上にする
ax.set_xlabel("x")
ax.set_ylabel("z")
ax.set_aspect("equal")
ax.legend()
plt.show()
```

（`pandas` と `matplotlib` が入っていない場合は `pip install pandas matplotlib`）

---

## 🆘 10. 困ったときは

| 症状 | 原因と対処 |
|---|---|
| `npm: command not found` | Node.js が入っていない → [1-1](#1-1-nodejs-をインストールする最初の1回だけ) |
| `Cannot find module 'express'` | `npm install` をしていない → このフォルダで `npm install` |
| `EADDRINUSE: address already in use :::3000` | サーバーがもう動いている。前のターミナルで `Ctrl + C` するか、そのまま http://localhost:3000 を開く |
| 画面が真っ白／3D が出ない | インターネットにつながっているか確認（A-Frame をネットから読み込んでいるため） |
| 日本語の文字が一部だけ出ない | `npm run font` をやり直す（[7章](#-7-日本語フォントについて)） |
| 日本語の文字が全部出ない | `index.html` をダブルクリックで開いていないか？ → `npm start` して http://localhost:3000 で開く |
| ログが `logs/` に保存されない | サーバーが止まっているかも。終了画面に「サーバーに送れなかったのでダウンロードしました」と出たら、ダウンロードフォルダに JSON があるので `logs/` に移す |
| 変更が反映されない | `public/` の中 → ブラウザを再読み込み（`Cmd + Shift + R` / `Ctrl + Shift + R`）。`server.js` → サーバーを再起動 |
| エラーの内容を見たい | Chrome で `F12`（Mac は `Cmd + Option + I`）→「Console」タブに赤い文字で出ている |

---

## 📚 用語集

| 用語 | 意味 |
|---|---|
| **A-Frame** | HTML のタグで 3D/VR の世界を作れる JavaScript ライブラリ |
| **Node.js** | JavaScript をブラウザの外（パソコン上）で動かすためのソフト。サーバーを作るのによく使う |
| **npm** | Node.js のライブラリをインストールしたり、コマンドを実行したりする道具。Node.js と一緒に入る |
| **ライブラリ** | 他の人が作ってくれた便利なプログラムの部品 |
| **サーバー** | ブラウザからの「ちょうだい」「保存して」というお願いに答えるプログラム |
| **localhost** | 「自分のパソコン」のこと |
| **ポート（3000）** | 1台のパソコンの中でサーバーを区別するための番号 |
| **Express** | Node.js でサーバーを簡単に作るためのライブラリ |
| **API** | プログラム同士がやりとりするための窓口。ここでは `/api/logs` |
| **GET / POST** | ブラウザがサーバーにお願いするときの種類。GET = 「ちょうだい」、POST = 「これを受け取って」 |
| **fetch** | JavaScript からサーバーにお願いを送る関数 |
| **JSON** | データを書くための形式。`{ "名前": 値 }` の形。Python でも JS でも簡単に読める |
| **async / await** | 「時間がかかる処理（通信など）が終わるのを待つ」ための書き方 |
| **イベント** | 「クリックされた」「マウスが乗った」などの出来事。`addEventListener` で反応できる |
| **SDF / MSDF** | 3D の文字をきれいに表示するための、特別な形式のフォント画像 |
| **ミリ秒（ms）** | 1000 分の 1 秒。1000 ms = 1 秒 |

---

## 📝 使っているもの

- [A-Frame](https://aframe.io/) 1.6.0（MIT ライセンス）— 3D の表示
- [Express](https://expressjs.com/) — サーバー
- [msdf-bmfont-xml](https://github.com/soimy/msdf-bmfont-xml) — フォントの変換
- [Zen Maru Gothic](https://fonts.google.com/specimen/Zen+Maru+Gothic)（SIL Open Font License、`font-tools/source/OFL.txt`）— 日本語フォント
