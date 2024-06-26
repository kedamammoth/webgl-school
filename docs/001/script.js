import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.js";

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const wrapper = document.querySelector("#webgl");
    const app = new ThreeApp(wrapper);
    app.render();
  },
  false
);

class ThreeApp {
  /**
   * カメラ定義のための定数
   */
  static CAMERA_PARAM = {
    // fovy は Field of View Y のことで、縦方向の視野角を意味する
    fovy: 30,
    // 描画する空間のアスペクト比（縦横比）
    aspect: window.innerWidth / window.innerHeight,
    // 描画する空間のニアクリップ面（最近面）
    near: 0.1,
    // 描画する空間のファークリップ面（最遠面）
    far: 60.0,
    // カメラの座標
    position: new THREE.Vector3(-10.0, 10.0, -10.0),
    // カメラの注視点
    lookAt: new THREE.Vector3(0.0, 0.0, 0.0),
  };
  /**
   * レンダラー定義のための定数
   */
  static RENDERER_PARAM = {
    clearColor: 0xeeeeee, // 画面をクリアする色
    width: window.innerWidth, // レンダラーに設定する幅
    height: window.innerHeight, // レンダラーに設定する高さ
  };
  /**
   * 平行光源定義のための定数
   */
  static DIRECTIONAL_LIGHT_PARAM = {
    color: 0xffffff, // 光の色
    intensity: 5.0, // 光の強度
    position: new THREE.Vector3(1.0, 1.0, 1.0), // 光の向き
  };
  /**
   * アンビエントライト定義のための定数
   */
  static AMBIENT_LIGHT_PARAM = {
    color: 0xffffff, // 光の色
    intensity: 0.2, // 光の強度
  };
  /**
   * マテリアル定義のための定数
   */
  static MATERIAL_PARAM = {
    color: 0x250079, // マテリアルの基本色
  };

  renderer; // レンダラ
  scene; // シーン
  camera; // カメラ
  directionalLight; // 平行光源（ディレクショナルライト）
  ambientLight;
  spotLight; // 環境光（アンビエントライト）
  material; // マテリアル
  boxGeometry; // トーラスジオメトリ
  planeGeometry; // 平面ジオメトリ
  torusArray; // トーラスメッシュの配列 @@@
  controls; // オービットコントロール
  axesHelper; // 軸ヘルパー
  isDown; // キーの押下状態用フラグ

  /**
   * コンストラクタ
   * @constructor
   * @param {HTMLElement} wrapper - canvas 要素を append する親要素
   */
  constructor(wrapper) {
    // レンダラー
    const color = new THREE.Color(ThreeApp.RENDERER_PARAM.clearColor);
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setClearColor(color);
    this.renderer.setSize(
      ThreeApp.RENDERER_PARAM.width,
      ThreeApp.RENDERER_PARAM.height
    );
    wrapper.appendChild(this.renderer.domElement);

    // シーン
    this.scene = new THREE.Scene();

    // カメラ
    this.camera = new THREE.PerspectiveCamera(
      ThreeApp.CAMERA_PARAM.fovy,
      ThreeApp.CAMERA_PARAM.aspect,
      ThreeApp.CAMERA_PARAM.near,
      ThreeApp.CAMERA_PARAM.far
    );
    this.camera.position.copy(ThreeApp.CAMERA_PARAM.position);
    this.camera.lookAt(ThreeApp.CAMERA_PARAM.lookAt);

    // ディレクショナルライト（平行光源）
    this.directionalLight = new THREE.DirectionalLight(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.color,
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.intensity
    );
    this.directionalLight.position.copy(
      ThreeApp.DIRECTIONAL_LIGHT_PARAM.position
    );
    this.scene.add(this.directionalLight);

    // アンビエントライト（環境光）
    this.ambientLight = new THREE.AmbientLight(
      ThreeApp.AMBIENT_LIGHT_PARAM.color,
      ThreeApp.AMBIENT_LIGHT_PARAM.intensity
    );
    this.scene.add(this.ambientLight);

    // スポットライト光源を作成
    // new THREE.SpotLight(色, 光の強さ, 距離, 照射角, ボケ具合, 減衰率)
    // this.spotLight = new THREE.SpotLight(
    //   0xffffff,
    //   50,
    //   10,
    //   Math.PI / 180,
    //   80,
    //   0.1
    // );
    // this.spotLight.position.set(0, 5, -5);
    // this.scene.add(this.spotLight);

    // マテリアル
    // this.material = new THREE.MeshPhongMaterial(ThreeApp.MATERIAL_PARAM);
    this.material = new THREE.MeshLambertMaterial(ThreeApp.MATERIAL_PARAM);
    const planeMaterial = new THREE.MeshLambertMaterial(
      ThreeApp.MATERIAL_PARAM.planeColor
    );

    // 共通のジオメトリ、マテリアルから、複数のメッシュインスタンスを作成する @@@
    const boxCount = 900;
    const transformScale = 1;
    this.boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1);
    this.boxArray = [];
    for (let i = 0; i < boxCount; ++i) {
      // メッシュのインスタンスを生成
      const box = new THREE.Mesh(this.boxGeometry, this.material);
      // 座標を隙間なく正方形に並べる
      box.position.x = (i % 30) * transformScale - 10;
      box.position.y = 0;
      box.position.z = Math.floor(i / 30) * transformScale - 4;

      if (i === boxCount - 1) {
        this.boxArray.forEach((box, index) => {
          // 各ボックスの処理を200ミリ秒ずつ遅延させる
          let delay = index * 200;
          this.boxTransformYDown(box, delay);
        });
      }
      //1000後にboxTransformYUp関数が実行される
      setTimeout(() => {
        if (i === boxCount - 1) {
          this.boxArray.forEach((box, index) => {
            // 各ボックスの処理を200ミリ秒ずつ遅延させる
            let delay = index * 200;
            this.boxTransformYUp(box, delay);
          });
        }
      }, 10000);

      // シーンに追加
      this.scene.add(box);
      // 配列に入れておく
      this.boxArray.push(box);
    }

    // 平面ジオメトリ
    this.planeGeometry = new THREE.PlaneGeometry(100, 100, 100, 100);
    const plane = new THREE.Mesh(this.planeGeometry, this.material);
    plane.position.y = -0.5;
    plane.position.x = 4.5;
    plane.position.z = 0;
    plane.rotation.x = -Math.PI / 2;
    this.scene.add(plane);

    // コントロール
    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // this のバインド
    this.render = this.render.bind(this);

    // キーの押下状態を保持するフラグ
    this.isDown = false;

    //スペースキーを押すとchangeColor関数が実行される
    window.addEventListener(
      "keydown",
      (keyEvent) => {
        switch (keyEvent.key) {
          case " ":
            this.changeColor();
            break;
          default:
        }
      },
      false
    );

    // ウィンドウのリサイズを検出できるようにする
    window.addEventListener(
      "resize",
      () => {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
      },
      false
    );
  }

  boxTransformYDown = (box, delay) => {
    setTimeout(() => {
      let targetY = -1;
      let duration = 4;
      let currentTime = 0;
      let initialY = box.position.y;
      let timer = setInterval(() => {
        currentTime += 1 / 60;
        box.position.y =
          initialY + ((targetY - initialY) * currentTime) / duration;
        if (currentTime >= duration) {
          clearInterval(timer);
        }
      }, 1000 / 60);
    }, delay);
  };

  boxTransformYUp = (box, delay) => {
    setTimeout(() => {
      let targetY = 0;
      let duration = 4;
      let currentTime = 0;
      let initialY = box.position.y;
      let timer = setInterval(() => {
        currentTime += 1 / 60;
        box.position.y =
          initialY + ((targetY - initialY) * currentTime) / duration;
        if (currentTime >= duration) {
          clearInterval(timer);
        }
      }, 1000 / 60);
    }, delay);
  };

  //MATERIAL_PARAMのcolorが４色の中からランダムで選択される関数
  changeColor = () => {
    const colorArray = [0x250079, 0x4caf50, 0xffc107, 0xff5722];
    const randomColor =
      colorArray[Math.floor(Math.random() * colorArray.length)];
    this.material.color.set(randomColor);

    const svgLogos = document.querySelectorAll(".js-svg-logo");
    svgLogos.forEach((svgLogo) => {
      svgLogo.style.fill = `#${randomColor.toString(16)}`;
    });
  };

  /**
   * 描画処理
   */
  render() {
    // 恒常ループの設定
    requestAnimationFrame(this.render);

    // コントロールを更新
    // this.controls.update();

    // レンダラーで描画
    this.renderer.render(this.scene, this.camera);
  }
}
