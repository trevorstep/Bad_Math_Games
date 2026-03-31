class PongScene extends Phaser.Scene {
    
  //Get all data from the JSON thang if applicible
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
    this.ball = this.add.rectangle(400, 300, 16, 16, 0xffffff);
    this.physics.add.existing(this.ball)
    //Paddle boi one
    this.paddle1 = this.add.rectangle(50,200,20,150, Number(this.players.p1.color));
    this.physics.add.existing(this.paddle1)
    //Paddle boi two
    this.paddle2 = this.add.rectangle(900,200,20,150, Number(this.players.p2.color));
    this.physics.add.existing(this.paddle2)

    //Set World collider bounds.
    this.ball.body.setCollideWorldBounds(true);
    this.paddle1.body.setCollideWorldBounds(true);
    this.paddle2.body.setCollideWorldBounds(true);

    //Set initial velocity 
    this.ball.body.setVelocity(200, 150);
    //Use Phaser built in bounce feature
    this.ball.body.setBounce(1, 1);

    this.physics.add.collider(this.paddle1, this.ball, this.speedUp, null, this)

    //Set colliders and make paddles immovable so only ball reacts
    this.physics.add.collider(this.paddle1, this.ball)
    this.paddle1.body.setImmovable(true);
    this.physics.add.collider(this.paddle2, this.ball)
    this.paddle2.body.setImmovable(true);

    //Controls
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      s: Phaser.Input.Keyboard.KeyCodes.S
    });
  }

  //Update on every frame like your life depends on it. 
  update() {
    if(this.keys.w.isDown){
        this.paddle1.body.setVelocityY(-300)
    } else if(this.keys.s.isDown){
        this.paddle1.body.setVelocityY(+300)
    } else {
        this.paddle1.body.setVelocityY(0)
    }

    if(this.keys.up.isDown){
        this.paddle2.body.setVelocityY(-300)
    } else if(this.keys.down.isDown){
        this.paddle2.body.setVelocityY(+300)
    } else {
        this.paddle2.body.setVelocityY(0)
    }
  }

    speedUp(paddle, ball) {
        const maxSpeed = 1000;
        if (Math.abs(ball.body.velocity.x) < maxSpeed) {
            ball.body.setVelocity(
            ball.body.velocity.x * 1.1,
            ball.body.velocity.y * 1.1
    );
  }
}

}