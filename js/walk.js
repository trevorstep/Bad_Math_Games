class WalkScene extends Phaser.Scene {
  preload() {
    this.load.json('data', 'assets/walk/data.json');
  }

  create() {
    const data = this.cache.json.get('data') || {};

    this.w = this.scale.width;
    this.h = this.scale.height;

    this.lanes = 4;
    this.laneWidth = Math.floor(this.w * 0.16);
    this.trackWidth = this.lanes * this.laneWidth;
    this.trackX = Math.floor((this.w - this.trackWidth) / 2);

    this.rowHeight = 96;
    this.rowGap = 28;
    this.rowStride = this.rowHeight + this.rowGap;
    this.scrollSpeed = 220;
    this.jumpDuration = 340;
    this.jumpHeight = 36;

    this.playerY = this.h - 120;
    this.playerLane = 1;
    this.rows = [];
    this.nextRowY = -this.rowStride;
    this.rowId = 0;

    this.score = 0;
    this.gameOver = false;
    this.jumpTimer = 0;

    this.drawBoard(data);
    this.createPlayer();
    this.createHUD();
    this.createControls();

    this.seedRows();
  }

  drawBoard(data) {
    this.add.rectangle(this.w / 2, this.h / 2, this.w, this.h, 0x08111e);
    this.add.rectangle(this.w / 2, this.h / 2, this.w, this.h, 0x11233b, 0.2);

    this.add.rectangle(this.w / 2, this.h / 2, this.trackWidth + 28, this.h, 0x0f1728, 1).setStrokeStyle(2, 0x314d70, 0.8);
    this.add.rectangle(this.w / 2, this.h / 2, this.trackWidth, this.h, 0x162742, 0.9);

    for (let i = 1; i < this.lanes; i++) {
      const x = this.trackX + i * this.laneWidth;
      this.add.line(0, 0, x, 0, x, this.h, 0x2b4567, 0.65).setLineWidth(2, 2);
    }

    this.add.text(16, 12, data.title || 'Walk', {
      color: '#ffffff',
      fontSize: '22px',
      fontStyle: 'bold'
    });

    this.add.text(this.w - 16, 12, 'A/D or Left/Right, W/Space jump, R restart', {
      color: '#ffe9a8',
      fontSize: '14px'
    }).setOrigin(1, 0);

    this.add.text(this.w / 2, this.h - 24, 'Stay on the tiles.', {
      color: '#d8f3dc',
      fontSize: '14px'
    }).setOrigin(0.5);

    const markerY = this.playerY + 24;
    this.add.line(0, 0, this.trackX, markerY, this.trackX + this.trackWidth, markerY, 0x7cc2ff, 0.35).setLineWidth(1, 1);
  }

  createPlayer() {
    this.player = this.add.container(0, this.playerY);
    this.bodyShape = this.add.ellipse(0, 12, 18, 28, 0x5cff6a, 1).setStrokeStyle(2, 0x0f5a1a, 1).setAlpha(1);
    this.head = this.add.circle(0, -18, 15, 0x79ff82, 1).setStrokeStyle(2, 0x0f5a1a, 1).setAlpha(1);
    this.eyeL = this.add.circle(-4.5, -20, 2, 0x06210b, 1).setAlpha(1);
    this.eyeR = this.add.circle(4.5, -20, 2, 0x06210b, 1).setAlpha(1);
    this.player.add([this.bodyShape, this.head, this.eyeL, this.eyeR]);
    this.player.setAlpha(1);
    this.player.setDepth(30);

    this.shadow = this.add.ellipse(0, this.playerY + 30, 38, 12, 0x02070f, 0.55)
      .setStrokeStyle(1, 0x7cc2ff, 0.25);
    this.shadow.setDepth(29);
    this.setPlayerLane(this.playerLane, true);
  }

  createHUD() {
    this.scoreText = this.add.text(this.w - 16, 34, 'Score: 0', {
      color: '#ffffff',
      fontSize: '16px'
    }).setOrigin(1, 0);

    this.statusText = this.add.text(this.w / 2, 10, 'Find the next tile lane and keep moving.', {
      color: '#bfe4ff',
      fontSize: '14px'
    }).setOrigin(0.5, 0);
  }

  createControls() {
    this.keys = this.input.keyboard.addKeys({
      leftA: Phaser.Input.Keyboard.KeyCodes.A,
      rightD: Phaser.Input.Keyboard.KeyCodes.D,
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      jumpW: Phaser.Input.Keyboard.KeyCodes.W,
      jumpSpace: Phaser.Input.Keyboard.KeyCodes.SPACE,
      restart: Phaser.Input.Keyboard.KeyCodes.R
    });
  }

  seedRows() {
    const startY = this.playerY + 10;
    const starterSpacing = Math.floor(this.rowHeight * 0.72);

    // Build a longer, forgiving starting runway in the current lane.
    for (let i = 0; i < 4; i++) {
      this.spawnRow(startY - i * starterSpacing, [this.playerLane]);
    }

    let y = startY - 4 * starterSpacing - this.rowGap;
    for (let i = 0; i < 14; i++) {
      this.spawnProceduralRow(y);
      y -= this.rowStride;
    }

    this.nextRowY = y;
  }

  spawnProceduralRow(y) {
    const safeCount = Phaser.Math.Between(1, 2);
    const safeLanes = [];

    if (this.rows.length > 0) {
      const prevSafe = this.rows[this.rows.length - 1].safeLanes;
      safeLanes.push(prevSafe[Phaser.Math.Between(0, prevSafe.length - 1)]);
    } else {
      safeLanes.push(Phaser.Math.Between(0, this.lanes - 1));
    }

    while (safeLanes.length < safeCount) {
      const lane = Phaser.Math.Between(0, this.lanes - 1);
      if (!safeLanes.includes(lane)) {
        safeLanes.push(lane);
      }
    }

    this.spawnRow(y, safeLanes);
  }

  spawnRow(y, safeLanes) {
    const tiles = [];

    for (let lane = 0; lane < this.lanes; lane++) {
      const x = this.trackX + lane * this.laneWidth + this.laneWidth / 2;
      const isSafe = safeLanes.includes(lane);
      const color = isSafe ? 0x6ec7ff : 0x20334d;
      const edge = isSafe ? 0xd8f2ff : 0x33506f;
      const tile = this.add.rectangle(x, y, this.laneWidth - 12, this.rowHeight, color, isSafe ? 0.95 : 0.65)
        .setStrokeStyle(2, edge, isSafe ? 0.55 : 0.25);
      tile.isSafe = isSafe;
      tile.lane = lane;
      tiles.push(tile);
    }

    this.rows.push({
      id: this.rowId++,
      y,
      checked: false,
      safeLanes,
      tiles
    });
  }

  update(_, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.scene.restart();
      return;
    }

    if (this.gameOver) {
      return;
    }

    const dt = delta / 1000;
    this.handleInput();
    this.updateJump(delta);
    this.scrollRows(dt);
    this.ensureRows();
    this.checkSupportAndFail();
  }

  handleInput() {
    if (Phaser.Input.Keyboard.JustDown(this.keys.leftA) || Phaser.Input.Keyboard.JustDown(this.keys.left)) {
      this.setPlayerLane(this.playerLane - 1);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.rightD) || Phaser.Input.Keyboard.JustDown(this.keys.right)) {
      this.setPlayerLane(this.playerLane + 1);
    }

    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jumpW) || Phaser.Input.Keyboard.JustDown(this.keys.jumpSpace);
    if (jumpPressed && this.jumpTimer <= 0) {
      this.jumpTimer = this.jumpDuration;
      this.statusText.setText('Jump!');
    }
  }

  setPlayerLane(nextLane, instant = false) {
    this.playerLane = Phaser.Math.Clamp(nextLane, 0, this.lanes - 1);
    const targetX = this.trackX + this.playerLane * this.laneWidth + this.laneWidth / 2;

    if (instant) {
      this.player.x = targetX;
      this.shadow.x = targetX;
      return;
    }

    this.tweens.add({
      targets: [this.player, this.shadow],
      x: targetX,
      duration: 85,
      ease: 'Quad.Out'
    });
  }

  updateJump(delta) {
    if (this.jumpTimer > 0) {
      this.jumpTimer -= delta;
      const t = Math.max(this.jumpTimer, 0) / this.jumpDuration;
      const lift = Math.sin((1 - t) * Math.PI) * this.jumpHeight;
      this.player.y = this.playerY - lift;
      this.shadow.scaleX = 1 - lift / 90;
      this.shadow.scaleY = 1 - lift / 110;
      this.shadow.alpha = 0.55 - lift / 60;
    } else {
      this.player.y = this.playerY;
      this.shadow.scaleX = 1;
      this.shadow.scaleY = 1;
      this.shadow.alpha = 0.55;
    }
  }

  scrollRows(dt) {
    const dy = this.scrollSpeed * dt;

    for (const row of this.rows) {
      row.y += dy;
      for (const tile of row.tiles) {
        tile.y = row.y;
      }

      if (!row.checked && row.y >= this.playerY + this.rowHeight * 0.45) {
        row.checked = true;
        this.score += 5;
        this.scoreText.setText('Score: ' + this.score);
      }
    }

    while (this.rows.length > 0 && this.rows[0].y > this.h + this.rowHeight) {
      const old = this.rows.shift();
      old.tiles.forEach(t => t.destroy());
    }
  }

  ensureRows() {
    const topMostY = this.rows.length > 0 ? this.rows[this.rows.length - 1].y : this.h;
    if (topMostY > -this.rowStride * 2) {
      this.spawnProceduralRow(this.nextRowY);
      this.nextRowY -= this.rowStride;
    }
  }

  checkSupportAndFail() {
    if (this.jumpTimer > 0) {
      return;
    }

    const supportRow = this.getClosestRowToPlayer();
    if (!supportRow) {
      this.failRun('Missed the path. Press R to retry.');
      return;
    }

    const safeHere = supportRow.safeLanes.includes(this.playerLane);
    if (!safeHere) {
      this.failRun('Wrong lane. Press R to retry.');
    }
  }

  getClosestRowToPlayer() {
    let best = null;
    let bestDist = Number.POSITIVE_INFINITY;

    for (const row of this.rows) {
      const dist = Math.abs(row.y - this.playerY);
      if (dist < bestDist && dist < this.rowHeight * 0.58) {
        best = row;
        bestDist = dist;
      }
    }

    return best;
  }

  failRun(message) {
    if (this.gameOver) {
      return;
    }

    this.gameOver = true;
    this.statusText.setText(message || 'Run over. Press R to retry.');

    this.add.rectangle(this.w / 2, this.h / 2, 460, 120, 0x000000, 0.65).setDepth(40);
    this.add.text(this.w / 2, this.h / 2 - 12, 'RUN OVER', {
      color: '#ffffff',
      fontSize: '38px',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(41);
    this.add.text(this.w / 2, this.h / 2 + 26, 'Press R to restart', {
      color: '#ffe9a8',
      fontSize: '18px'
    }).setOrigin(0.5).setDepth(41);
  }
}
