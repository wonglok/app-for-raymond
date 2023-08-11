// import logo from "./logo.svg";
import "./App.css";

import { Environment, Html, Text, useGLTF } from "@react-three/drei";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useState } from "react";
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
  let [api, setAPI] = useState(false);
  return (
    <div style={{ width: `256px`, height: `256px` }}>
      <Canvas
        gl={{
          preserveDrawingBuffer: true,
        }}
      >
        <Suspense fallback={null}>
          <AgapeEngine
            onReady={(api) => {
              setAPI(api);
            }}
          ></AgapeEngine>
        </Suspense>
      </Canvas>

      {api && (
        <button
          onClick={async () => {
            for (let i = 0; i < 250; i++) {
              let result = api.onEachFrame({
                currentTime: api.duration * (i / 250),
                frameNumber: i,
                totalFrame: 250,
              });
              console.log(result);

              await new Promise((resolve) => {
                requestAnimationFrame(resolve);
              });
            }
          }}
        >
          Render All
        </button>
      )}
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

function AgapeEngine({ onReady = () => {} }) {
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
  });

  let get = useThree((r) => r.get);

  useEffect(() => {
    let api = {
      duration: animations[0].duration,
      onEachFrame: ({ currentTime = 0, frameNumber = 0, totalFrame = 1 }) => {
        mixer.setTime(currentTime);

        let st = get();

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
          for (
            let i = 0;
            i < boxHelper.geometry.attributes.position.count;
            i++
          ) {
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

          st.gl.render(st.scene, st.camera);

          let dataURL = st.gl.getContext().canvas.toDataURL();

          return {
            dataURL,
            sizerX,
            sizerY,
            x: box2.min.x,
            y: box2.min.y,
            frameNumber,
            totalFrame,
          };
        }
      },
    };
    onReady(api);

    return () => {
      //
    };
  }, [get]);

  return (
    <>
      <primitive object={boxHelper}></primitive>
      <Environment files={`/rural_asphalt_road_1k.hdr`}></Environment>
      <primitive object={gltf.scene}></primitive>
    </>
  );
}

export default App;
