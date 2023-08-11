// import logo from "./logo.svg";
import "./App.css";

import { Environment, Html, Text, useGLTF } from "@react-three/drei";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import {
  AnimationMixer,
  Box2,
  Box3,
  BoxHelper,
  Matrix4,
  Object3D,
  Sphere,
  Vector2,
  Vector3,
} from "three";

function App() {
  return (
    <div style={{ width: `256px`, height: `256px` }}>
      <Canvas
        gl={{
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <Content></Content>
        </Suspense>
      </Canvas>

      <div
        style={{ position: "fixed", top: `0px`, left: `0px` }}
        id="boundingBOX"
      ></div>

      <div
        style={{
          position: `fixed`,
          top: `0%`,
          right: `0%`,
          width: "300px",
          backgroundColor: "white",
        }}
      >
        {`"The Stanley Plaza, Hong Kong" (https://skfb.ly/6SKoo) by Peter93 is licensed under Creative Commons Attribution (http://creativecommons.org/licenses/by/4.0/).`}
      </div>
    </div>
  );
}

function toScreenPosition(camera, renderer, offset = new Vector3()) {
  var vector = new Vector3();

  var widthHalf = (0.5 * renderer.getContext().canvas.width) / devicePixelRatio;
  var heightHalf =
    (0.5 * renderer.getContext().canvas.height) / devicePixelRatio;

  vector.add(offset);
  vector.project(camera);

  vector.x = vector.x * widthHalf + widthHalf;
  vector.y = -(vector.y * heightHalf) + heightHalf;

  return new Vector2(vector.x, vector.y);
}

function Content({ onReady = () => {} }) {
  let gltf = useGLTF(`/compress.glb`);

  let mixer = useMemo(() => {
    return new AnimationMixer(gltf.scene);
  }, [gltf]);

  let busName = "Logo2";
  let movingObject = false;

  let cameraOptions = [];
  gltf.scene.traverse((it) => {
    if (it.isCamera) {
      cameraOptions.push(it);
    }
  });

  let animations = gltf.animations;
  useEffect(() => {
    animations.forEach((it) => {
      let action = mixer.clipAction(it);
      action.reset().play();
    });
  }, [animations, gltf.scene, mixer]);

  let boxHelper = useMemo(() => new BoxHelper(), []);
  let box3 = useMemo(() => new Box3(), []);
  let box2 = useMemo(() => new Box2(), []);
  // let center = useMemo(() => new Vector3(), []);
  let size2d = useMemo(() => new Vector2(), []);
  let pt = useMemo(() => new Vector3(), []);
  let sph = useMemo(() => new Sphere(), []);
  useFrame((st, dt) => {
    let activeCam = cameraOptions[1];
    if (activeCam) {
      activeCam.getWorldPosition(st.camera.position);
      activeCam.getWorldQuaternion(st.camera.quaternion);
    }

    gltf.scene.traverse((it) => {
      if (it.name === busName && !movingObject) {
        movingObject = it;
      }
    });

    if (movingObject) {
      boxHelper.setFromObject(movingObject);

      box3.makeEmpty();
      box2.makeEmpty();
      movingObject.updateMatrixWorld(true);
      for (let i = 0; i < boxHelper.geometry.attributes.position.count; i++) {
        pt.fromBufferAttribute(boxHelper.geometry.attributes.position, i);
        // pt.applyMatrix4(movingObject.matrixWorld);
        let expand = toScreenPosition(st.camera, st.gl, pt);
        box2.expandByPoint(expand);
      }

      box3.getBoundingSphere(sph);

      let boundingBOX = document.querySelector("#boundingBOX");
      box2.getSize(size2d);
      let sizerX = size2d.x;
      let sizerY = size2d.y;

      if (boundingBOX) {
        boundingBOX.style.left = `${box2.min.x}px`;
        boundingBOX.style.top = `${box2.min.y}px`;
        boundingBOX.style.width = `${sizerX}px`;
        boundingBOX.style.height = `${sizerY}px`;
        boundingBOX.style.border = "rgba(255,0,0,1) solid 1px";
      }
      let dataURL = st.gl.getContext().canvas.toDataURL();
      console.table([
        { dataURL, sizerX, sizerY, x: box2.min.x, y: box2.min.y },
      ]);
    }
  });

  useEffect(() => {
    let api = {
      onEachFrame: () => {
        let dt = 1 / 60;
        mixer.update(dt);
      },
    };
    onReady(api);

    return () => {};
  });

  return (
    <>
      <primitive object={boxHelper}></primitive>
      <Environment files={`/rural_asphalt_road_1k.hdr`}></Environment>
      <primitive object={gltf.scene}></primitive>
    </>
  );
}

export default App;
