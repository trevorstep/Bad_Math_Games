class WBandFGScene extends Phaser.Scene {
  preload() {
    this.load.json('data', 'assets/WBandFG/data.json');
  }

  create() {
    try {
      const data = this.cache.json.get('data') || {};
      this.layoutVariant = Phaser.Math.Between(0, 2);
      this.viewWidth = this.scale.width;
      this.viewHeight = this.scale.height;
      this.physics.world.setBounds(0, 0, this.viewWidth, this.viewHeight);
      this.physics.world.gravity.y = 950;
      this.cameras.main.setBackgroundColor('#10253f');

      this.gameWon = false;
      this.waterBoyFinished = false;
      this.fireGirlFinished = false;
      this.respawnFlash = false;

      this.add.rectangle(this.viewWidth / 2, this.viewHeight / 2, this.viewWidth, this.viewHeight, 0x10253f);
      this.add.rectangle(this.viewWidth / 2, this.viewHeight / 2, this.viewWidth, this.viewHeight, 0x0c1422, 0.12);
      this.add.rectangle(this.viewWidth / 2, this.viewHeight - 16, this.viewWidth, 32, 0x27333e);
      this.add.circle(this.viewWidth * 0.17, this.viewHeight * 0.22, 72, 0x2b4968, 0.28);
      this.add.circle(this.viewWidth * 0.83, this.viewHeight * 0.18, 58, 0x6f4a5f, 0.20);
      this.add.rectangle(this.viewWidth / 2, 56, this.viewWidth, 72, 0x15304e, 0.20);

      this.add.text(20, 16, data.title || 'Water Boy and Fire Girl', {
        color: '#ffffff',
        fontSize: '28px',
        fontStyle: 'bold'
      }).setScrollFactor(0);

      this.statusText = this.add.text(this.viewWidth / 2, 18, 'WASD | Arrows | R', {
        color: '#d8f3dc',
        fontSize: '18px'
      }).setOrigin(0.5, 0).setScrollFactor(0);

      this.platforms = this.physics.add.staticGroup();
      this.hazards = this.physics.add.staticGroup();
      this.exitZones = this.physics.add.staticGroup();

      this.buildLevel();
      this.buildPlayers();
      this.buildControls();
      this.buildCollisions();

      this.input.keyboard.on('keydown-R', () => this.scene.restart());
    } catch (error) {
      this.cameras.main.setBackgroundColor('#120b1e');
      this.add.text(40, 40, 'Water Boy & Fire Girl failed to start.', {
        color: '#ffffff',
        fontSize: '28px',
        fontStyle: 'bold'
      });
      this.add.text(40, 90, String(error && error.message ? error.message : error), {
        color: '#ffb3b3',
        fontSize: '18px',
        wordWrap: { width: 1200 }
      });
    }
  }

  buildLevel() {
    const w = this.viewWidth;
    const h = this.viewHeight;
    const groundY = h - 40;
    const jitter = (amount) => Phaser.Math.Between(-amount, amount);

    const midPlatformY = [h - 120, h - 135, h - 150][this.layoutVariant];
    const highPlatformY = [h - 170, h - 182, h - 160][this.layoutVariant];
    const rightExitTop = [h - 228, h - 210, h - 240][this.layoutVariant];
    const waterPitX = Phaser.Math.Clamp(w * 0.30 + jitter(24), w * 0.24, w * 0.36);
    const firePitX = Phaser.Math.Clamp(w * 0.64 + jitter(24), w * 0.58, w * 0.70);
    const waterExitY = [h - 116, h - 132, h - 108][this.layoutVariant];

    this.makePlatform(w / 2, groundY, w, 40, 0x4b6275);
    this.makePlatform(w * 0.18, midPlatformY, w * 0.18, 22, 0x5a7284);
    this.makePlatform(w * 0.44, highPlatformY, w * 0.18, 22, 0x5a7284);
    this.makePlatform(w * 0.72, h - 135 + jitter(12), w * 0.16, 22, 0x5a7284);
    this.makePlatform(w * 0.86, rightExitTop, w * 0.10, 22, 0x5a7284);
    this.makePlatform(w * 0.86, h - 92 + jitter(10), w * 0.10, 22, 0x5a7284);

    this.makePlatform(w * 0.58, h - 260, 90, 18, 0x667f91);
    this.makePlatform(w * 0.50, h - 205, 72, 16, 0x667f91);

    this.waterPit = this.makeHazard(waterPitX, groundY - 24, w * 0.16, 30, 0x39a9ff, 'water');
    this.firePit = this.makeHazard(firePitX, groundY - 24, w * 0.16, 30, 0xff6b6b, 'fire');

    this.add.tween({
      targets: [this.waterPit, this.firePit],
      alpha: { from: 0.72, to: 0.98 },
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    this.add.text(waterPitX, groundY - 62, 'WATER', {
      color: '#39a9ff',
      fontSize: '16px'
    }).setOrigin(0.5);

    this.add.text(firePitX, groundY - 62, 'FIRE', {
      color: '#ff6b6b',
      fontSize: '16px'
    }).setOrigin(0.5);

    this.waterExit = this.makeExit(w * 0.90, waterExitY, 42, 72, 0x39a9ff, 'Water Boy Exit');
    this.fireExit = this.makeExit(w * 0.90, rightExitTop, 42, 72, 0xff6b6b, 'Fire Girl Exit');

    if (this.layoutVariant === 1) {
      this.makePlatform(w * 0.56, h - 250, 120, 20, 0x667f91);
    } else if (this.layoutVariant === 2) {
      this.makePlatform(w * 0.33, h - 220, 110, 20, 0x667f91);
    }
  }

  makePlatform(x, y, width, height, color) {
    const platform = this.add.rectangle(x, y, width, height, color);
    this.physics.add.existing(platform, true);
    this.platforms.add(platform);
    return platform;
  }

  makeHazard(x, y, width, height, color, type) {
    const hazard = this.add.rectangle(x, y, width, height, color, 0.9);
    this.physics.add.existing(hazard, true);
    hazard.hazardType = type;
    this.hazards.add(hazard);
    return hazard;
  }

  makeExit(x, y, width, height, color, label) {
    const exit = this.add.rectangle(x, y, width, height, color, 0.95);
    this.physics.add.existing(exit, true);
    exit.body.enable = true;
    exit.exitLabel = this.add.text(x, y - 34, label, {
      color: color === 0x39a9ff ? '#39a9ff' : '#ff6b6b',
      fontSize: '14px'
    }).setOrigin(0.5);
    this.exitZones.add(exit);
    return exit;
  }

  buildPlayers() {
    const h = this.viewHeight;
    this.waterBoy = this.createPlayer(80, h - 100, 0x39a9ff, 'Water Boy');
    this.fireGirl = this.createPlayer(150, h - 100, 0xff6b6b, 'Fire Girl');
  }

  createPlayer(x, y, color, label) {
    const player = this.add.rectangle(x, y, 32, 46, color);
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);
    player.body.setMaxVelocity(270, 600);
    player.body.setDragX(1600);
    player.body.setSize(32, 46);
    player.spawnX = x;
    player.spawnY = y;
    player.label = label;
    player.dead = false;
    player.finished = false;
    player.tag = this.add.text(x, y - 38, label, {
      color: '#ffffff',
      fontSize: '14px'
    }).setOrigin(0.5);
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

    this.waterBoy.tag.setPosition(this.waterBoy.x, this.waterBoy.y - 38);
    this.fireGirl.tag.setPosition(this.fireGirl.x, this.fireGirl.y - 38);

    if (this.waterBoy.y > this.viewHeight + 40) {
      this.respawn(this.waterBoy);
    }
    if (this.fireGirl.y > this.viewHeight + 40) {
      this.respawn(this.fireGirl);
    }
  }

  updatePlayer(player, leftKey, rightKey, jumpKey) {
    if (player.dead || player.finished) {
      player.body.setVelocityX(0);
      return;
    }

    const moveSpeed = 230;
    const jumpSpeed = 480;

    if (leftKey.isDown) {
      player.body.setVelocityX(-moveSpeed);
    } else if (rightKey.isDown) {
      player.body.setVelocityX(moveSpeed);
    }

    if (jumpKey.isDown && player.body.blocked.down) {
      player.body.setVelocityY(-jumpSpeed);
    }
  }

  handleHazard(player, hazard) {
    if (player.dead || player.finished || this.gameWon) {
      return;
    }

    const hazardType = hazard.hazardType;
    const lethal = (player.label === 'Water Boy' && hazardType === 'fire') ||
      (player.label === 'Fire Girl' && hazardType === 'water');

    if (!lethal) {
      return;
    }

    this.respawn(player, player.label + ' touched the wrong element.');
  }

  respawn(player, message) {
    if (this.respawnFlash) {
      return;
    }

    this.respawnFlash = true;
    this.cameras.main.flash(160, 255, 255, 255);
    player.x = player.spawnX;
    player.y = player.spawnY;
    player.body.reset(player.spawnX, player.spawnY);
    player.setAlpha(1);
    player.dead = false;
    player.tag.setPosition(player.x, player.y - 38);
    this.statusText.setText(message || 'Back to the start.');

    this.time.delayedCall(180, () => {
      this.respawnFlash = false;
    });
  }

  tryFinish(player, expectedType) {
    if (player.dead || player.finished || this.gameWon) {
      return;
    }

    if ((expectedType === 'water' && player.label === 'Water Boy') ||
        (expectedType === 'fire' && player.label === 'Fire Girl')) {
      player.finished = true;
      player.body.setVelocity(0, 0);
      player.setAlpha(0.9);

      if (player.label === 'Water Boy') {
        this.waterBoyFinished = true;
      } else {
        this.fireGirlFinished = true;
      }

      this.statusText.setText(player.label + ' made it out.');

      if (this.waterBoyFinished && this.fireGirlFinished) {
        this.winGame();
      }
    }
  }

  winGame() {
    this.gameWon = true;
    this.statusText.setText('Success! Both characters escaped.');

    this.add.rectangle(this.viewWidth / 2, this.viewHeight / 2, 520, 150, 0x000000, 0.7);
    this.add.text(this.viewWidth / 2, this.viewHeight / 2 - 28, 'YOU WIN', {
      color: '#ffffff',
      fontSize: '52px',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(this.viewWidth / 2, this.viewHeight / 2 + 24, 'Press R to play again.', {
      color: '#ffd166',
      fontSize: '22px'
    }).setOrigin(0.5);
  }
}
