// import logo from "./logo.svg";
import "./App.css";

import { Environment, Html, Text, useGLTF } from "@react-three/drei";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  createRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
    <>
      <GUI glbFile={`/compress.glb`}></GUI>
      <GUI glbFile={`/compress.glb`}></GUI>
      <GUI glbFile={`/compress.glb`}></GUI>
    </>
  );
}
function GUI({ glbFile = `/compress.glb` }) {
  let [api, setAPI] = useState(false);

  let [url, setURL] = useState(false);

  let boundingBOX = useRef();
  //`/compress.glb`

  useEffect(() => {
    fetch(glbFile)
      .then((r) => {
        return r.blob();
      })
      .then((r) => {
        let url = URL.createObjectURL(r);
        setURL(url);
      });
  }, [glbFile]);
  return (
    <>
      <div
        style={{ width: `256px`, height: `256px`, position: "relative" }}
        className=""
      >
        <Canvas
          gl={{
            preserveDrawingBuffer: true,
          }}
        >
          <Suspense fallback={null}>
            {url && (
              <AgapeEngine
                boundingBOX={boundingBOX}
                glbURL={url}
                onReady={(api) => {
                  setAPI(api);
                }}
              ></AgapeEngine>
            )}
          </Suspense>
        </Canvas>

        <div
          style={{ position: "absolute", top: `0px`, left: `0px` }}
          ref={boundingBOX}
        ></div>
      </div>
      {api && (
        <>
          <button
            onClick={async () => {
              for (let i = 0; i < 500; i++) {
                let result = api.onEachFrame({
                  currentTime: api.duration * (i / 500),
                  frameNumber: i,
                  totalFrame: 500,
                });
                console.table([result]);

                await new Promise((resolve) => {
                  setTimeout(() => {
                    requestAnimationFrame(resolve);
                  });
                });
              }
            }}
          >
            Render All
          </button>

          <select
            defaultValue={api.getCurrentCameraIDX()}
            onChange={(event) => {
              api.setCurrentCameraIDX(event.target.value);
            }}
          >
            {api.cameraOptions.map((it, i) => {
              return (
                <option key={i} value={i}>
                  {it.name}
                </option>
              );
            })}
          </select>
        </>
      )}
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
      </div>{" "}
    </>
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

function AgapeEngine({
  boundingBOX,
  glbURL = `/compress.glb`,
  onReady = () => {},
}) {
  let gltf = useGLTF(glbURL);
  // gltf.scene = clone(gltf.scene);

  let currentCamera = useRef(1);
  let group = useMemo(() => {
    return new Object3D();
  }, []);
  let mixer = useMemo(() => {
    return new AnimationMixer(group);
  }, [group]);

  let busName = "Logo2";
  let movingObject = false;

  gltf.scene.traverse((it) => {
    if (it.name.includes(busName) && !movingObject) {
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

  let boxHelper = useMemo(() => new BoxHelper(), []);
  let box3 = useMemo(() => new Box3(), []);
  let box2 = useMemo(() => new Box2(), []);
  // let center = useMemo(() => new Vector3(), []);
  let size2d = useMemo(() => new Vector2(), []);
  let pt = useMemo(() => new Vector3(), []);
  let sph = useMemo(() => new Sphere(), []);
  useFrame((st, dt) => {
    let activeCam = cameraOptions[currentCamera.current];
    if (activeCam) {
      activeCam.getWorldPosition(st.camera.position);
      activeCam.getWorldQuaternion(st.camera.quaternion);
    }
  });

  let get = useThree((r) => r.get);

  let api = useMemo(
    () => {
      let api = {
        duration: animations[0].duration,
        getCurrentCameraIDX: () => {
          return currentCamera.current;
        },
        setCurrentCameraIDX: (idx) => {
          let st = get();

          currentCamera.current = idx;
          st.gl.render(st.scene, st.camera);
        },
        onEachFrame: ({ currentTime = 0, frameNumber = 0, totalFrame = 1 }) => {
          mixer.setTime(currentTime);
          let st = get();

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

            box2.getSize(size2d);
            let sizerX = size2d.x;
            let sizerY = size2d.y;

            if (boundingBOX.current) {
              boundingBOX.current.style.left = `${box2.min.x}px`;
              boundingBOX.current.style.top = `${box2.min.y}px`;
              boundingBOX.current.style.width = `${sizerX}px`;
              boundingBOX.current.style.height = `${sizerY}px`;
              boundingBOX.current.style.border = "rgba(255,0,0,1) solid 1px";
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

      return api;
    },
    [
      // animations,
      // box2,
      // box3,
      // boxHelper,
      // get,
      // mixer,
      // movingObject,
      // pt,
      // size2d,
      // sph,
    ]
  );
  api.cameraOptions = cameraOptions;
  useEffect(() => {
    if (!api) {
      return;
    }
    onReady(api);

    return () => {
      //
    };
  }, [api, onReady]);

  return (
    <>
      {/* <primitive object={boxHelper}></primitive> */}
      <Environment files={`/rural_asphalt_road_1k.hdr`}></Environment>
      {createPortal(<primitive object={gltf.scene}></primitive>, group)}

      <primitive object={group}></primitive>
    </>
  );
}

export default App;
