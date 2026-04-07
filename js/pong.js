class PongScene extends Phaser.Scene {
    
  constructor() {
    super({ key: 'PongScene' });
  }

  //Get all data from the JSON thang if applicable
  preload() {
    this.load.json('data', 'assets/pong/data.json') 
  }

  //Start the shindig and load all objects into game.
  create() {
    //World collisions
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
    //Passing our data we retrieved from preload into json.
    const data = this.cache.json.get('data');
    this.players = data.players;

    //Ball
    this.ball = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, 16, 16, 0xffffff);
    this.physics.add.existing(this.ball)
    //Paddle boi one
    this.paddle1 = this.add.rectangle(50, this.scale.height / 2, 20, 150, Number(this.players.p1.color));
    this.physics.add.existing(this.paddle1)
    //Paddle boi two
    this.paddle2 = this.add.rectangle(this.scale.width - 50, this.scale.height / 2, 20, 150, Number(this.players.p2.color));
    this.physics.add.existing(this.paddle2)

    //Paddles collide with top and bottom only, ball does not use world bounds so it can cross left/right for scoring
    this.paddle1.body.setCollideWorldBounds(true);
    this.paddle2.body.setCollideWorldBounds(true);

    //Set initial velocity 
    this.ball.body.setVelocity(250, 200);
    //Use Phaser built in bounce feature
    this.ball.body.setBounce(1, 1);

    //Set colliders and make paddles immovable so only ball reacts
    this.physics.add.collider(this.paddle1, this.ball, this.speedUp, null, this);
    this.paddle1.body.setImmovable(true);
    this.physics.add.collider(this.paddle2, this.ball, this.speedUp, null, this);
    this.paddle2.body.setImmovable(true);

    // Initialize scores and score display
    this.p1Score = 0;
    this.p2Score = 0;
    this.scoreText = this.add.text(this.scale.width / 2, 20, '0 - 0', { 
      color: '#ffffff', 
      fontSize: '32px' 
    }).setOrigin(0.5, 0);

    //Controls
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S
    });

    // Game over elements - hidden until someone wins
    this.gameOver = false;

    this.winnerText = this.add.text(this.scale.width / 2, this.scale.height / 3, '', {
      color: '#ffffff',
      fontSize: '48px'
    }).setOrigin(0.5).setVisible(false);

    this.rematchBtn = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Rematch?', {
      color: '#ffffff',
      fontSize: '32px',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive()
    .setVisible(false)
    .on('pointerover', () => this.rematchBtn.setStyle({ color: '#ffff00' }))
    .on('pointerout', () => this.rematchBtn.setStyle({ color: '#ffffff' }))
    .on('pointerdown', () => {
      this.scene.start('PongBootScene');
    });

// Ball trail group
this.ballTrail = this.add.group();
  }

  //Update on every frame like your life depends on it. 
  update() {
    if (this.gameOver) return;

    if(this.keys.w.isDown){
        this.paddle1.body.setVelocityY(-500)
    } else if(this.keys.s.isDown){
        this.paddle1.body.setVelocityY(+500)
    } else {
        this.paddle1.body.setVelocityY(0)
    }

    if(this.keys.up.isDown){
        this.paddle2.body.setVelocityY(-500)
    } else if(this.keys.down.isDown){
        this.paddle2.body.setVelocityY(+500)
    } else {
        this.paddle2.body.setVelocityY(0)
    }

    //wallz
    if (this.ball.y < 0) {
      this.ball.body.setVelocityY(Math.abs(this.ball.body.velocity.y));
      this.sound.play('wallHit');
    }
    if (this.ball.y > this.scale.height) {
      this.ball.body.setVelocityY(-Math.abs(this.ball.body.velocity.y));
      this.sound.play('wallHit');
    }

    // P2 scores when ball passes left edge
    if (this.ball.x < 0) {
      this.p2Score++;
      this.scoreText.setText(this.p1Score + ' - ' + this.p2Score);
      this.resetBall();
    }

    // P1 scores when ball passes right edge
    if (this.ball.x > this.scale.width) {
      this.p1Score++;
      this.scoreText.setText(this.p1Score + ' - ' + this.p2Score);
      this.resetBall();
    }


// --- TRAIL EFFECT ---
// Create a fading "ghost" behind the ball
const ghost = this.add.rectangle(
  this.ball.x,
  this.ball.y,
  16,
  16,
  0x00aaff 
);
ghost.alpha = 0.4;

this.ballTrail.add(ghost);

// Fade out all ghosts
this.ballTrail.children.each(g => {
  g.alpha -= 0.03;
  if (g.alpha <= 0) g.destroy();
});


    // Check for winner
    if (this.p1Score >= 5) {
      this.endGame(this.players.p1.label);
    }
    if (this.p2Score >= 5) {
      this.endGame(this.players.p2.label);
    }
  }

  speedUp(paddle, ball) {
    this.sound.play('paddleHit');
    const maxSpeed = 1000;
    if (Math.abs(ball.body.velocity.x) < maxSpeed) {
      ball.body.setVelocity(
        ball.body.velocity.x * 1.1,
        ball.body.velocity.y * 1.1
      );
    }
  }

  // Reset ball to center with fresh velocity
  resetBall() {
    this.ball.x = this.scale.width / 2;
    this.ball.y = this.scale.height / 2;
    this.ball.body.setVelocity(250, 200);
  }

  endGame(winner) {
    this.gameOver = true;
    this.ball.body.setVelocity(0, 0);
    this.ball.setVisible(false);
    // BGM keeps playing, only stop effects if needed
    this.winnerText.setText(winner + ' Wins!').setVisible(true);
    this.rematchBtn.setVisible(true);
  }
}