class SaltScene extends Phaser.Scene {
  constructor() {
    super("SaltScene");
    this.isDrawing = false;
    this.lastDrawPoint = null;
    this.maxInkNodes = 360;
    this.drawNodeSpacing = 4;
    this.nodeScale = 0.65;
    this.inkNodesPlaced = 0;
    this.caughtSalt = 0;
    this.targetSalt = 90;
    this.spawnedSalt = 0;
    this.totalSaltToSpawn = 170;
    this.gameEnded = false;
    this.lastCatchSfxAt = 0;
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;

    this.physics.world.setBounds(0, 0, width, height);
    this.physics.world.gravity.y = 700;
    this.cameras.main.setBackgroundColor("#f4f0e4");
    this.initSfx();

    this.createTextures();
    this.drawBackdrop(width, height);

    this.lineGraphics = this.add.graphics().setDepth(3);
    this.barriers = this.physics.add.staticGroup();
    this.saltGroup = this.physics.add.group();

    const layout = this.generateLayout(width);
    this.spoutX = layout.spoutX;
    this.cupCenterX = layout.cupX;
    this.spoutY = 44;
    this.drawSpout();

    this.createCup(width, height);
    this.createUi(width, height);
    this.bindInput();

    this.physics.add.collider(this.saltGroup, this.barriers);
    this.physics.add.collider(this.saltGroup, this.cupWalls);
    this.physics.add.overlap(this.saltGroup, this.cupSensor, this.captureSalt, null, this);

    this.spawnEvent = this.time.addEvent({
      delay: 70,
      callback: this.spawnSalt,
      callbackScope: this,
      loop: true,
    });

    this.timeoutEvent = this.time.delayedCall(48000, () => {
      if (!this.gameEnded) {
        this.endGame(false, "Out of time. Press R to retry.");
      }
    });

    this.updateHud();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.restartKey)) {
      this.scene.restart();
      return;
    }

    if (this.gameEnded) {
      return;
    }

    this.saltGroup.getChildren().forEach((salt) => {
      if (!salt.active) {
        return;
      }

      const body = salt.body;
      if (body && body.blocked.down && Math.abs(body.velocity.x) < 8 && body.velocity.y < 32) {
        salt.setVelocityX(Phaser.Math.Between(-56, 56));
        salt.setVelocityY(-Phaser.Math.Between(8, 24));
      }

      if (salt.y > this.scale.height + 20 || salt.x < -20 || salt.x > this.scale.width + 20) {
        salt.destroy();
      }
    });

    const noSaltLeft = this.spawnedSalt >= this.totalSaltToSpawn && this.saltGroup.countActive(true) === 0;
    if (noSaltLeft && !this.gameEnded) {
      const won = this.caughtSalt >= this.targetSalt;
      this.endGame(won, won ? "Cup filled. You win. Press R to play again." : "Not enough salt in cup. Press R to retry.");
    }
  }

  createTextures() {
    if (!this.textures.exists("saltDot")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x1f2a38, 1);
      g.fillCircle(4, 4, 4);
      g.fillStyle(0xf8fbff, 1);
      g.fillCircle(4, 4, 2);
      g.generateTexture("saltDot", 8, 8);
      g.destroy();
    }

    if (!this.textures.exists("inkNode")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x324155, 1);
      g.fillCircle(4, 4, 4);
      g.generateTexture("inkNode", 8, 8);
      g.destroy();
    }
  }

  drawBackdrop(width, height) {
    const bg = this.add.graphics();
    bg.fillStyle(0xf7e7bf, 1);
    bg.fillRect(0, 0, width, height);

    bg.fillStyle(0xe3d3aa, 0.85);
    bg.fillRect(0, height - 68, width, 68);

    bg.lineStyle(2, 0xd6c18d, 0.55);
    for (let y = 30; y < height; y += 44) {
      bg.lineBetween(0, y, width, y + Phaser.Math.Between(-6, 6));
    }
  }

  drawSpout() {
    const spout = this.add.graphics();
    spout.fillStyle(0x6f7c87, 1);
    spout.fillRoundedRect(this.spoutX - 18, 8, 36, 34, 8);
    spout.fillStyle(0x5a646d, 1);
    spout.fillRect(this.spoutX - 6, 40, 12, 10);
  }

  createCup(width, height) {
    const cupCenterX = this.cupCenterX;
    const cupBottomY = height - 52;
    const cupWidth = 124;
    const cupHeight = 98;
    const wallThickness = 8;

    const cupGfx = this.add.graphics();
    cupGfx.lineStyle(6, 0x2c425d, 1);
    cupGfx.strokeRect(cupCenterX - cupWidth / 2, cupBottomY - cupHeight, cupWidth, cupHeight);

    this.cupWalls = this.physics.add.staticGroup();
    this.cupWalls.create(cupCenterX - cupWidth / 2, cupBottomY - cupHeight / 2, "inkNode")
      .setDisplaySize(wallThickness, cupHeight)
      .refreshBody();
    this.cupWalls.create(cupCenterX + cupWidth / 2, cupBottomY - cupHeight / 2, "inkNode")
      .setDisplaySize(wallThickness, cupHeight)
      .refreshBody();
    this.cupWalls.create(cupCenterX, cupBottomY, "inkNode")
      .setDisplaySize(cupWidth + wallThickness, wallThickness)
      .refreshBody();

    this.cupSensor = this.add.zone(cupCenterX, cupBottomY - cupHeight / 2, cupWidth - 16, cupHeight - 18);
    this.physics.add.existing(this.cupSensor, true);
    this.cupSensor.body.setSize(cupWidth - 16, cupHeight - 18, true);
  }

  generateLayout(width) {
    const shakerMinX = 42;
    const shakerMaxX = Math.max(43, width - 42);
    const cupMinX = 74;
    const cupMaxX = Math.max(75, width - 74);
    const minSeparation = 170;

    let spoutX = Phaser.Math.Between(shakerMinX, shakerMaxX);
    let cupX = Phaser.Math.Between(cupMinX, cupMaxX);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      if (Math.abs(spoutX - cupX) >= minSeparation) {
        break;
      }
      cupX = Phaser.Math.Between(cupMinX, cupMaxX);
    }

    return { spoutX, cupX };
  }

  createUi(width, height) {
    this.hudText = this.add.text(16, 14, "", {
      fontFamily: "Verdana",
      fontSize: "18px",
      color: "#1f2d3d",
      backgroundColor: "rgba(255,255,255,0.66)",
      padding: { x: 8, y: 6 },
    }).setDepth(20);

    this.messageText = this.add.text(width * 0.5, height - 10, "Draw with mouse/touch to guide salt into the cup. Press R to restart.", {
      fontFamily: "Verdana",
      fontSize: "16px",
      color: "#2a2a2a",
      backgroundColor: "rgba(255,255,255,0.82)",
      padding: { x: 10, y: 6 },
      align: "center",
    }).setOrigin(0.5, 1).setDepth(20);

    this.restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  bindInput() {
    this.input.on("pointerdown", (pointer) => {
      if (this.gameEnded) {
        return;
      }

      this.isDrawing = true;
      this.lastDrawPoint = new Phaser.Math.Vector2(pointer.x, pointer.y);
      this.lineGraphics.lineStyle(6, 0x324155, 1);
      this.lineGraphics.beginPath();
      this.lineGraphics.moveTo(pointer.x, pointer.y);
      this.playSfx("draw");
      this.addInkNode(pointer.x, pointer.y);
    });

    this.input.on("pointerup", () => {
      this.isDrawing = false;
      this.lastDrawPoint = null;
    });

    this.input.on("pointermove", (pointer) => {
      if (!this.isDrawing || !this.lastDrawPoint || this.gameEnded) {
        return;
      }

      const current = new Phaser.Math.Vector2(pointer.x, pointer.y);
      const distance = Phaser.Math.Distance.BetweenPoints(this.lastDrawPoint, current);
      if (distance < this.drawNodeSpacing) {
        return;
      }

      const steps = Math.floor(distance / this.drawNodeSpacing);
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        const x = Phaser.Math.Linear(this.lastDrawPoint.x, current.x, t);
        const y = Phaser.Math.Linear(this.lastDrawPoint.y, current.y, t);
        this.addInkNode(x, y);
      }

      this.lastDrawPoint = current;
    });
  }

  addInkNode(x, y) {
    if (this.inkNodesPlaced >= this.maxInkNodes) {
      return;
    }

    if (y < 10 || y > this.scale.height - 10 || x < 10 || x > this.scale.width - 10) {
      return;
    }

    const node = this.barriers.create(x, y, "inkNode");
    node.setScale(this.nodeScale).refreshBody();

    this.lineGraphics.lineTo(x, y);
    this.lineGraphics.strokePath();

    this.inkNodesPlaced += 1;
    this.updateHud();
  }

  spawnSalt() {
    if (this.gameEnded || this.spawnedSalt >= this.totalSaltToSpawn) {
      if (this.spawnedSalt >= this.totalSaltToSpawn) {
        this.spawnEvent.remove(false);
      }
      return;
    }

    const x = this.spoutX + Phaser.Math.Between(-5, 5);
    const salt = this.saltGroup.create(x, this.spoutY, "saltDot");
    salt.setCircle(4);
    salt.setBounce(0.05);
    salt.setCollideWorldBounds(true);
    salt.setVelocity(Phaser.Math.Between(-34, 34), Phaser.Math.Between(16, 30));
    salt.setMaxVelocity(300, 700);
    salt.setDrag(0, 0);

    this.spawnedSalt += 1;
    this.updateHud();
  }

  captureSalt(a, b) {
    const salt = a && a.texture && a.texture.key === "saltDot" ? a : b;
    if (!salt.active) {
      return;
    }

    salt.destroy();
    this.caughtSalt += 1;
    if (this.time.now - this.lastCatchSfxAt > 45) {
      this.playSfx("catch");
      this.lastCatchSfxAt = this.time.now;
    }
    this.updateHud();

    if (this.caughtSalt >= this.targetSalt && !this.gameEnded) {
      this.endGame(true, "Cup filled. You win. Press R to play again.");
    }
  }

  updateHud() {
    const inkLeft = Math.max(0, this.maxInkNodes - this.inkNodesPlaced);
    const remaining = Math.max(0, this.totalSaltToSpawn - this.spawnedSalt);
    this.hudText.setText(`In Cup: ${this.caughtSalt}/${this.targetSalt}   Ink: ${inkLeft}   Remaining: ${remaining}`);
  }

  endGame(won, message) {
    this.gameEnded = true;
    this.isDrawing = false;
    this.messageText.setText(message);

    if (this.spawnEvent) {
      this.spawnEvent.remove(false);
    }
    if (this.timeoutEvent) {
      this.timeoutEvent.remove(false);
    }

    if (won) {
      this.cameras.main.flash(260, 180, 240, 180);
      this.playSfx("win");
    } else {
      this.cameras.main.shake(220, 0.004);
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

    if (kind === "draw") {
      this.tone(280, 0.05, 0.025, "triangle", 0, 340);
      return;
    }

    if (kind === "catch") {
      this.tone(820, 0.045, 0.02, "sine", 0, 900);
      return;
    }

    if (kind === "win") {
      this.tone(500, 0.1, 0.035, "triangle", 0, 620);
      this.tone(700, 0.11, 0.035, "triangle", 0.1, 860);
      this.tone(900, 0.12, 0.03, "triangle", 0.21, 1100);
      return;
    }

    if (kind === "lose") {
      this.tone(280, 0.1, 0.04, "sawtooth", 0, 210);
      this.tone(210, 0.16, 0.035, "sawtooth", 0.1, 140);
    }
  }
}