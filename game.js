class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 100;
        this.scoreElement = document.getElementById('score');
        this.bulletSpeedElement = document.getElementById('bulletSpeed');
        this.bullets = [];
        this.targets = [];
        this.bulletSpeed = 5;
        this.bulletSpeedMin = 1;
        this.bulletSpeedMax = 15;
        this.bulletSpeedStep = 1;
        this.bulletSize = 5;
        this.targetMinSize = 20;
        this.targetMaxSize = 40;
        this.bulletLifetime = 200;
        this.targetSpeed = 1.5;
        this.maxTargets = 5;
        this.cannonAngle = -Math.PI/2; // 初始炮口朝上
        this.cannonRotateSpeed = 0.05; // 炮口旋转速度
        this.keyState = { ArrowLeft: false, ArrowRight: false }; // 添加按键状态对象

        this.canvas.addEventListener('click', this.shoot.bind(this));
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        this.init();
    }

    init() {
        this.createTarget();
        this.gameLoop();
    }

    createTarget() {
        if (this.targets.length >= this.maxTargets) return;

        // 随机选择生成边
        const side = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左
        let x, y;
        let velocityX, velocityY;
        
        // 随机大小和颜色
        const size = Math.random() * (this.targetMaxSize - this.targetMinSize) + this.targetMinSize;
        const color = `hsl(${Math.random() * 360}, 70%, 50%)`;

        // 根据选择的边设置初始位置和速度
        switch(side) {
            case 0: // 上边
                x = Math.random() * (this.canvas.width - size);
                y = -size;
                velocityX = (Math.random() - 0.5) * this.targetSpeed;
                velocityY = Math.random() * this.targetSpeed;
                break;
            case 1: // 右边
                x = this.canvas.width;
                y = Math.random() * (this.canvas.height - size);
                velocityX = -Math.random() * this.targetSpeed;
                velocityY = (Math.random() - 0.5) * this.targetSpeed;
                break;
            case 2: // 下边
                x = Math.random() * (this.canvas.width - size);
                y = this.canvas.height;
                velocityX = (Math.random() - 0.5) * this.targetSpeed;
                velocityY = -Math.random() * this.targetSpeed;
                break;
            case 3: // 左边
                x = -size;
                y = Math.random() * (this.canvas.height - size);
                velocityX = Math.random() * this.targetSpeed;
                velocityY = (Math.random() - 0.5) * this.targetSpeed;
                break;
        }

        this.targets.push({ x, y, size, color, velocityX, velocityY });
    }

    handleKeyDown(event) {
        if (event.code === 'Space') {
            this.shoot();
        } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            this.keyState[event.code] = true;
        } else if (event.code === 'ArrowUp' && this.bulletSpeed < this.bulletSpeedMax) {
            this.bulletSpeed += this.bulletSpeedStep;
            this.updateScore();
        } else if (event.code === 'ArrowDown' && this.bulletSpeed > this.bulletSpeedMin) {
            this.bulletSpeed -= this.bulletSpeedStep;
            this.updateScore();
        }
    }

    handleKeyUp(event) {
        if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
            this.keyState[event.code] = false;
        }
    }

    shoot(event) {
        if (this.score <= 0) return;

        const startX = this.canvas.width / 2;
        const startY = this.canvas.height - 20;

        // 使用炮口角度计算子弹方向
        const velocityX = Math.cos(this.cannonAngle) * this.bulletSpeed;
        const velocityY = Math.sin(this.cannonAngle) * this.bulletSpeed;

        this.bullets.push({
            x: startX,
            y: startY,
            velocityX,
            velocityY,
            size: this.bulletSize,
            lifetime: 0
        });

        this.score--;
        this.updateScore();
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        this.bulletSpeedElement.textContent = this.bulletSpeed;
    }

    checkCollision(bullet, target) {
        return bullet.x < target.x + target.size &&
               bullet.x + bullet.size > target.x &&
               bullet.y < target.y + target.size &&
               bullet.y + bullet.size > target.y;
    }

    update() {
        // 根据按键状态更新炮台角度
        if (this.keyState.ArrowLeft) {
            this.cannonAngle -= this.cannonRotateSpeed;
        }
        if (this.keyState.ArrowRight) {
            this.cannonAngle += this.cannonRotateSpeed;
        }

        // 确保始终有目标
        if (this.targets.length < this.maxTargets) {
            this.createTarget();
        }

        // 更新目标位置
        for (let i = this.targets.length - 1; i >= 0; i--) {
            const target = this.targets[i];
            target.x += target.velocityX;
            target.y += target.velocityY;

            // 检查目标是否完全离开屏幕
            if (target.x < -target.size || 
                target.x > this.canvas.width ||
                target.y < -target.size ||
                target.y > this.canvas.height) {
                this.targets.splice(i, 1);
                continue;
            }
        }

        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;
            bullet.lifetime++; // 增加生存时间

            // 检查生存时间，超过限制则移除子弹
            if (bullet.lifetime >= this.bulletLifetime) {
                this.bullets.splice(i, 1);
                continue;
            }

            // 边界反射
            if (bullet.x <= 0 || bullet.x >= this.canvas.width) {
                bullet.velocityX *= -1;
            }
            if (bullet.y <= 0 || bullet.y >= this.canvas.height) {
                bullet.velocityY *= -1;
            }

            // 检查与目标的碰撞
            for (let j = this.targets.length - 1; j >= 0; j--) {
                const target = this.targets[j];
                if (this.checkCollision(bullet, target)) {
                    this.bullets.splice(i, 1);
                    if (Math.random() < 0.5) {
                        this.targets.splice(j, 1);
                        this.score += 2;
                        this.updateScore();
                    }
                    break;
                }
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制目标
        this.targets.forEach(target => {
            this.ctx.fillStyle = target.color;
            this.ctx.fillRect(target.x, target.y, target.size, target.size);
        });

        // 绘制子弹
        this.ctx.fillStyle = '#000000';
        this.bullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, bullet.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // 绘制炮台
        this.ctx.save();
        this.ctx.translate(this.canvas.width / 2, this.canvas.height - 20);
        this.ctx.rotate(this.cannonAngle);
        this.ctx.fillStyle = '#0000ff';
        this.ctx.fillRect(-10, -10, 40, 20);
        this.ctx.restore();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.gameLoop.bind(this));
    }
}

// 启动游戏
window.onload = () => new Game();
