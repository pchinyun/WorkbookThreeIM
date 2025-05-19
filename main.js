import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Octree } from "three/addons/math/Octree.js";
import { Capsule } from "three/addons/math/Capsule.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xaed35f);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const canvas = document.getElementById("experience-canvas");
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

const GRAVITY = 30;
const CAPSULE_RADIUS = 0.35;
const CAPSULE_HEIGHT = 1;
const JUMP_HEIGHT = 10;
const MOVE_SPEED = 25;

let character = {
  instance: null,
  isMoving: false,
  spawnPosition: new THREE.Vector3(),
};

let targetRotation = 0;

const colliderOctree = new Octree();
const playerCollider = new Capsule(
  new THREE.Vector3(0, CAPSULE_RADIUS, 0),
  new THREE.Vector3(0, CAPSULE_HEIGHT, 0),
  CAPSULE_RADIUS
);

let playerVelocity = new THREE.Vector3();
let playerOnFloor = false;

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.75;

const modalContent = {
  workbook: {
    title: "Workbook One",
    content: "Click to view workbook 1",
    link: "https://pchinyun.github.io/Interactive-media-workbook/",
  },
  kusama: {
    title: "Workbook Two",
    content: "This link will bring you to workbook 2",
    link: "https://pchinyun.github.io/Interactive-media-workbook2B/",
  },
  weekSeven: {
    title: "Week 7",
    content: "See what I did in week 7",
    link: "./week7.html",
  },
  weekEight: {
    title: "Week 8",
    content: "Why potatos? Check out week 8 to find out!",
    link: "./week8.html",
  },
  weekNine: {
    title: "Week 9",
    content: "See how the last class at the Telstra Creator Space went!",
    link: "./week9.html",
  },
  progress: {
    title: "Progress",
    content: "Curious about how I made this workbook?",
    link: "./progress.html",
  },
  handg: {
    title: "Hunt and Gather",
    content: "See what I found inspiring and interesting",
    link: "./handg.html",
  },
};

const modal = document.querySelector(".modal");
const modalTitle = document.querySelector(".modal-title");
const modalProjectDescription = document.querySelector(
  ".modal-project-description"
);
const modalExitButton = document.querySelector(".modal-exit-button");
const modalVisitProjectButton = document.querySelector(
  ".modal-project-visit-button"
);

function showModal(id) {
  const content = modalContent[id];
  if (content) {
    modalTitle.textContent = content.title;
    modalProjectDescription.textContent = content.content;
    modal.classList.toggle("hidden");
  }

  if (content.link) {
    modalVisitProjectButton.href = content.link;
    modalVisitProjectButton.classList.remove("hidden");
  } else {
    modalVisitProjectButton.classList.add("hidden");
  }
}

function hideModal() {
  modal.classList.toggle("hidden");
}

let intersectObject = "";
const intersectObjects = [];
const intersectObjectsNames = [
  "character",
  "workbook",
  "kusama",
  "telstra",
  "progress",
  "weekSeven",
  "weekEight",
  "weekNine",
  "handg",
];

const loader = new GLTFLoader();

loader.load(
  "./worldTwo.glb",
  function (glb) {
    glb.scene.traverse((child) => {
      if (intersectObjectsNames.includes(child.name)) {
        intersectObjects.push(child);
      }

      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }

      if (child.name === "character") {
        character.spawnPosition.copy(child.position);
        character.instance = child;
        playerCollider.start
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
        playerCollider.end
          .copy(child.position)
          .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));
      }
      if (child.name === "collider") {
        colliderOctree.fromGraphNode(child);
        child.visible = false;
      }
    });

    scene.add(glb.scene);
  },
  undefined,
  function (error) {
    console.error(error);
  }
);
// console.log(scene);

const sun = new THREE.DirectionalLight(0xffffff);
sun.castShadow = true;
sun.position.set(30, 30, 0);
sun.target.position.set(0, 0, 0);
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.normalBias = 0.8;
scene.add(sun);

// const shadowHelper = new THREE.CameraHelper(sun.shadow.camera);
// scene.add(shadowHelper);
// console.log(sun.shadow);

// const helper = new THREE.DirectionalLightHelper(sun, 5);
// scene.add(helper);

const light = new THREE.AmbientLight(0x404030, 5); // soft white light
scene.add(light);

const aspect = sizes.width / sizes.height;
const camera = new THREE.OrthographicCamera(
  -aspect * 50,
  aspect * 50,
  50,
  -50,
  1,
  1000
);
scene.add(camera);

camera.position.x = 61;
camera.position.y = 41;
camera.position.z = -76;

const cameraOffset = new THREE.Vector3(150, 50, -76);
camera.zoom = 3;
camera.updateProjectionMatrix();

function onResize() {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  const aspect = sizes.width / sizes.height;
  camera.left = -aspect * 50;
  camera.right = aspect * 50;
  camera.top = 50;
  camera.bottom = -50;
  camera.updateProjectionMatrix();

  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

function onClick() {
  if (intersectObject !== "") {
    showModal(intersectObject);
  }
}

function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function respawnCharacter() {
  character.instance.position.copy(character.spawnPosition);

  playerCollider.start
    .copy(character.spawnPosition)
    .add(new THREE.Vector3(0, CAPSULE_RADIUS, 0));
  playerCollider.end
    .copy(child.position)
    .add(new THREE.Vector3(0, CAPSULE_HEIGHT, 0));

  playerVelocity.set(0, 0, 0);
  character.isMoving = false;
}

function playerCollisions() {
  const result = colliderOctree.capsuleIntersect(playerCollider);
  playerOnFloor = false;

  if (result) {
    playerOnFloor = result.normal.y > 0;
    playerCollider.translate(result.normal.multiplyScalar(result.depth));

    if (playerOnFloor) {
      character.isMoving = false;
      playerVelocity.x = 0;
      playerVelocity.z = 0;
    }
  }
}
function updatePlayer() {
  if (!character.instance) return;

  if (character.instance.position.y < -20) {
    respawnCharacter();
    return;
  }

  if (!playerOnFloor) {
    playerVelocity.y -= GRAVITY * 0.045;
  }

  playerCollider.translate(playerVelocity.clone().multiplyScalar(0.01));

  playerCollisions();

  character.instance.position.copy(playerCollider.start);
  character.instance.position.y -= CAPSULE_RADIUS;

  let rotationDiff =
    ((((targetRotation - character.instance.rotation.y) % (2 * Math.PI)) +
      3 * Math.PI) %
      (2 * Math.PI)) -
    Math.PI;
  let finalRotation = character.instance.rotation.y + rotationDiff;

  character.instance.rotation.y = THREE.MathUtils.lerp(
    character.instance.rotation.y,
    finalRotation,
    0.4
  );
}

function onKeydown(event) {
  if (event.key.toLowerCase() === "r") {
    respawnCharacter();
    return;
  }

  if (character.isMoving) return;

  switch (event.key.toLowerCase()) {
    case "w":
    case "arrowup":
      playerVelocity.x -= MOVE_SPEED;
      targetRotation = -Math.PI / 2;
      break;
    case "a":
    case "arrowleft":
      playerVelocity.z += MOVE_SPEED;
      targetRotation = 0;
      break;
    case "s":
    case "arrowdown":
      playerVelocity.x += MOVE_SPEED;
      targetRotation = Math.PI / 2;
      break;
    case "d":
    case "arrowright":
      playerVelocity.z -= MOVE_SPEED;
      targetRotation = Math.PI;

      break;
    default:
      return;
  }

  playerVelocity.y = JUMP_HEIGHT;
  character.isMoving = true;
}

modalExitButton.addEventListener("click", hideModal);
window.addEventListener("resize", onResize);
window.addEventListener("click", onClick);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("keydown", onKeydown);

function animate() {
  updatePlayer();

  if (character.instance) {
    const targetCameraPosition = new THREE.Vector3(
      character.instance.position.x + cameraOffset.x,
      cameraOffset.y,
      character.instance.position.z + cameraOffset.z
    );
    camera.position.copy(targetCameraPosition);
    camera.lookAt(
      character.instance.position.x,
      camera.position.y - 39,
      character.instance.position.z
    );
  }

  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(intersectObjects);

  if (intersects.length > 0) {
    document.body.style.cursor = "pointer";
  } else {
    document.body.style.cursor = "default";
    intersectObject = "";
  }

  for (let i = 0; i < intersects.length; i++) {
    intersectObject = intersects[0].object.parent.name;
  }

  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
