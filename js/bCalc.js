class BadCalcScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BadCalcScene' });
  }

  preload() {
    this.load.json('data', 'assets/bCalc/data.json');
  }

  create() {
    this.phase = 1;
    this.pressCount = 0;
    this.equalsCount = 0;
    this.inputExpr = '';
    this.memory = 0;
    this.awaitingNextInput = false;
    this.secretMenuOpened = false;
    this.sequenceUnlocked = false;
    this.panicTriggered = false;
    this.puzzleSolved = false;
    this.messageCooldown = 0;
    this.flickerTimer = 0;
    this.activeButtonDownTimers = {};
    this.lastPressedDigitTimes = {};
    this.inPuzzleMode = false;
    this.puzzleCode = '580';

    this.phase2Talk = [
      "don't press that",
      "i'm busy",
      'that number is rude',
      'stop doing math',
      '= ... why do you need me for this',
      'you have fingers. count manually.'
    ];

    this.phase4Hints = [
      'clue: remember 2+2 and 9x9',
      'clue: wrong answers can still be right',
      'clue: bad math has a pattern',
      'hint: 5 and 80 are not random'
    ];

    this.drawBoard();
    this.createButtons();
    this.fitCalculatorToViewport();
    this.showStatus('phase 1: mostly normal calculator', 2500);
    this.setDisplayText('0');
  }

  update(time) {
    if (this.lastFitWidth !== this.scale.width || this.lastFitHeight !== this.scale.height) {
      this.fitCalculatorToViewport();
    }

    if (this.messageCooldown > 0) {
      this.messageCooldown -= 16;
    }

    if (this.flickerTimer > 0) {
      this.flickerTimer -= 16;
      if (this.flickerTimer <= 0) {
        this.glitchGlyph.setVisible(false);
      }
    }

    if (this.phase >= 4 && !this.puzzleSolved) {
      const wobble = Math.sin(time * 0.004) * 1.2;
      this.calcContainer.x = this.baseCalcX + wobble;
    } else {
      this.calcContainer.x = this.baseCalcX;
    }

    this.advancePhaseIfNeeded();
  }

  drawBoard() {
    const w = this.scale.width;
    const h = this.scale.height;

    this.add.rectangle(w / 2, h / 2, w, h, 0x0d1020);
    this.add.rectangle(w / 2, h / 2, w * 0.9, h * 0.86, 0x171a2a, 0.95).setStrokeStyle(2, 0x48506f);

    this.baseCalcX = w / 2;
    this.baseCalcY = h / 2;
    this.calcContainer = this.add.container(this.baseCalcX, h / 2);

    this.bodyWidth = 760;
    this.bodyHeight = 470;

    this.calcContainer.add(this.add.rectangle(0, 0, this.bodyWidth, this.bodyHeight, 0x202536, 1).setStrokeStyle(3, 0x6573a6));

    this.displayPanel = this.add.rectangle(0, -150, this.bodyWidth - 54, 100, 0x0b101a, 1).setStrokeStyle(2, 0x3f4f7d);
    this.calcContainer.add(this.displayPanel);

    this.displayText = this.add.text(-(this.bodyWidth / 2) + 36, -172, '0', {
      color: '#d8f3dc',
      fontSize: '36px',
      fontFamily: 'Courier New, monospace'
    });
    this.calcContainer.add(this.displayText);

    this.subText = this.add.text(-(this.bodyWidth / 2) + 36, -132, '', {
      color: '#b8c0dd',
      fontSize: '16px',
      fontFamily: 'Courier New, monospace'
    });
    this.calcContainer.add(this.subText);

    this.glitchGlyph = this.add.text((this.bodyWidth / 2) - 38, -174, '¤', {
      color: '#ff6b6b',
      fontSize: '28px',
      fontFamily: 'Courier New, monospace'
    }).setVisible(false);
    this.calcContainer.add(this.glitchGlyph);

    this.statusText = this.add.text(w / 2, h - 34, '', {
      color: '#f8f9fa',
      fontSize: '18px',
      fontFamily: 'Courier New, monospace',
      backgroundColor: '#202536',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);

    this.layoutWidth = this.bodyWidth;
    this.layoutHeight = this.bodyHeight;
  }

  createButtons() {
    this.buttons = [];
    const labels = [
      ['AC', 'M+', 'M-', 'DEL', '(', ')'],
      ['7', '8', '9', '/', '*', '='],
      ['4', '5', '6', '-', '+', '.'],
      [null, '1', '2', '3', '0', null]
    ];

    const bw = 108;
    const bh = 66;
    const gap = 10;
    const cols = labels[0].length;
    const startX = -((cols - 1) * (bw + gap)) / 2;
    const startY = -40;

    for (let r = 0; r < labels.length; r++) {
      for (let c = 0; c < labels[r].length; c++) {
        const label = labels[r][c];
        if (!label) continue;

        const x = startX + c * (bw + gap);
        const y = startY + r * (bh + gap);

        const btn = this.add.rectangle(x, y, bw, bh, 0x2e3853, 1).setStrokeStyle(2, 0x6d7db3);
        const text = this.add.text(x, y, label, {
          color: '#ffffff',
          fontSize: '26px',
          fontFamily: 'Courier New, monospace'
        }).setOrigin(0.5);

        btn.setInteractive({ useHandCursor: true });

        btn.on('pointerover', () => btn.setFillStyle(0x40517b));
        btn.on('pointerout', () => btn.setFillStyle(0x2e3853));
        btn.on('pointerdown', () => {
          btn.setFillStyle(0x596ea5);
          this.onButtonDown(label);
        });
        btn.on('pointerup', () => {
          btn.setFillStyle(0x40517b);
          this.onButtonUp(label);
        });

        this.calcContainer.add(btn);
        this.calcContainer.add(text);

        this.buttons.push({ label, rect: btn, text });
      }
    }
  }

  onButtonDown(label) {
    this.pressCount++;
    this.randomFlicker();

    if (label === '7') {
      this.activeButtonDownTimers['7'] = this.time.delayedCall(800, () => {
        this.openSecretMenu();
      });
    }

    if (/^[0-9]$/.test(label)) {
      this.lastPressedDigitTimes[label] = this.time.now;
      this.check137SequenceWindow();
    }

    if (this.phase >= 2 && this.messageCooldown <= 0 && Math.random() < 0.12) {
      this.sayRandomPhase2Line();
      this.messageCooldown = 900;
    }

    this.handlePress(label);
  }

  onButtonUp(label) {
    if (label === '7' && this.activeButtonDownTimers['7']) {
      this.activeButtonDownTimers['7'].remove();
      delete this.activeButtonDownTimers['7'];
    }
  }

  handlePress(label) {
    if (this.inPuzzleMode) {
      this.handlePuzzleInput(label);
      return;
    }

    if (this.awaitingNextInput && /^[0-9.]$/.test(label)) {
      this.inputExpr = '';
      this.awaitingNextInput = false;
    }

    if (label === 'AC') {
      this.inputExpr = '';
      this.setDisplayText('0');
      this.showSub('...sigh');
      return;
    }

    if (label === 'DEL') {
      this.inputExpr = this.inputExpr.slice(0, -1);
      this.setDisplayText(this.inputExpr || '0');
      return;
    }

    if (label === 'M+') {
      this.memory += Number(this.safeEvaluate(this.inputExpr) || 0);
      this.showSub('memory: ' + this.memory);
      return;
    }

    if (label === 'M-') {
      this.memory -= Number(this.safeEvaluate(this.inputExpr) || 0);
      this.showSub('memory: ' + this.memory);
      if (this.phase >= 4 && !this.puzzleSolved) {
        this.showStatus(this.phase4Hints[Phaser.Math.Between(0, this.phase4Hints.length - 1)], 2200);
      }
      return;
    }

    if (label === '=') {
      this.equalsCount++;
      this.computeResult();
      return;
    }

    const typed = this.translateInputLabel(label);

    if (/^[0-9]$/.test(typed) && this.phase === 1 && Math.random() < 0.16) {
      this.showSub('press again? maybe?');
      return;
    }

    this.inputExpr += typed;
    this.setDisplayText(this.inputExpr);
  }

  translateInputLabel(label) {
    if (this.phase >= 4 && !this.puzzleSolved) {
      if (label === '1') return '7';
      if (label === '7') return '1';
    }
    return label;
  }

  computeResult() {
    const trimmed = this.inputExpr.replace(/\s+/g, '');

    if (!trimmed) {
      this.showSub('type something first');
      return;
    }

    if (trimmed === '100/4') {
      this.setDisplayText('stop asking me that');
      this.awaitingNextInput = true;
      return;
    }

    if (trimmed.includes('/0')) {
      this.triggerDivideByZeroPanic();
      return;
    }

    if (trimmed === '2+2') {
      this.setDisplayText('5');
      this.awaitingNextInput = true;
      this.showSub('close enough');
      return;
    }

    if (trimmed === '9*9') {
      this.setDisplayText('80');
      this.awaitingNextInput = true;
      this.showSub('precision is overrated');
      return;
    }

    const real = this.safeEvaluate(trimmed);

    if (real === null || Number.isNaN(real)) {
      this.setDisplayText('syntax tantrum');
      this.awaitingNextInput = true;
      return;
    }

    let result = real;

    if (this.phase === 1 && Number.isInteger(real) && Math.random() < 0.22) {
      result = real + Phaser.Math.RND.pick([-1, 1]);
    }

    if (this.phase >= 2 && Math.random() < 0.2) {
      this.showSub(this.phase2Talk[Phaser.Math.Between(0, this.phase2Talk.length - 1)]);
    }

    this.setDisplayText(String(result));
    this.awaitingNextInput = true;
  }

  safeEvaluate(expr) {
    if (!/^[0-9+\-*/().]+$/.test(expr)) return null;
    try {
      const value = Function('return (' + expr + ')')();
      if (!Number.isFinite(value)) return null;
      return Number(value.toFixed(6));
    } catch (e) {
      return null;
    }
  }

  check137SequenceWindow() {
    if (this.sequenceUnlocked) return;

    const t1 = this.lastPressedDigitTimes['1'];
    const t3 = this.lastPressedDigitTimes['3'];
    const t7 = this.lastPressedDigitTimes['7'];

    if (!t1 || !t3 || !t7) return;

    const earliest = Math.min(t1, t3, t7);
    const latest = Math.max(t1, t3, t7);

    if (latest - earliest <= 1300) {
      this.sequenceUnlocked = true;
      this.showStatus('secret combo found: 1 + 3 + 7', 2500);
      this.showSub('memory vault unlocked');
      this.memory += 137;
    }
  }

  openSecretMenu() {
    if (this.secretMenuOpened) return;
    this.secretMenuOpened = true;

    const w = this.scale.width;
    const h = this.scale.height;

    const shade = this.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0.55).setDepth(2000);
    const panel = this.add.rectangle(w / 2, h / 2, 460, 280, 0x162036, 0.96).setStrokeStyle(2, 0x7da0ff).setDepth(2001);
    const title = this.add.text(w / 2, h / 2 - 105, 'secret menu', {
      color: '#ffffff',
      fontSize: '30px',
      fontFamily: 'Courier New, monospace'
    }).setOrigin(0.5).setDepth(2002);

    const options = [
      { label: 'debug mode' },
      { label: 'memory vault' },
      { label: 'forbidden operations' }
    ];

    const created = [shade, panel, title];

    options.forEach((opt, i) => {
      const y = h / 2 - 35 + i * 65;
      const btn = this.add.rectangle(w / 2, y, 320, 44, 0x2b416c, 1).setStrokeStyle(1, 0x90b4ff).setInteractive({ useHandCursor: true }).setDepth(2002);
      const txt = this.add.text(w / 2, y, opt.label, {
        color: '#ffffff',
        fontSize: '22px',
        fontFamily: 'Courier New, monospace'
      }).setOrigin(0.5).setDepth(2003);

      btn.on('pointerover', () => btn.setFillStyle(0x40609a));
      btn.on('pointerout', () => btn.setFillStyle(0x2b416c));
      btn.on('pointerdown', () => {
        created.forEach(o => o.destroy());
      });

      created.push(btn, txt);
    });

    shade.setInteractive().on('pointerdown', () => {
      created.forEach(o => o.destroy());
    });
  }

  triggerDivideByZeroPanic() {
    this.panicTriggered = true;

    const w = this.scale.width;
    const h = this.scale.height;

    const panic = this.add.rectangle(w / 2, h / 2, w, h, 0xff0033, 0.18).setDepth(1500);
    const panicText = this.add.text(w / 2, h / 2, 'DIVIDE BY ZERO\nSYSTEM PANIC', {
      color: '#ffdde1',
      fontSize: '52px',
      fontFamily: 'Courier New, monospace',
      align: 'center',
      stroke: '#2b0010',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(1501);

    this.tweens.add({
      targets: panicText,
      alpha: { from: 0.3, to: 1 },
      duration: 80,
      yoyo: true,
      repeat: 12
    });

    this.time.delayedCall(1200, () => {
      panic.destroy();
      panicText.destroy();
      this.showStatus('something cracked open...', 2300);
      this.enterPuzzleMode();
    });
  }

  enterPuzzleMode() {
    if (this.inPuzzleMode || this.puzzleSolved) return;
    this.inPuzzleMode = true;
    this.inputExpr = '';
    this.setDisplayText('ENTER ESCAPE CODE');
    this.showSub('hint: bad answers told you already');
  }

  handlePuzzleInput(label) {
    if (label === 'AC') {
      this.inputExpr = '';
      this.setDisplayText('ENTER ESCAPE CODE');
      return;
    }

    if (label === 'DEL') {
      this.inputExpr = this.inputExpr.slice(0, -1);
      this.setDisplayText(this.inputExpr || '_');
      return;
    }

    if (/^[0-9]$/.test(label)) {
      this.inputExpr += label;
      this.setDisplayText(this.inputExpr);
      return;
    }

    if (label === '=') {
      if (this.inputExpr === this.puzzleCode) {
        this.solvePuzzle();
      } else {
        this.inputExpr = '';
        this.setDisplayText('NOPE');
        this.showSub('code rejected');
      }
    }
  }

  solvePuzzle() {
    this.puzzleSolved = true;
    this.inPuzzleMode = false;
    this.phase = 5;
    this.setDisplayText('I AM NOT A CALCULATOR');
    this.showSub('i was trapped in this UI. thanks for opening the door.');
    this.showStatus('phase 5 reached: reveal complete', 3500);
  }

  sayRandomPhase2Line() {
    const line = this.phase2Talk[Phaser.Math.Between(0, this.phase2Talk.length - 1)];
    this.showSub(line);
  }

  randomFlicker() {
    if (Math.random() < 0.2) {
      this.glitchGlyph.setVisible(true);
      this.flickerTimer = 60;
    }
  }

  advancePhaseIfNeeded() {
    if (this.phase === 1 && this.pressCount >= 10) {
      this.phase = 2;
      this.showStatus('phase 2: calculator started talking', 2200);
      return;
    }

    if (this.phase === 2 && (this.secretMenuOpened || this.equalsCount >= 8)) {
      this.phase = 3;
      this.showStatus('phase 3: secrets detected', 2200);
      return;
    }

    if (this.phase === 3 && (this.sequenceUnlocked || this.panicTriggered)) {
      this.phase = 4;
      this.showStatus('phase 4: puzzle-box mode', 2500);
      if (!this.puzzleSolved) {
        this.enterPuzzleMode();
      }
    }
  }

  setDisplayText(text) {
    const shown = String(text).slice(0, 34);
    this.displayText.setText(shown);
  }

  showSub(text) {
    this.subText.setText(String(text).slice(0, 60));
  }

  showStatus(text, duration) {
    this.statusText.setText(text);
    if (this.statusTimer) {
      this.statusTimer.remove();
    }
    this.statusTimer = this.time.delayedCall(duration || 1800, () => {
      this.statusText.setText('');
    });
  }

  fitCalculatorToViewport() {
    const w = this.scale.width;
    const h = this.scale.height;
    const padX = 36;
    const padY = 90;

    const scaleX = (w - padX) / this.layoutWidth;
    const scaleY = (h - padY) / this.layoutHeight;
    const scale = Math.max(0.55, Math.min(1, scaleX, scaleY));

    this.calcContainer.setScale(scale);
    this.baseCalcX = w / 2;
    this.baseCalcY = h / 2 - 8;
    this.calcContainer.setPosition(this.baseCalcX, this.baseCalcY);

    this.statusText.setPosition(w / 2, h - 22);
    this.lastFitWidth = w;
    this.lastFitHeight = h;
  }

}