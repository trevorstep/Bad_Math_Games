class GooseScene extends Phaser.Scene {
  constructor() {
    super("GooseScene");
    this.gameRunning = false;
    this.score = 0;
    this.hunger = 100;
    this.timeLeft = 75;
    this.invulnerableUntil = 0;
    this.lastBreadSfxAt = 0;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.cameras.main.setBackgroundColor("#7ecf8a");
    this.physics.world.setBounds(16, 16, width - 32, height - 32);
    this.initSfx();

    this.drawMap(width, height);
    this.createTextures();

    this.goose = this.physics.add.sprite(width * 0.5, height * 0.5, "goose");
    this.goose.setCollideWorldBounds(true);
    this.goose.setDrag(420, 420);
    this.goose.setMaxVelocity(260, 260);

    this.breads = this.physics.add.group();
    this.foxes = this.physics.add.group();

    for (let i = 0; i < 5; i += 1) {
      this.spawnBread();
    }

    for (let i = 0; i < 2; i += 1) {
      const fox = this.foxes.create(...this.randomPoint(width, height), "fox");
      fox.setCollideWorldBounds(true);
      fox.setBounce(1, 1);
      fox.setVelocity(Phaser.Math.Between(-120, 120), Phaser.Math.Between(-120, 120));
    }

    this.physics.add.overlap(this.goose, this.breads, (_, bread) => {
      bread.destroy();
      this.score += 10;
      this.hunger = Math.min(100, this.hunger + 18);
      this.spawnBread();
      if (this.time.now - this.lastBreadSfxAt > 60) {
        this.playSfx("bread");
        this.lastBreadSfxAt = this.time.now;
      }
      this.updateHud();
    });

    this.physics.add.overlap(this.goose, this.foxes, () => {
      if (this.time.now < this.invulnerableUntil || !this.gameRunning) {
        return;
      }

      this.invulnerableUntil = this.time.now + 900;
      this.hunger = Math.max(0, this.hunger - 28);
      this.goose.setTint(0xff8f8f);
      this.time.delayedCall(180, () => this.goose.clearTint());
      this.goose.setVelocity(Phaser.Math.Between(-260, 260), Phaser.Math.Between(-260, 260));
      this.playSfx("hit");
      this.updateHud();
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,R");

    this.hudText = this.add.text(20, 18, "", {
      fontFamily: "Verdana",
      fontSize: "18px",
      color: "#10233f",
      backgroundColor: "rgba(255,255,255,0.65)",
      padding: { x: 8, y: 6 },
    }).setDepth(10);

    this.messageText = this.add.text(width * 0.5, height - 24, "", {
      fontFamily: "Verdana",
      fontSize: "18px",
      color: "#1a1a1a",
      backgroundColor: "rgba(255,255,255,0.82)",
      padding: { x: 10, y: 6 },
      align: "center",
    }).setOrigin(0.5, 1).setDepth(10);

    this.updateHud();
    this.messageText.setText("Collect bread, dodge foxes. Reach 150 score before time runs out.");

    this.gameRunning = true;
    this.hungerEvent = this.time.addEvent({
      delay: 350,
      loop: true,
      callback: () => {
        if (!this.gameRunning) {
          return;
        }

        this.hunger = Math.max(0, this.hunger - 1.2);
        this.updateHud();
        if (this.hunger <= 0) {
          this.endGame(false, "Your goose got too hungry. Press R to restart.");
        }
      },
    });

    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (!this.gameRunning) {
          return;
        }

        this.timeLeft -= 1;
        this.updateHud();

        if (this.score >= 150) {
          this.endGame(true, "Champion goose achieved. Press R to play again.");
        } else if (this.timeLeft <= 0) {
          this.endGame(false, "Time up. Your goose needs more training. Press R to restart.");
        }
      },
    });
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
      this.scene.restart();
      return;
    }

    if (!this.gameRunning) {
      this.goose.setAcceleration(0, 0);
      this.goose.setVelocity(0, 0);
      return;
    }

    const speed = 260;
    const moveX = (this.cursors.left.isDown || this.keys.A.isDown ? -1 : 0) + (this.cursors.right.isDown || this.keys.D.isDown ? 1 : 0);
    const moveY = (this.cursors.up.isDown || this.keys.W.isDown ? -1 : 0) + (this.cursors.down.isDown || this.keys.S.isDown ? 1 : 0);

    this.goose.setAcceleration(moveX * speed * 3.2, moveY * speed * 3.2);

    if (moveX < 0) {
      this.goose.setFlipX(true);
    } else if (moveX > 0) {
      this.goose.setFlipX(false);
    }

    this.foxes.getChildren().forEach((fox) => {
      if (Phaser.Math.Between(0, 100) < 2) {
        this.physics.moveToObject(fox, this.goose, Phaser.Math.Between(80, 140));
      }
    });
  }

  drawMap(width, height) {
    const field = this.add.graphics();
    field.fillStyle(0x6cbc6f, 1);
    field.fillRoundedRect(16, 16, width - 32, height - 32, 18);

    field.lineStyle(6, 0x4f9f56, 0.9);
    field.strokeRoundedRect(16, 16, width - 32, height - 32, 18);

    const pond = this.add.graphics();
    pond.fillStyle(0x86d4f3, 0.95);
    pond.fillEllipse(width * 0.25, height * 0.72, 140, 90);
    pond.fillEllipse(width * 0.75, height * 0.28, 120, 80);
  }

  createTextures() {
    if (!this.textures.exists("goose")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xf2f2ea, 1);
      g.fillEllipse(18, 18, 28, 20);
      g.fillEllipse(28, 12, 14, 12);
      g.fillStyle(0xffa500, 1);
      g.fillTriangle(33, 12, 43, 9, 43, 15);
      g.fillStyle(0x111111, 1);
      g.fillCircle(30, 10, 2);
      g.generateTexture("goose", 44, 36);
      g.destroy();
    }

    if (!this.textures.exists("bread")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xcf9a65, 1);
      g.fillRoundedRect(2, 2, 20, 16, 5);
      g.fillStyle(0xe2b583, 1);
      g.fillRoundedRect(4, 4, 16, 12, 4);
      g.generateTexture("bread", 24, 20);
      g.destroy();
    }

    if (!this.textures.exists("fox")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xd35f29, 1);
      g.fillEllipse(16, 14, 26, 18);
      g.fillTriangle(9, 6, 13, 0, 16, 7);
      g.fillTriangle(21, 6, 25, 0, 28, 7);
      g.fillStyle(0x101010, 1);
      g.fillCircle(10, 13, 2);
      g.fillCircle(22, 13, 2);
      g.generateTexture("fox", 32, 24);
      g.destroy();
    }
  }

  spawnBread() {
    const bread = this.breads.create(...this.randomPoint(this.scale.width, this.scale.height), "bread");
    bread.setImmovable(true);
  }

  randomPoint(width, height) {
    return [
      Phaser.Math.Between(38, Math.max(39, width - 38)),
      Phaser.Math.Between(38, Math.max(39, height - 38)),
    ];
  }

  updateHud() {
    const clampedHunger = Math.max(0, Math.round(this.hunger));
    const clampedTime = Math.max(0, Math.round(this.timeLeft));
    this.hudText.setText(`Score: ${this.score}   Hunger: ${clampedHunger}%   Time: ${clampedTime}s`);
  }

  endGame(won, message) {
    this.gameRunning = false;
    this.goose.setAcceleration(0, 0);
    this.goose.setVelocity(0, 0);
    this.messageText.setText(message);
    if (won) {
      this.goose.setTint(0xb9ff8c);
      this.playSfx("win");
    } else {
      this.goose.setTint(0xff9b9b);
      this.playSfx("lose");
    }
  }

  initSfx() {
    this.audioContext = this.sound && this.sound.context ? this.sound.context : null;
    if (!this.audioContext) {
      return;
    }

    const unlock = () => {
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
    };

    this.input.once("pointerdown", unlock);
    this.input.keyboard.once("keydown", unlock);
  }

  tone(freq, duration, volume, type, offset = 0, toFreq = freq) {
    if (!this.audioContext || this.audioContext.state === "suspended") {
      return;
    }

    const when = this.audioContext.currentTime + offset;
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.linearRampToValueAtTime(toFreq, when + duration);

    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);

    osc.connect(gain);
    gain.connect(this.audioContext.destination);
    osc.start(when);
    osc.stop(when + duration + 0.01);
  }

  playSfx(kind) {
    if (!this.audioContext) {
      return;
    }

    if (kind === "bread") {
      this.tone(760, 0.08, 0.03, "triangle", 0, 920);
      return;
    }

    if (kind === "hit") {
      this.tone(220, 0.13, 0.05, "square", 0, 140);
      return;
    }

    if (kind === "win") {
      this.tone(520, 0.11, 0.04, "triangle", 0, 620);
      this.tone(720, 0.13, 0.04, "triangle", 0.12, 900);
      return;
    }

    if (kind === "lose") {
      this.tone(310, 0.12, 0.04, "sawtooth", 0, 240);
      this.tone(240, 0.18, 0.035, "sawtooth", 0.11, 160);
    }
  }
}