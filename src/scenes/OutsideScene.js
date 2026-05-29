// src/scenes/OutsideScene.js

class OutsideScene extends Phaser.Scene {
  constructor() {
    super("OutsideScene");
  }

  preload() {
    this.load.image("outsideMap", "assets/outside/outsidescene.png");

    const dirs = ["down", "up", "left", "right"];
    const states = ["walk", "idle"];

    for (const state of states) {
      for (const dir of dirs) {
        for (let i = 0; i < 4; i++) {
          const key = `${state}-${dir}-${i}`;
          if (!this.textures.exists(key)) {
            this.load.image(key, `assets/player/frames/${key}.png`);
          }
        }
      }
    }
  }

  create() {
    this.playerLocked = false;
    this.encounterStarted = false;
    this.choiceActive = false;
    this.harborUnlocked = false;
    this.facing = "up";

    this.createPlayerAnimations();

    const map = this.add.image(0, 0, "outsideMap").setOrigin(0, 0);
    this.WORLD_W = map.width;
    this.WORLD_H = map.height;

    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    // Player exits house / starts near lower central road.
    this.player = this.physics.add.sprite(1850, 1400, "idle-up-0");
    this.player.setScale(3);
    this.player.play("idle-up");
    this.player.setCollideWorldBounds(true);

    // Sons of Liberty NPC. Move this later once you pick exact placement.
    this.npc = this.physics.add.staticSprite(1850, 1000, "idle-down-0");
    this.npc.setScale(3);
    this.npc.setTint(0x777777);

    // Encounter trigger around the NPC/path.
    this.npcTrigger = this.add.zone(1850, 1000, 120, 120);
    this.physics.add.existing(this.npcTrigger, true);

    this.physics.add.overlap(this.player, this.npcTrigger, () => {
      if (!this.encounterStarted) {
        this.startSonsEncounter();
      }
    });

    // Harbor entrance: top vertical road.
    this.harborZone = this.add.zone(1450, 20, 180, 80);
    this.physics.add.existing(this.harborZone, true);

    this.physics.add.overlap(this.player, this.harborZone, () => {
      if (this.harborUnlocked) {
        this.scene.start("HarborScene");
      }
    });

    this.createInput();
    this.createCamera();

    this.showObjective("Follow the road north.");
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyOne = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keyTwo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBackgroundColor("#17183b");
  }

  update() {
    if (this.playerLocked) {
      this.player.setVelocity(0);

      if (this.choiceActive) {
        if (Phaser.Input.Keyboard.JustDown(this.keyOne)) {
          this.chooseGrabCrate();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keyTwo)) {
          this.chooseWalkAway();
        }
      }

      return;
    }

    this.handleMovement();
  }

  handleMovement() {
    const speed = 135;
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
  }

  startSonsEncounter() {
    this.encounterStarted = true;
    this.playerLocked = true;
    this.choiceActive = false;

    this.player.play("idle-up");

    this.showDialogue(
      "* Hey! Keep your voice down.\n" +
      "* The King's ships are packed with taxed tea.\n" +
      "* Are you going to stand there like a loyalist puppet?\n\n" +
      "   [1] Grab a Crate\n" +
      "   [2] Walk Away",
      () => {
        this.choiceActive = true;
      }
    );
  }

  chooseGrabCrate() {
    if (!this.choiceActive) return;

    this.choiceActive = false;
    this.harborUnlocked = true;

    this.cameras.main.shake(300, 0.006);

    this.showDialogue(
      "* Good.\n" +
      "* Then move north.\n" +
      "* The harbor is waiting.",
      () => {
        this.clearDialogueUI();
        this.playerLocked = false;
        this.npc.destroy();
        this.showObjective("Go north to the harbor.");
      }
    );
  }

  chooseWalkAway() {
    if (!this.choiceActive) return;

    this.choiceActive = false;

    this.showDialogue(
      "* Your conscience won't let you leave.\n" +
      "* The air is thick with mutiny.\n" +
      "* There is nowhere else to go.\n\n" +
      "   [1] Grab a Crate\n" +
      "   [2] Walk Away",
      () => {
        this.choiceActive = true;
      }
    );
  }

  showObjective(text) {
    if (this.objectiveText) {
      this.objectiveText.destroy();
    }

    this.objectiveText = this.add.text(640, 62, text, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 14, y: 8 }
    });

    this.objectiveText.setOrigin(0.5);
    this.objectiveText.setScrollFactor(0);
    this.objectiveText.setDepth(900);
  }

  showDialogue(message, onFinished = null) {
    this.clearDialogueUI();

    const boxX = 640;
    const boxY = 540;
    const boxW = 900;
    const boxH = 210;

    this.dialogueBox = this.add.rectangle(boxX, boxY, boxW, boxH, 0x000000, 1);
    this.dialogueBox.setStrokeStyle(5, 0xffffff);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(1000);

    this.dialogueText = this.add.text(
      boxX - boxW / 2 + 42,
      boxY - boxH / 2 + 30,
      "",
      {
        fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
        fontSize: "20px",
        color: "#ffffff",
        lineSpacing: 7,
        wordWrap: { width: boxW - 85 }
      }
    );

    this.dialogueText.setScrollFactor(0);
    this.dialogueText.setDepth(1001);

    let i = 0;

    this.typeTimer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (i >= message.length) {
          this.typeTimer.remove(false);
          this.typeTimer = null;
          if (onFinished) onFinished();
          return;
        }

        this.dialogueText.setText(message.slice(0, i + 1));
        i++;
      }
    });
  }

  clearDialogueUI() {
    if (this.typeTimer) this.typeTimer.remove(false);
    if (this.dialogueBox) this.dialogueBox.destroy();
    if (this.dialogueText) this.dialogueText.destroy();

    this.typeTimer = null;
    this.dialogueBox = null;
    this.dialogueText = null;
  }

  createPlayerAnimations() {
    const directions = ["down", "up", "left", "right"];

    for (const dir of directions) {
      if (!this.anims.exists(`walk-${dir}`)) {
        this.anims.create({
          key: `walk-${dir}`,
          frames: [0, 1, 2, 3].map(i => ({ key: `walk-${dir}-${i}` })),
          frameRate: 8,
          repeat: -1
        });
      }

      if (!this.anims.exists(`idle-${dir}`)) {
        this.anims.create({
          key: `idle-${dir}`,
          frames: [0, 1, 2, 3].map(i => ({ key: `idle-${dir}-${i}` })),
          frameRate: 4,
          repeat: -1
        });
      }
    }
  }
}