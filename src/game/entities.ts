export interface Vector2 {
  x: number;
  y: number;
}

export class Tank {
  id: string;
  pos: Vector2;
  vel: Vector2 = { x: 0, y: 0 };
  angle: number = 0;
  turretAngle: number = 0;
  health: number = 100;
  maxHealth: number = 100;
  speed: number = 150; // pixels per second
  color: string;
  isPlayer: boolean;
  cooldown: number = 0;
  maxCooldown: number = 0.5; // seconds
  radius: number = 20;

  constructor(id: string, x: number, y: number, color: string, isPlayer: boolean) {
    this.id = id;
    this.pos = { x, y };
    this.color = color;
    this.isPlayer = isPlayer;
    if (!isPlayer) {
      this.speed = 80;
      this.maxCooldown = 1.5;
    }
  }
}

export class Bullet {
  id: string;
  pos: Vector2;
  vel: Vector2;
  ownerId: string;
  radius: number = 4;
  damage: number = 25;
  life: number = 2; // seconds

  constructor(id: string, x: number, y: number, vx: number, vy: number, ownerId: string) {
    this.id = id;
    this.pos = { x, y };
    this.vel = { x: vx, y: vy };
    this.ownerId = ownerId;
  }
}

export class Particle {
  pos: Vector2;
  vel: Vector2;
  life: number;
  maxLife: number;
  color: string;
  size: number;

  constructor(x: number, y: number, vx: number, vy: number, life: number, color: string, size: number) {
    this.pos = { x, y };
    this.vel = { x: vx, y: vy };
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
  }
}
