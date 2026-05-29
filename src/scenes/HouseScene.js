// src/scenes/HouseScene.js

class HouseScene extends Phaser.Scene {
  constructor() {
    super("HouseScene");
  }

  preload() {
    this.load.image("room", "assets/house/house-room.png");
    this.load.image("bed", "assets/house/bed.png");
    this.load.image("wardrobe", "assets/house/wardrobe.png");

    const directions = ["down", "up", "left", "right"];
    const states = ["walk", "idle"];

    for (const state of states) {
      for (const dir of directions) {
        for (let i = 0; i < 4; i++) {
          const key = `${state}-${dir}-${i}`;
          this.load.image(key, `assets/player/frames/${key}.png`);
        }
      }
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#000000");

    this.add.image(640, 360, "room").setScale(2.5);
    this.add.image(470, 275, "wardrobe").setScale(.8);
    this.add.image(810, 320, "bed").setScale(.7);

    this.createPlayerAnimations();

    this.walls = this.physics.add.staticGroup();

    // Room bounds with a gap at bottom center for exit
    this.makeWall(640, 120, 900, 40);   // top
    this.makeWall(205, 360, 40, 520);   // left
    this.makeWall(1075, 360, 40, 520);  // right

    this.makeWall(395, 610, 380, 40);   // bottom left
    this.makeWall(885, 610, 380, 40);   // bottom right

    // Furniture collisions
    this.makeWall(500, 275, 220, 170);
    this.makeWall(810, 320, 135, 230);

   

    // Exit zone
    this.exitZone = this.add.zone(640, 625, 150, 60);
    this.physics.add.existing(this.exitZone, true);

    this.facing = "down";

    this.player = this.physics.add.sprite(650, 500, "idle-down-0");
    this.player.setScale(4);
    this.player.play("idle-down");

    this.player.body.setSize(12, 8);
    this.player.body.setOffset(2, 10);

    this.physics.add.collider(this.player, this.walls);

    this.physics.add.overlap(this.player, this.exitZone, () => {
      this.scene.start("OutsideScene");
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(640, 360);

    this.time.delayedCall(800, () => {
      this.showDialogue("Hello...\n You are finally awake.\n Walk down to leave the house.");
    });
  }

  update() {
    const speed = 175;

    this.player.setVelocity(0);

    let moving = false;

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.facing = "left";
      moving = true;
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.facing = "right";
      moving = true;
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      this.facing = "up";
      moving = true;
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      this.facing = "down";
      moving = true;
    }

    this.player.body.velocity.normalize().scale(speed);

    const animKey = moving ? `walk-${this.facing}` : `idle-${this.facing}`;

    if (this.player.anims.currentAnim?.key !== animKey) {
      this.player.play(animKey);
    }

    if (this.dialogueBox && Phaser.Input.Keyboard.JustDown(this.keyE)) {
      this.closeDialogue();
    }
  }

  createPlayerAnimations() {
    const directions = ["down", "up", "left", "right"];

    for (const dir of directions) {
      this.anims.create({
        key: `walk-${dir}`,
        frames: [0, 1, 2, 3].map(i => ({ key: `walk-${dir}-${i}` })),
        frameRate: 8,
        repeat: -1
      });

      this.anims.create({
        key: `idle-${dir}`,
        frames: [0, 1, 2, 3].map(i => ({ key: `idle-${dir}-${i}` })),
        frameRate: 4,
        repeat: -1
      });
    }
  }

  makeWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xff0000, 0);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  showDialogue(message) {
    if (this.dialogueBox) return;

    const boxX = 640;
    const boxY = 610;
    const boxW = 980;
    const boxH = 135;

    this.dialogueBox = this.add.rectangle(boxX, boxY, boxW, boxH, 0x000000, 1);
    this.dialogueBox.setStrokeStyle(5, 0xffffff);
    this.dialogueBox.setDepth(100);

    this.dialogueText = this.add.text(boxX - boxW / 2 + 42, boxY - boxH / 2 + 25, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "22px",
      color: "#ffffff",
      lineSpacing: 6,
      wordWrap: { width: boxW - 95 }
    });

    this.dialogueText.setDepth(101);

    this.continueText = this.add.text(boxX + boxW / 2 - 55, boxY + boxH / 2 - 40, "▼", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "22px",
      color: "#ffffff"
    });

    this.continueText.setDepth(101);
    this.continueText.setAlpha(0);

    let index = 0;

    this.typeTimer = this.time.addEvent({
      delay: 38,
      loop: true,
      callback: () => {
        if (index >= message.length) {
          this.typeTimer.remove(false);
          this.continueText.setAlpha(1);
          return;
        }

        this.dialogueText.setText(message.slice(0, index + 1));
        index++;
      }
    });
  }

  closeDialogue() {
    if (this.typeTimer) this.typeTimer.remove(false);

    this.dialogueBox.destroy();
    this.dialogueText.destroy();
    this.continueText.destroy();

    this.dialogueBox = null;
    this.dialogueText = null;
    this.continueText = null;
  }
}