const params = new URLSearchParams(window.location.search);
const game = params.get('game');

fetch('assets/games.json')
  .then(res => res.json())
  .then(gameData => {
    const d = gameData[game] || gameData.bCalc;
    document.querySelector('h2').textContent = d.title;
    document.getElementById('game-genre').textContent = d.genre;
    document.getElementById('game-updated').textContent = d.updated;
    document.getElementById('game-release').textContent = d.release;
    document.getElementById('game-platform').textContent = d.platform;
    document.getElementById('game-text').textContent = d.instructions;


    

    const container = document.getElementById('game-container');
    const scenes = {
      pong: [PongBootScene, PongScene],
      ss: SaltScene,
      walk: WalkScene,
      BnG: WBandFGScene,
      goose: GooseScene,
      bCalc: BadCalcScene
    };

   if (scenes[game]) {
  new Phaser.Game({
    type: Phaser.AUTO,
    width: container.clientWidth,
    height: container.clientHeight,
    parent: 'game-container',
    physics: {
  default: 'arcade',
  arcade: { 
    debug: false,
    gravity: { y: 0 }
  }
    },
    scene: scenes[game]
  });
}
  });