const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;

class StartScene extends Phaser.Scene {
  constructor() {
    super("StartScene");
  }

  create() {
    const centerX = GAME_WIDTH / 2;

    this.cameras.main.setBackgroundColor("#1a1b44");

    this.add.text(centerX, 130, "BYSTANDER", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "72px",
      fontStyle: "bold",
      color: "#f1ca4f",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(centerX, 205, "A Revolution RPG", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "28px",
      fontStyle: "bold",
      color: "#b8b8c8",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(centerX, 246, "Zidaan Barodawala  |  Vihaan Tanikonda  |  Emmett Yu", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#f4e7c5",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.add.rectangle(centerX, 300, 1100, 6, 0x3d3f73).setOrigin(0.5);

    const pressEnterText = this.add.text(centerX, 420, "Press ENTER to begin", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "34px",
      fontStyle: "bold",
      color: "#8f90a8",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(centerX, 530, "1773  -  2026", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "30px",
      color: "#686a98",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(centerX, 650, "Move with arrow keys or WASD. Interact with E.", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "25px",
      color: "#686a98",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: pressEnterText,
      alpha: 0.25,
      duration: 850,
      yoyo: true,
      repeat: -1
    });

    this.input.keyboard.once("keydown-ENTER", () => {
      this.scene.start("HouseScene");
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#1a1b44",
  pixelArt: true,
  antialias: false,
  roundPixels: false,

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },

  physics: {
    default: "arcade"
  },

  scene: [StartScene, HouseScene, OutsideScene, HarborScene, PrintShopScene, TownSquareScene, ModernCityScene, DistrictMapScene, GovernorBossScene, EndingScene]
};

new Phaser.Game(config);
