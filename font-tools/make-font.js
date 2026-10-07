// =============================================
// 日本語フォントを A-Frame 用（SDF 形式）に変換するスクリプト
//
// A-Frame の文字（a-text）は普通のフォントファイル（.ttf）をそのまま使えない。
// 「SDF」という特別な画像（.png）＋文字の位置情報（.json）に変換する必要がある。
// （SDF = 各ピクセルに「文字の輪郭までの距離」を入れた画像。拡大してもぼやけにくい）
// ※ カラーの MSDF だとこのフォントでは文字の周りにゴミが出たので、白黒の SDF にしている
//
// 漢字は何千字もあって全部入れると重いので、
// game.js の中の '...' や `...` で囲まれた文字列に出てくる文字だけを入れる。
//
// 使い方： npm run font
// → public/fonts/jp-sdf.json と jp-sdf.png ができる
//
// ★ game.js に新しい日本語（商品名など）を足したら、もう一度 npm run font を実行すること！
//   （実行しないと、その文字だけ表示されない）
// =============================================

const fs = require('fs');
const path = require('path');
const generateBMFont = require('msdf-bmfont-xml');

const ROOT = path.join(__dirname, '..');
const FONT_FILE = path.join(__dirname, 'source/ZenMaruGothic-Bold.ttf'); // 元のフォント
const GAME_JS = path.join(ROOT, 'public/js/game.js');                   // 文字を集めるファイル
const OUT_DIR = path.join(ROOT, 'public/fonts');                        // 出力先
const NAME = 'jp-sdf';                                                 // 出力ファイル名

// ---------- 1. 使う文字を集める ----------
// 英数字・記号（ASCII）は全部入れておく
let chars = '';
for (let code = 32; code <= 126; code++) {
  chars += String.fromCharCode(code);
}

// game.js の中の '...' と `...` の中身を全部取り出す
const source = fs.readFileSync(GAME_JS, 'utf-8');
const strings = source.match(/'[^'\n]*'|`[^`]*`/g) || [];
chars += strings.join('');

// 重複を消す（Set は同じものを1つにまとめてくれる）
const charset = [...new Set(chars)].filter(c => c !== '\n').join('');
console.log(`文字数: ${charset.length}`);
console.log(charset);

// ---------- 2. SDF フォントを作る ----------
generateBMFont(FONT_FILE, {
  outputType: 'json',
  filename: NAME,
  charset: charset,
  fieldType: 'sdf',          // 白黒の SDF（game.js 側も shader: sdf にする）
  fontSize: 48,              // 大きいほどきれいだが画像も大きくなる
  distanceRange: 4,
  textureSize: [1024, 1024]  // 1枚の画像に収める
}, (err, textures, font) => {
  if (err) throw err;
  if (textures.length > 1) {
    throw new Error('文字が多すぎて画像1枚に入りません。textureSize を大きくしてください');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 画像（png）を保存
  fs.writeFileSync(path.join(OUT_DIR, NAME + '.png'), textures[0].texture);

  // 位置情報（json）を保存。画像のファイル名もそろえておく
  const data = JSON.parse(font.data);
  data.pages = [NAME + '.png'];
  fs.writeFileSync(path.join(OUT_DIR, NAME + '.json'), JSON.stringify(data));

  console.log(`できました: public/fonts/${NAME}.json, public/fonts/${NAME}.png`);
});
