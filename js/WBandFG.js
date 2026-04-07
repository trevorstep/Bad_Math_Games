class WBandFGScene extends Phaser.Scene {
  preload() {
    this.load.json('data', 'assets/WBandFG/data.json');
  }

  create() {
    const data = this.cache.json.get('data') || {};

    this.viewWidth = this.scale.width;
    this.viewHeight = this.scale.height;
    this.layoutVariant = Phaser.Math.Between(0, 2);
    this.physics.world.setBounds(0, 0, this.viewWidth, this.viewHeight);
    this.physics.world.gravity.y = 950;

    this.audioCtx = null;
    this.gameWon = false;
    this.waterBoyFinished = false;
    this.fireGirlFinished = false;
    this.respawnFlash = false;

    this.drawBackground();

    this.add.text(20, 16, data.title || 'Water Boy and Fire Girl', {
      color: '#ffffff',
        fontSize: '18px',
      fontStyle: 'bold'
    }).setScrollFactor(0).setDepth(20);

      this.statusText = this.add.text(this.viewWidth - 20, 16, 'Reach your exit.', {
        color: '#ffe9a8',
        fontSize: '14px',
        backgroundColor: '#0b1320',
        padding: { x: 8, y: 4 }
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(20);

    this.platforms = this.physics.add.staticGroup();
    this.hazards = this.physics.add.staticGroup();

    this.buildLevel();
    this.buildPlayers();
    this.buildControls();
    this.buildCollisions();

    this.input.keyboard.on('keydown', () => this.ensureAudioContext());
    this.input.keyboard.on('keydown-R', () => this.scene.restart());
  }

  drawBackground() {
    const w = this.viewWidth;
    const h = this.viewHeight;

    this.add.rectangle(w / 2, h / 2, w, h, 0x10253f);
    this.add.rectangle(w / 2, h / 2, w, h, 0x0b1320, 0.12);
    this.add.circle(w * 0.15, h * 0.22, 78, 0x2b4968, 0.32);
    this.add.circle(w * 0.85, h * 0.18, 60, 0x6f4a5f, 0.22);
    this.add.rectangle(w / 2, h - 18, w, 36, 0x27333e);
    this.add.rectangle(w / 2, 58, w, 72, 0x15304e, 0.18);

    this.add.text(w / 2, h - 24, 'Water Boy stays wet. Fire Girl stays warm.', {
      color: '#d8f3dc',
      fontSize: '13px'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(20);
  }

  buildLevel() {
    const w = this.viewWidth;
    const h = this.viewHeight;
    const groundY = h - 40;
    const jitter = (amount) => Phaser.Math.Between(-amount, amount);

    const midPlatformY = [h - 140, h - 125, h - 150][this.layoutVariant];
    const highPlatformY = [h - 210, h - 185, h - 170][this.layoutVariant];
    const rightTopY = [h - 250, h - 225, h - 235][this.layoutVariant];
    const waterPitX = Phaser.Math.Clamp(w * 0.28 + jitter(16), w * 0.22, w * 0.34);
    const firePitX = Phaser.Math.Clamp(w * 0.60 + jitter(16), w * 0.54, w * 0.68);
    const waterExitY = [h - 124, h - 142, h - 112][this.layoutVariant];

    this.makePlatform(w / 2, groundY, w, 40, 0x4b6275);
    this.makePlatform(w * 0.18, midPlatformY, w * 0.18, 22, 0x5a7284);
    this.makePlatform(w * 0.44, highPlatformY, w * 0.18, 22, 0x5a7284);
    this.makePlatform(w * 0.72, h - 150 + jitter(10), w * 0.16, 22, 0x5a7284);
    this.makePlatform(w * 0.86, rightTopY, w * 0.10, 22, 0x5a7284);
    this.makePlatform(w * 0.86, h - 96 + jitter(10), w * 0.10, 22, 0x5a7284);
    this.makePlatform(w * 0.56, h - 260, 120, 18, 0x667f91);

    this.waterHazard = this.makeHazard(waterPitX, groundY - 14, 98, 26, 'water');
    this.fireHazard = this.makeHazard(firePitX, groundY - 14, 98, 26, 'fire');

    this.waterExit = this.makeDoor(w * 0.90, waterExitY, 'water');
    this.fireExit = this.makeDoor(w * 0.90, rightTopY, 'fire');

    if (this.layoutVariant === 1) {
      this.makePlatform(w * 0.34, h - 225, 110, 18, 0x667f91);
    } else if (this.layoutVariant === 2) {
      this.makePlatform(w * 0.50, h - 225, 110, 18, 0x667f91);
    }
  }

  makePlatform(x, y, width, height, color) {
    const platform = this.add.rectangle(x, y, width, height, color);
    platform.setStrokeStyle(2, 0x9eb1c1, 0.4);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
    return platform;
  }

  makeHazard(x, y, width, height, elementType) {
    const color = elementType === 'water' ? 0x39a9ff : 0xff6b6b;
    const glow = elementType === 'water' ? 0xbbe9ff : 0xffd166;
    const hazard = this.add.rectangle(x, y, width, height, color, 0.95);
    hazard.setStrokeStyle(2, glow, 0.6);
    this.physics.add.existing(hazard, true);
    hazard.hazardType = elementType;
    this.hazards.add(hazard);

    if (elementType === 'water') {
      this.add.circle(x - 22, y + 1, 6, glow, 0.95).setDepth(14);
      this.add.circle(x, y - 3, 7, glow, 0.95).setDepth(14);
      this.add.circle(x + 22, y + 1, 6, glow, 0.95).setDepth(14);
    } else {
      this.add.triangle(x - 20, y + 10, x - 10, y - 10, x, y + 10, color, 0.95).setDepth(14);
      this.add.triangle(x, y + 10, x + 10, y - 12, x + 20, y + 10, color, 0.95).setDepth(14);
    }

    this.tweens.add({
      targets: hazard,
      alpha: { from: 0.82, to: 1 },
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    return hazard;
  }

  makeDoor(x, y, elementType) {
    const color = elementType === 'water' ? 0x39a9ff : 0xff6b6b;
    const accent = elementType === 'water' ? 0xd8f3ff : 0xfff0c2;
    const door = this.add.rectangle(x, y, 42, 74, color, 0.96);
    door.setStrokeStyle(3, accent, 0.55);
    this.physics.add.existing(door, true);
    door.exitType = elementType;
    door.exitLabel = this.add.text(x, y - 34, elementType === 'water' ? 'WATER EXIT' : 'FIRE EXIT', {
      color: accent,
      fontSize: '13px'
    }).setOrigin(0.5).setDepth(15);
    this.add.rectangle(x - 5, y, 18, 54, 0x0d1220, 0.7).setDepth(13);
    this.add.circle(x + 13, y + 2, 2.5, 0xffffff, 0.95).setDepth(14);
    return door;
  }

  buildPlayers() {
    const h = this.viewHeight;
    this.waterBoy = this.createPlayer(72, h - 95, 0x39a9ff, 'Water Boy', 'water');
    this.fireGirl = this.createPlayer(140, h - 95, 0xff6b6b, 'Fire Girl', 'fire');
  }

  createPlayer(x, y, color, label, elementType) {
    const player = this.add.rectangle(x, y, 28, 44, color, 0);
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);
    player.body.setMaxVelocity(280, 600);
    player.body.setDragX(1600);
    player.body.setSize(34, 48);
    player.spawnX = x;
    player.spawnY = y;
    player.label = label;
    player.elementType = elementType;
    player.dead = false;
    player.finished = false;

    player.bodyShape = this.add.ellipse(x, y + 10, 18, 28, color, 1).setDepth(10);
      player.head = this.add.circle(x, y - 18, 15, color, 1).setDepth(11);
    player.eye1 = this.add.circle(x - 4, y - 20, 1.8, 0xffffff, 1).setDepth(12);
      player.eye2 = this.add.circle(x + 4.5, y - 20, 2, 0xffffff, 1).setDepth(12);

    return player;
  }

  buildControls() {
    this.cursors = this.input.keyboard.addKeys({
      p1Left: Phaser.Input.Keyboard.KeyCodes.A,
      p1Right: Phaser.Input.Keyboard.KeyCodes.D,
      p1Jump: Phaser.Input.Keyboard.KeyCodes.W,
      p2Left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      p2Right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      p2Jump: Phaser.Input.Keyboard.KeyCodes.UP
    });
  }

  buildCollisions() {
    this.physics.add.collider(this.waterBoy, this.platforms);
    this.physics.add.collider(this.fireGirl, this.platforms);

    this.physics.add.overlap(this.waterBoy, this.hazards, (player, hazard) => this.handleHazard(player, hazard));
    this.physics.add.overlap(this.fireGirl, this.hazards, (player, hazard) => this.handleHazard(player, hazard));

    this.physics.add.overlap(this.waterBoy, this.waterExit, () => this.tryFinish(this.waterBoy, 'water'));
    this.physics.add.overlap(this.fireGirl, this.fireExit, () => this.tryFinish(this.fireGirl, 'fire'));
  }

  update() {
    if (this.gameWon) {
      return;
    }

    this.updatePlayer(this.waterBoy, this.cursors.p1Left, this.cursors.p1Right, this.cursors.p1Jump);
    this.updatePlayer(this.fireGirl, this.cursors.p2Left, this.cursors.p2Right, this.cursors.p2Jump);

    this.syncPlayerDecor(this.waterBoy);
    this.syncPlayerDecor(this.fireGirl);

    if (this.waterBoy.y > this.viewHeight + 50) {
      this.respawn(this.waterBoy, 'Back to start.');
    }
    if (this.fireGirl.y > this.viewHeight + 50) {
      this.respawn(this.fireGirl, 'Back to start.');
    }
  }

  syncPlayerDecor(player) {
    player.bodyShape.setPosition(player.x, player.y + 12);
    player.head.setPosition(player.x, player.y - 18);
    player.eye1.setPosition(player.x - 4.5, player.y - 20);
    player.eye2.setPosition(player.x + 4.5, player.y - 20);
  }

  updatePlayer(player, leftKey, rightKey, jumpKey) {
    if (player.dead || player.finished) {
      player.body.setVelocityX(0);
      return;
    }

    const moveSpeed = 230;
    const jumpSpeed = 490;

    if (leftKey.isDown) {
      player.body.setVelocityX(-moveSpeed);
    } else if (rightKey.isDown) {
      player.body.setVelocityX(moveSpeed);
    }

    if (Phaser.Input.Keyboard.JustDown(jumpKey) && player.body.blocked.down) {
      this.playSfx('jump');
      player.body.setVelocityY(-jumpSpeed);
    }
  }

  handleHazard(player, hazard) {
    if (player.dead || player.finished || this.gameWon) {
      return;
    }

    const wrongElement = (player.label === 'Water Boy' && hazard.hazardType === 'fire') ||
      (player.label === 'Fire Girl' && hazard.hazardType === 'water');

    if (!wrongElement) {
      return;
    }

    this.playSfx('hurt');
    this.respawn(player, 'Wrong element. Back to start.');
  }

  respawn(player, message) {
    if (this.respawnFlash) {
      return;
    }

    this.respawnFlash = true;
    this.cameras.main.flash(120, 255, 255, 255);

    player.dead = true;
    player.body.stop();
    player.body.reset(player.spawnX, player.spawnY);
    player.setPosition(player.spawnX, player.spawnY);
    player.dead = false;
    player.setAlpha(1);
    this.syncPlayerDecor(player);
    this.statusText.setText(message || 'Back to start.');

    this.playSfx('respawn');

    this.time.delayedCall(180, () => {
      this.respawnFlash = false;
    });
  }

  tryFinish(player, expectedType) {
    if (player.dead || player.finished || this.gameWon) {
      return;
    }

    const correct = (expectedType === 'water' && player.label === 'Water Boy') ||
      (expectedType === 'fire' && player.label === 'Fire Girl');

    if (!correct) {
      return;
    }

    player.finished = true;
    player.body.setVelocity(0, 0);
    player.setAlpha(0.94);
    this.playSfx('door');

    if (player.label === 'Water Boy') {
      this.waterBoyFinished = true;
    } else {
      this.fireGirlFinished = true;
    }

    this.statusText.setText(player.label + ' made it out.');
    this.playSfx('success');

    if (this.waterBoyFinished && this.fireGirlFinished) {
      this.winGame();
    }
  }

  winGame() {
    this.gameWon = true;
    this.statusText.setText('Success! Both characters escaped.');

    this.add.rectangle(this.viewWidth / 2, this.viewHeight / 2, 520, 150, 0x000000, 0.68).setDepth(30);
    this.add.text(this.viewWidth / 2, this.viewHeight / 2 - 26, 'YOU WIN', {
      color: '#ffffff',
      fontSize: '50px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(31);
    this.add.text(this.viewWidth / 2, this.viewHeight / 2 + 24, 'Press R to play again.', {
      color: '#ffe9a8',
      fontSize: '22px'
    }).setOrigin(0.5).setDepth(31);

    this.playSfx('success');
  }

  ensureAudioContext() {
    if (this.audioCtx) {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }

    this.audioCtx = new AudioCtor();
  }

  playTone(frequency, duration, type, gainValue, endFrequency) {
    this.ensureAudioContext();
    if (!this.audioCtx) {
      return;
    }

    const now = this.audioCtx.currentTime;
    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = type || 'sine';
    oscillator.frequency.setValueAtTime(frequency, now);
    if (endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
    }

    gainNode.gain.setValueAtTime(gainValue || 0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }

  playSfx(name) {
    const sfx = {
      jump: () => this.playTone(640, 0.08, 'square', 0.04, 820),
      hurt: () => this.playTone(160, 0.12, 'sawtooth', 0.03, 90),
      respawn: () => this.playTone(220, 0.10, 'triangle', 0.03, 440),
      door: () => this.playTone(360, 0.08, 'sine', 0.03, 540),
      success: () => {
        this.playTone(523, 0.10, 'triangle', 0.035, 659);
        this.time.delayedCall(90, () => this.playTone(659, 0.10, 'triangle', 0.035, 784));
        this.time.delayedCall(180, () => this.playTone(784, 0.14, 'triangle', 0.04, 988));
      }
    };

    if (sfx[name]) {
      sfx[name]();
    }
  }
}
