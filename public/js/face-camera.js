// =============================================
// 文字（名札・看板）がいつもプレイヤーの方を向くようにする
//
// a-text は表からしか見えないので、横や後ろから見ると消えてしまう。
// そこで毎フレーム、プレイヤーの方向に左右（y軸）だけ回転させる。
// （上下には傾けないので、文字はまっすぐ立ったまま）
//
// 使い方：<a-text face-camera ...>
// ※ コンポーネントは <a-scene> より前に読み込む必要があるので、
//   このファイルは index.html の <head> で読み込んでいる
// =============================================

AFRAME.registerComponent('face-camera', {
  init() {
    this.myPos = new THREE.Vector3(); // 自分の位置を入れる箱（毎回作ると重いので使い回す）
  },

  tick() {
    const camPos = this.el.sceneEl.camera.el.object3D.position; // プレイヤーの位置
    this.el.object3D.getWorldPosition(this.myPos);             // 自分の位置（世界の中での位置）

    // プレイヤーへの方向の角度を計算して、そっちを向く
    const dx = camPos.x - this.myPos.x;
    const dz = camPos.z - this.myPos.z;
    this.el.object3D.rotation.y = Math.atan2(dx, dz);
  }
});
