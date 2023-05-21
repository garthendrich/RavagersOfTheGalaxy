import addArrays from "../utils/addArrays.js";
import Entity from "./Entity.js";

export default class MovableEntity extends Entity {
  constructor(origin) {
    super(origin);

    this.dx = 0;
    this.dy = 0;
    this.dz = 0;
  }

  updatePosition() {
    if (this.lastPositionUpdate === undefined) {
      this.lastPositionUpdate = Date.now();
    }

    const deltaTime = (Date.now() - this.lastPositionUpdate) / 1000;

    this.origin = addArrays(this.origin, [
      this.dx * deltaTime,
      this.dy * deltaTime,
      this.dz * deltaTime,
    ]);

    this.lastPositionUpdate = Date.now();
  }

  moveLeft(movementSpeed) {
    this.dx = -movementSpeed;
  }

  moveRight(movementSpeed) {
    this.dx = movementSpeed;
  }

  stopXMovement() {
    this.dx = 0;
  }

  moveUp(movementSpeed) {
    this.dy = movementSpeed;
  }

  moveDown(movementSpeed) {
    this.dy = -movementSpeed;
  }

  stopYMovement() {
    this.dy = 0;
  }

  moveForth(movementSpeed) {
    this.dz = movementSpeed;
  }

  moveBack(movementSpeed) {
    this.dz = -movementSpeed;
  }

  stopZMovement() {
    this.dz = 0;
  }
}
