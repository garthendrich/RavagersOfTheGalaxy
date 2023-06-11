import Collectibles from "./entities/Collectibles.js";
import Ship from "./entities/Ship.js";
import Sphere from "./entities/Sphere.js";
import { hasCollided } from "./events/objectCollision.js";
import addArrays from "./utils/addArrays.js";
import { getRandomNumber } from "./utils/randomizer.js";

import {
  BULLET_INTERVAL_TIME,
  BULLET_MAX_DISTANCE_FROM_SHIP,
  PLANET_INTERVAL_TIME,
  PLANET_MAX_DISTANCE_FROM_SHIP,
  COLLECTIBLE_INTERVAL_TIME,
  SPHERE_SPHERE_COLLISION,
  ENTITY_SHIP_COLLISION,
} from "./config.js";
import { playerInputs } from "./playerInputs.js";
import Renderer from "./Renderer.js";

/** ---------------------------------
 * OBJECTS starts here
 * ----------------------------------
 */
const ship = new Ship(10, [0, -20, -150]);
const planets = [];
const bullets = [];
const collectibles = [];

let bulletR = getRandomNumber(1, 10) / 10;
let bulletG = getRandomNumber(1, 10) / 10;
let bulletB = getRandomNumber(1, 10) / 10;

let bulletColor = [bulletR, bulletG, bulletB, 1];
let shipSpeed = 50;
let bulletSize = 2;

let shipBoundPosX = 80;
let shipBoundPosY = 60;
let shipBoundNegX = -80;
let shipBoundNegY = -60;

/** ---------------------------------
 * OBJECTS ends here
 * ----------------------------------
 */

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

/** ----------------------------------
 *  Renderer proper
 *  ----------------------------------
 */

const canvas = document.querySelector("#screen");
const renderer = new Renderer(canvas, textures);

// Animation

let currentTime = Date.now();
let lastFrameTime = 0;
let fpsCounter = 0;

let lastBulletFireTime = 0;

let lastPlanetSpawn = 0;
let lastCollectibleSpawn = 0;

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

  if (collectibles.length === 0) {
    spawnCollectible();
  } else {
    if (hasCollided(ENTITY_SHIP_COLLISION, ship, collectibles[0])) {
      let behavior = collectibles[0].selectedBehavior;
      let attribute = collectibles[0].attribute;

      if (behavior == "COLOR") {
        bulletColor = attribute;
      } else if (behavior == "SIZE") {
        bulletSize = 1 * attribute;
      } else if (behavior == "SPEED") {
        shipSpeed = 50 * attribute;
      }
      collectibles.pop();
      lastCollectibleSpawn = currentTime;
    }
  }

  for (const [bulletIndex, bullet] of bullets.entries()) {
    const bulletDistanceFromShip = renderer.camera.position[2] - bullet.getZ(); // ! change camera z position to ship z: ship.getZ()
    if (bulletDistanceFromShip > BULLET_MAX_DISTANCE_FROM_SHIP) {
      bullets.splice(bulletIndex, 1);
      continue;
    }

    bullet.updatePosition();
    // // AFter updating position, check if bullet collided with planet
    for (let index = 0; index < planets.length; index++) {
      // if it has collided,
      if (hasCollided(SPHERE_SPHERE_COLLISION, planets[index], bullet)) {
        if (bulletColor === [1, 1, 1, 1]) {
          planets[index].setTexture("DEFAULT");
        }
        planets[index].setColor(bulletColor);
        bullets.splice(bulletIndex, 1);
      }
    }
  }

  // updates and destroys planets based on position
  for (const [planetIndex, planet] of planets.entries()) {
    const planetDistanceFromShip = renderer.camera.position[2] + planet.getZ(); // ! change camera z position to ship z: ship.getZ()
    if (planetDistanceFromShip > PLANET_MAX_DISTANCE_FROM_SHIP) {
      planets.splice(planetIndex, 1);
      continue;
    }

    planet.updatePosition();
  }

  //NOTE: ADD HERE COLLISION DESTRUCTION OF COLLECTIBLES
  //set lastCollectibleSpawn equal to currentTime

  ship.updatePosition();

  const objects = [ship, ...bullets, ...planets, ...collectibles];
  renderer.renderObjects(objects);

  currentTime = Date.now();
  window.requestAnimationFrame(loop);
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
  const planetX = getRandomNumber(-15, 15) * 10;
  const planetY = getRandomNumber(-15, 15) * 10;
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

// spawns collectibles
function spawnCollectible() {
  if (currentTime - lastCollectibleSpawn < COLLECTIBLE_INTERVAL_TIME) return;
  const collectibleX = getRandomNumber(-6, 6) * 10;
  const collectibleY = getRandomNumber(-6, 6) * 10;

  const collectible = new Collectibles(8, [collectibleX, collectibleY, -150]);
  collectibles.push(collectible);

  lastCollectibleSpawn = currentTime;
}

function moveShip() {
  const left = playerInputs.includes("KeyA");
  const right = playerInputs.includes("KeyD");
  const up = playerInputs.includes("KeyW");
  const down = playerInputs.includes("KeyS");

  if (left && !right && ship.origin[0] > shipBoundNegX) {
    ship.moveLeft(shipSpeed);
  } else if (right && !left && ship.origin[0] < shipBoundPosX) {
    ship.moveRight(shipSpeed);
  } else {
    ship.stopXMovement();
  }

  if (up && !down && ship.origin[1] < shipBoundPosY) {
    ship.moveUp(shipSpeed);
  } else if (down && !up && ship.origin[1] > shipBoundNegY) {
    ship.moveDown(shipSpeed);
  } else {
    ship.stopYMovement();
  }
}
