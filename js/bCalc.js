class BadCalcScene extends Phaser.Scene {
  preload() {
    this.load.json('data', 'assets/bCalc/data.json');
  }
  create() { 
        this.add.text(100, 100, 'This game isnt ready yet, please come back another time:)', { color: '#ffffff', fontSize: '32px' });
  }
  update() { }

}