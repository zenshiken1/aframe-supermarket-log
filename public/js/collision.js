// =============================================
// 当たり判定（プレイヤーが商品棚・レジ・壁を通り抜けないようにする）
//
// A-Frame の「コンポーネント」として作る。
// index.html の <a-entity id="player" ... collision> の collision がこれ。
// ※ コンポーネントは <a-scene> より前に読み込む必要があるので、
//   このファイルは index.html の <head> で読み込んでいる
// =============================================

const PLAYER_RADIUS = 0.3; // プレイヤーの体の半径（メートル）
const STORE_HALF = 9.9;    // 店の壁の内側（中心から ±9.9m）

// (x, z) にプレイヤーが立てないなら true
function isBlocked(x, z) {
  // 壁の外に出ようとしている
  const limit = STORE_HALF - PLAYER_RADIUS;
  if (Math.abs(x) > limit || Math.abs(z) > limit) return true;

  // 棚やレジにぶつかっている（OBSTACLES は game.js で定義）
  // 長方形を体の半径の分だけ広げて、その中に入っていたらぶつかっている
  for (const o of OBSTACLES) {
    const insideX = x > o.xMin - PLAYER_RADIUS && x < o.xMax + PLAYER_RADIUS;
    const insideZ = z > o.zMin - PLAYER_RADIUS && z < o.zMax + PLAYER_RADIUS;
    if (insideX && insideZ) return true;
  }
  return false;
}

AFRAME.registerComponent('collision', {
  // 最初に1回だけ呼ばれる
  init() {
    this.prev = this.el.object3D.position.clone(); // 1フレーム前の位置
  },

  // 毎フレーム呼ばれる（wasd-controls が動かした「あと」に実行される）
  tick() {
    const pos = this.el.object3D.position;
    if (isBlocked(pos.x, pos.z)) {
      // 壁に沿ってすべるように、x だけ・z だけ戻せるか試す
      if (!isBlocked(pos.x, this.prev.z)) {
        pos.z = this.prev.z;
      } else if (!isBlocked(this.prev.x, pos.z)) {
        pos.x = this.prev.x;
      } else {
        pos.x = this.prev.x;
        pos.z = this.prev.z;
      }
    }
    this.prev.copy(pos);
  }
});
