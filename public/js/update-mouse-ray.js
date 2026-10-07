// =============================================
// マウスの「光線（レイ）」を毎フレーム更新する
//
// A-Frame の cursor="rayOrigin: mouse" は、マウスを「動かしたとき」しか
// 光線の位置を計算し直さない。
// そのため「商品にマウスを乗せる → マウスを動かさずに WASD で遠くへ歩く」と、
// 光線が元の場所に残ったままになり、遠くからでもクリックできてしまう。
//
// そこで、最後のマウス位置を覚えておき、毎フレーム光線を計算し直す。
//
// 使い方：<a-scene cursor="rayOrigin: mouse" update-mouse-ray>
// ※ <a-scene> より前に読み込む必要があるので、index.html の <head> で読み込んでいる
// =============================================

AFRAME.registerComponent('update-mouse-ray', {
  init() {
    this.lastMouseEvent = null; // 最後のマウスの動き
    window.addEventListener('mousemove', (e) => { this.lastMouseEvent = e; });
  },

  tick() {
    if (!this.lastMouseEvent) return;
    // cursor コンポーネントの「マウスが動いたときの処理」を、自分で呼んであげる
    this.el.components.cursor.onMouseMove(this.lastMouseEvent);
  }
});
