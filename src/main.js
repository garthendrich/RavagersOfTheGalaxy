import Collectibles from "./entities/Collectibles.js";
import Ship from "./entities/Ship.js";
import Sphere from "./entities/Sphere.js";
import { hasCollided } from "./events/objectCollision.js";
import addArrays from "./utils/addArrays.js";
import { getRandomNumber } from "./utils/randomizer.js";
import { playerInputs } from "./playerInputs.js";
import Renderer from "./Renderer.js";
import { selectItemFromArray } from "./utils/selectItemFromArray.js";

import {
  SHIP_Z_DISTANCE_FROM_CAMERA,
  FAR_BOUND,
  BULLET_INTERVAL_TIME,
  PLANET_INTERVAL_TIME,
  COLLECTIBLE_INTERVAL_TIME,
  SPHERE_SPHERE_COLLISION,
  ENTITY_SHIP_COLLISION,
  FIELD_OF_VIEW_DEGREES,
} from "./config.js";
import { getBackground } from "./utils/randomizeBackground.js";

// GLOBAL SCENE ATTRIBUTES
let shipHorizontalBound;
let shipVerticalBound;

const ship = new Ship(0, [0, -20, -SHIP_Z_DISTANCE_FROM_CAMERA]);
const planets = [];
const bullets = [];
const collectibles = [];

const colors = [
  [0.0, 0.0, 1.0, 1], // BLUE
  [0.0, 1.0, 0.0, 1], // GREEN
  [1.0, 0.0, 0.0, 1], // RED
  [0.0, 1.0, 1.0, 1],
  [1.0, 1.0, 0.0, 1],
  [1.0, 0.0, 1.0, 1],
];

let bulletColor = selectItemFromArray(colors, 0, colors.length);
let shipSpeed = 50;
let bulletSize = 2;

/** ----------------------------------
 *  Textures
 *  ----------------------------------
 */
const textures = {
  DEFAULT: "white-texture.jpeg",
  SIZE: "size-texture.png",
  SPEED: "speed-texture.png",
  COLOR: "color-texture.png",
  PLANET1: "planet-texture.png",
  PLANET2: "planet-texture-2.png",
  PLANET3: "planet-texture-3.png",
  PLANET4: "planet-texture-4.png",
  SHIP: "spaceship-texture-5.jpg",
};

// Canvas init
const canvas = document.querySelector("#screen");
const renderer = new Renderer(canvas, textures);

document.addEventListener("DOMContentLoaded", () => {
  const backgroundImg = document.getElementById("backgroundImg");
  backgroundImg.src = getBackground();
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  renderer.resize(window.innerWidth, window.innerHeight);

  const fieldOfViewRadians = (FIELD_OF_VIEW_DEGREES * Math.PI) / 180;
  shipVerticalBound =
    Math.tan(fieldOfViewRadians / 2) * SHIP_Z_DISTANCE_FROM_CAMERA;
  shipHorizontalBound =
    shipVerticalBound * (window.innerWidth / window.innerHeight);
}

// GLOBAL ANIMATION ATTRIBUTES
let currentTime = Date.now();
let lastFrameTime = 0;
let fpsCounter = 0;

let lastBulletFireTime = 0;

let lastPlanetSpawn = 0;
let lastCollectibleSpawn = 0;

// Animation Proper
window.requestAnimationFrame(loop);

function loop() {
  fpsCounter++;
  if (currentTime - lastFrameTime > 1000) {
    console.log("FPS: " + fpsCounter);
    fpsCounter = 0;
    lastFrameTime = currentTime;
  }

  moveShip();
  spawnBullet();
  spawnPlanet();
  spawnCollectible();
  despawnFarOffBullets();
  despawnPassedPlanets();
  manageEntityCollisions();

  const entities = [ship, ...bullets, ...planets, ...collectibles];
  for (const entity of entities) {
    entity.updatePosition();
  }
  renderer.renderEntities(entities);

  currentTime = Date.now();
  window.requestAnimationFrame(loop);
}

function moveShip() {
  const left = playerInputs.includes("KeyA");
  const right = playerInputs.includes("KeyD");
  const up = playerInputs.includes("KeyW");
  const down = playerInputs.includes("KeyS");

  if (left && !right && ship.origin[0] > -shipHorizontalBound) {
    ship.moveLeft(shipSpeed);
  } else if (right && !left && ship.origin[0] < shipHorizontalBound) {
    ship.moveRight(shipSpeed);
  } else {
    ship.stopXMovement();
  }

  if (up && !down && ship.origin[1] < shipVerticalBound) {
    ship.moveUp(shipSpeed);
  } else if (down && !up && ship.origin[1] > -shipVerticalBound) {
    ship.moveDown(shipSpeed);
  } else {
    ship.stopYMovement();
  }
}

function spawnBullet() {
  if (!playerInputs.includes("Space")) return;
  if (currentTime - lastBulletFireTime < BULLET_INTERVAL_TIME) return;

  const bullet = new Sphere(bulletSize, ship.origin);
  bullet.setColor(bulletColor);
  bullet.moveBack(2048);
  bullets.push(bullet);

  lastBulletFireTime = currentTime;
}

function spawnPlanet() {
  if (currentTime - lastPlanetSpawn < PLANET_INTERVAL_TIME) return;
  const planetX = getRandomNumber(-10, 10) * 8;
  const planetY = getRandomNumber(-10, 10) * 6;
  const planetSpawnPosition = addArrays(renderer.camera.position, [
    planetX,
    planetY,
    -3000,
  ]);
  const planetRad = getRandomNumber(1, 4) * 10;
  const planet = new Sphere(planetRad, planetSpawnPosition, true);
  planet.moveForth(300);
  planets.push(planet);

  lastPlanetSpawn = currentTime;
}

function spawnCollectible() {
  if (collectibles.length > 0) return;
  if (currentTime - lastCollectibleSpawn < COLLECTIBLE_INTERVAL_TIME) return;

  const collectibleX = getRandomNumber(-6, 6) * 10;
  const collectibleY = getRandomNumber(-6, 6) * 10;

  const collectible = new Collectibles(8, [
    collectibleX,
    collectibleY,
    -SHIP_Z_DISTANCE_FROM_CAMERA,
  ]);
  collectibles.push(collectible);

  lastCollectibleSpawn = currentTime;
}

function despawnFarOffBullets() {
  for (const [bulletIndex, bullet] of bullets.entries()) {
    if (bullet.getZ() < -FAR_BOUND) {
      bullets.splice(bulletIndex, 1);
    }
  }
}

function despawnPassedPlanets() {
  for (const [planetIndex, planet] of planets.entries()) {
    if (planet[2] > 100) {
      planets.splice(planetIndex, 1);
    }
  }
}

function manageEntityCollisions() {
  for (const [bulletIndex, bullet] of bullets.entries()) {
    for (const planet of planets) {
      if (hasCollided(SPHERE_SPHERE_COLLISION, planet, bullet)) {
        planet.setColor(bulletColor);
        bullets.splice(bulletIndex, 1);
      }
    }
  }

  for (const [collectibleIndex, collectible] of collectibles.entries()) {
    if (hasCollided(ENTITY_SHIP_COLLISION, ship, collectible)) {
      const behavior = collectible.selectedBehavior;
      const attribute = collectible.attribute;

      if (behavior == "COLOR") {
        bulletColor = attribute;
      } else if (behavior == "SIZE") {
        bulletSize = 1 * attribute;
      } else if (behavior == "SPEED") {
        shipSpeed = 50 * attribute;
      }
      collectibles.splice(collectibleIndex, 1);

      lastCollectibleSpawn = currentTime;
    }
  }
}
