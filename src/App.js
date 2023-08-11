// import logo from "./logo.svg";
import "./App.css";

import { Environment, Html, Text, useGLTF } from "@react-three/drei";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import { AnimationMixer, Box3, Object3D, Vector3 } from "three";

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

function toScreenPosition(obj, camera, renderer, offset = new Vector3()) {
  var vector = new Vector3();

  var widthHalf = (0.5 * renderer.getContext().canvas.width) / devicePixelRatio;
  var heightHalf =
    (0.5 * renderer.getContext().canvas.height) / devicePixelRatio;

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

  let box3 = useMemo(() => new Box3(), []);

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
      movingObject.geometry.computeBoundingBox();
      box3.copy(movingObject.geometry.boundingBox);
      movingObject.updateMatrixWorld();

      let center = toScreenPosition(movingObject, st.camera, st.gl);
      let max = toScreenPosition(movingObject, st.camera, st.gl, box3.max);
      let min = toScreenPosition(movingObject, st.camera, st.gl, box3.min);

      let boundingBOX = document.querySelector("#boundingBOX");

      if (boundingBOX) {
        st.camera.updateProjectionMatrix();

        let sizeX = max.x - min.x;
        let sizeY = max.y - min.y;

        sizeX = sizeX + 30.0;
        sizeY = sizeY + 30.0;

        boundingBOX.style.top = `${center.y - sizeY / 2}px`;
        boundingBOX.style.left = `${center.x - sizeX / 2}px`;
        boundingBOX.style.width = `${sizeX}px`;
        boundingBOX.style.height = `${sizeY}px`;
        boundingBOX.style.background = "rgba(255,255,0,0.3)";
      }

      let dataURL = st.gl.getContext().canvas.toDataURL();
      console.log(
        boundingBOX.style.top,
        boundingBOX.style.left,
        boundingBOX.style.width,
        boundingBOX.style.height
      );
      // console.log(dataURL);
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
