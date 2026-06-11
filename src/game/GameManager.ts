import { Tank, Bullet, Particle, Vector2 } from './entities';

export class GameManager {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  
  width: number;
  height: number;
  
  player: Tank;
  enemies: Tank[] = [];
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  
  keys: { [key: string]: boolean } = {};
  mouse: Vector2 = { x: 0, y: 0 };
  isMouseDown: boolean = false;
  
  lastTime: number = 0;
  score: number = 0;
  isGameOver: boolean = false;
  
  enemySpawnTimer: number = 0;
  
  onGameOver: (score: number) => void;
  onScoreUpdate: (score: number) => void;
  onHealthUpdate: (health: number, maxHealth: number) => void;

  constructor(
    canvas: HTMLCanvasElement,
    onGameOver: (score: number) => void,
    onScoreUpdate: (score: number) => void,
    onHealthUpdate: (health: number, maxHealth: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    this.onGameOver = onGameOver;
    this.onScoreUpdate = onScoreUpdate;
    this.onHealthUpdate = onHealthUpdate;
    
    this.player = new Tank('player', this.width / 2, this.height / 2, '#238636', true);
    
    this.setupInputs();
  }

  setupInputs() {
    window.addEventListener('keydown', (e) => { this.keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
    
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
    });
    
    this.canvas.addEventListener('mousedown', () => { this.isMouseDown = true; });
    this.canvas.addEventListener('mouseup', () => { this.isMouseDown = false; });
  }

  start() {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loop(currentTime: number) {
    if (this.isGameOver) return;
    
    const dt = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;
    
    this.update(dt);
    this.draw();
    
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt: number) {
    // Player movement
    let moveX = 0;
    let moveY = 0;
    
    if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveX += 1;
    
    if (moveX !== 0 || moveY !== 0) {
      const len = Math.sqrt(moveX * moveX + moveY * moveY);
      moveX /= len;
      moveY /= len;
      
      this.player.angle = Math.atan2(moveY, moveX);
    }
    
    this.player.pos.x += moveX * this.player.speed * dt;
    this.player.pos.y += moveY * this.player.speed * dt;
    
    // Clamp player to bounds
    this.player.pos.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.pos.x));
    this.player.pos.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.pos.y));
    
    // Player Turret
    this.player.turretAngle = Math.atan2(this.mouse.y - this.player.pos.y, this.mouse.x - this.player.pos.x);
    
    // Player Shooting
    if (this.player.cooldown > 0) this.player.cooldown -= dt;
    if (this.isMouseDown && this.player.cooldown <= 0) {
      this.shoot(this.player, this.mouse.x, this.mouse.y);
      this.player.cooldown = this.player.maxCooldown;
    }
    
    // Enemy Spawning
    this.enemySpawnTimer -= dt;
    if (this.enemySpawnTimer <= 0) {
      this.spawnEnemy();
      this.enemySpawnTimer = Math.max(1.0, 3.0 - this.score * 0.1); // Spawns faster as score increases
    }
    
    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Move towards player slowly
      const dx = this.player.pos.x - enemy.pos.x;
      const dy = this.player.pos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      enemy.turretAngle = Math.atan2(dy, dx);
      
      if (dist > 150) {
        enemy.angle = Math.atan2(dy, dx);
        enemy.pos.x += Math.cos(enemy.angle) * enemy.speed * dt;
        enemy.pos.y += Math.sin(enemy.angle) * enemy.speed * dt;
      }
      
      // Enemy shooting
      if (enemy.cooldown > 0) enemy.cooldown -= dt;
      if (enemy.cooldown <= 0 && dist < 400) {
        // Add some inaccuracy
        const inaccuracy = (Math.random() - 0.5) * 0.4;
        const targetX = this.player.pos.x + Math.cos(enemy.turretAngle + inaccuracy) * 100;
        const targetY = this.player.pos.y + Math.sin(enemy.turretAngle + inaccuracy) * 100;
        this.shoot(enemy, targetX, targetY);
        enemy.cooldown = enemy.maxCooldown;
      }
    }
    
    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.life -= dt;
      
      if (b.life <= 0 || b.pos.x < 0 || b.pos.x > this.width || b.pos.y < 0 || b.pos.y > this.height) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      // Collision with player
      if (b.ownerId !== 'player') {
        const dx = b.pos.x - this.player.pos.x;
        const dy = b.pos.y - this.player.pos.y;
        if (Math.sqrt(dx * dx + dy * dy) < this.player.radius + b.radius) {
          this.player.health -= b.damage;
          this.onHealthUpdate(this.player.health, this.player.maxHealth);
          this.createExplosion(this.player.pos.x, this.player.pos.y, b.ownerId === 'player' ? '#238636' : '#da3633', 10);
          this.bullets.splice(i, 1);
          
          if (this.player.health <= 0) {
            this.gameOver();
          }
          continue;
        }
      }
      
      // Collision with enemies
      if (b.ownerId === 'player') {
        let hit = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const enemy = this.enemies[j];
          const dx = b.pos.x - enemy.pos.x;
          const dy = b.pos.y - enemy.pos.y;
          if (Math.sqrt(dx * dx + dy * dy) < enemy.radius + b.radius) {
            enemy.health -= b.damage;
            hit = true;
            this.createExplosion(b.pos.x, b.pos.y, '#eab308', 5);
            
            if (enemy.health <= 0) {
              this.createExplosion(enemy.pos.x, enemy.pos.y, '#da3633', 30);
              this.enemies.splice(j, 1);
              this.score += 10;
              this.onScoreUpdate(this.score);
            }
            break;
          }
        }
        if (hit) {
          this.bullets.splice(i, 1);
        }
      }
    }
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  shoot(tank: Tank, targetX: number, targetY: number) {
    const angle = Math.atan2(targetY - tank.pos.y, targetX - tank.pos.x);
    const speed = 400; // bullet speed
    
    // Calculate tip of turret
    const tipX = tank.pos.x + Math.cos(angle) * (tank.radius + 15);
    const tipY = tank.pos.y + Math.sin(angle) * (tank.radius + 15);
    
    const bullet = new Bullet(
      Math.random().toString(),
      tipX, tipY,
      Math.cos(angle) * speed,
      Math.sin(angle) * speed,
      tank.id
    );
    this.bullets.push(bullet);
    
    // Muzzle flash particle
    this.createExplosion(tipX, tipY, '#fbbf24', 3);
  }

  spawnEnemy() {
    // Spawn off-screen
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    if (side === 0) { x = Math.random() * this.width; y = -50; }
    else if (side === 1) { x = this.width + 50; y = Math.random() * this.height; }
    else if (side === 2) { x = Math.random() * this.width; y = this.height + 50; }
    else { x = -50; y = Math.random() * this.height; }
    
    this.enemies.push(new Tank(Math.random().toString(), x, y, '#da3633', false));
  }

  createExplosion(x: number, y: number, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 50;
      const life = Math.random() * 0.3 + 0.1;
      const size = Math.random() * 4 + 2;
      this.particles.push(new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, life, color, size));
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.createExplosion(this.player.pos.x, this.player.pos.y, '#238636', 50);
    setTimeout(() => {
      this.onGameOver(this.score);
    }, 1000);
  }

  draw() {
    // Clear background entirely to show CSS gradients and backgrounds underneath
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // Draw particles
    for (const p of this.particles) {
      this.ctx.globalAlpha = p.life / p.maxLife;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.pos.x, p.pos.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1.0;
    
    // Draw bullets
    for (const b of this.bullets) {
      this.ctx.fillStyle = b.ownerId === 'player' ? '#f2cc60' : '#f85149';
      this.ctx.beginPath();
      this.ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Bullet glow
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
    
    // Draw enemies
    for (const enemy of this.enemies) {
      this.drawTank(enemy);
    }
    
    // Draw player
    if (!this.isGameOver) {
      this.drawTank(this.player);
      
      // Draw crosshair
      this.ctx.strokeStyle = '#8b949e';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(this.mouse.x, this.mouse.y, 8, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.mouse.x - 12, this.mouse.y);
      this.ctx.lineTo(this.mouse.x + 12, this.mouse.y);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(this.mouse.x, this.mouse.y - 12);
      this.ctx.lineTo(this.mouse.x, this.mouse.y + 12);
      this.ctx.stroke();
    }
  }

  drawTank(tank: Tank) {
    this.ctx.save();
    this.ctx.translate(tank.pos.x, tank.pos.y);
    
    // Draw body
    this.ctx.save();
    this.ctx.rotate(tank.angle);
    
    // Tracks
    this.ctx.fillStyle = '#010409';
    this.ctx.fillRect(- tank.radius + 5, - tank.radius - 5, tank.radius * 2 - 10, 8);
    this.ctx.fillRect(- tank.radius + 5, tank.radius - 3, tank.radius * 2 - 10, 8);
    
    // Hull
    this.ctx.fillStyle = tank.color;
    this.ctx.fillRect(- tank.radius + 5, - tank.radius + 5, tank.radius * 2 - 10, tank.radius * 2 - 10);
    
    this.ctx.restore();
    
    // Draw turret
    this.ctx.save();
    this.ctx.rotate(tank.turretAngle);
    
    // Barrel
    this.ctx.fillStyle = tank.isPlayer ? '#3fb950' : '#a42624';
    this.ctx.fillRect(0, -4, tank.radius + 15, 8);
    
    // Turret center
    this.ctx.fillStyle = tank.isPlayer ? '#3fb950' : '#da3633';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, tank.radius - 8, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.restore();
    
    // Health bar
    this.ctx.fillStyle = '#f85149';
    this.ctx.fillRect(-15, -tank.radius - 15, 30, 4);
    this.ctx.fillStyle = '#3fb950';
    this.ctx.fillRect(-15, -tank.radius - 15, 30 * (tank.health / tank.maxHealth), 4);
    
    this.ctx.restore();
  }
}
