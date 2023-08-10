// import logo from "./logo.svg";
import "./App.css";

import { Environment, Html, Text, useGLTF } from "@react-three/drei";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import { AnimationMixer, Box3, Vector3 } from "three";

function App() {
  return (
    <div style={{ width: `100%`, height: `100%` }}>
      <Canvas
        gl={{
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <Content></Content>
        </Suspense>
      </Canvas>
      <div style={{ position: "fixed" }} id="boundingBOX"></div>

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

function toScreenPosition(obj, camera, renderer, offset = new Vector3()) {
  var vector = new Vector3();

  var widthHalf = 0.5 * renderer.getContext().canvas.width;
  var heightHalf = 0.5 * renderer.getContext().canvas.height;

  obj.updateMatrixWorld();
  vector.setFromMatrixPosition(obj.matrixWorld);

  vector.add(offset);
  vector.project(camera);

  vector.x = vector.x * widthHalf + widthHalf;
  vector.y = -(vector.y * heightHalf) + heightHalf;

  return {
    x: vector.x,
    y: vector.y,
  };
}

function Content() {
  let gltf = useGLTF(`/compress.glb`);

  let mixer = useMemo(() => {
    return new AnimationMixer(gltf.scene);
  }, [gltf]);
  useFrame((st, dt) => {
    mixer.update(dt);
  });

  let busName = "Logo2";
  let movingObject = false;

  gltf.scene.traverse((it) => {
    if (it.name === busName && !movingObject) {
      movingObject = it;
    }
  });

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

  let box3 = new Box3();
  let v30 = new Vector3(0, 0, 0);
  useFrame((st, dt) => {
    let activeCam = cameraOptions[1];
    if (activeCam) {
      activeCam.getWorldPosition(st.camera.position);
      activeCam.getWorldQuaternion(st.camera.quaternion);
    }

    if (movingObject) {
      v30.set(0, 0, 0);
      box3.set(v30, v30);
      box3.expandByObject(movingObject);
      let center = toScreenPosition(movingObject, st.camera, st.gl);

      let boundingBOX = document.querySelector("#boundingBOX");

      if (boundingBOX) {
        let sizeXY = 300;
        boundingBOX.style.top = `${center.y - sizeXY / 2}px`;
        boundingBOX.style.left = `${center.x - sizeXY / 2}px`;
        boundingBOX.style.width = `${sizeXY}px`;
        boundingBOX.style.height = `${sizeXY}px`;
        boundingBOX.style.background = "rgba(255,255,0,0.3)";
      }
    }
  });

  return (
    <>
      <Environment files={`/rural_asphalt_road_1k.hdr`}></Environment>
      <primitive object={gltf.scene}></primitive>
    </>
  );
}

export default App;
