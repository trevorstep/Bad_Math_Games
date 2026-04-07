class PongBootScene extends Phaser.Scene {

  constructor() {
    super({ key: 'PongBootScene' });
  }

  preload() {
    this.load.audio('bgm', 'assets/pong/bgm.mp3');
    this.load.audio('startup', 'assets/pong/startup.wav');
    this.load.audio('paddleHit', 'assets/pong/paddleHit.wav');
    this.load.audio('wallHit', 'assets/pong/wallHit.wav');
  }

  create() {
    // Only start bgm if its not already playing
    if (!this.sound.get('bgm')) {
      this.sound.play('startup');
      this.sound.add('bgm', { loop: true, volume: 0.5 }).play();
    }

    // Black background
    this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000);

    // Game title
    this.add.text(this.scale.width / 2, this.scale.height / 3, 'Multi Level Pong', {
      color: '#ffffff',
      fontSize: '48px'
    }).setOrigin(0.5);

    // Start button
    const startBtn = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Start Game', {
      color: '#ffffff',
      fontSize: '32px',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive()
    .on('pointerover', () => startBtn.setStyle({ color: '#ffff00' }))
    .on('pointerout', () => startBtn.setStyle({ color: '#ffffff' }))
    .on('pointerdown', () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PongScene');
      });
    });

    // Fade in on start
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
}