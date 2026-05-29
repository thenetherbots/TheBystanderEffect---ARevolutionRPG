class TownSquareScene extends Phaser.Scene {
  constructor() {
    super("TownSquareScene");
  }

  preload() {
    this.load.image("townSquareBg", "assets/town_square/town_square_scene_main.png");
    this.load.image("libertyChest", "assets/town_square/chest.png");

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
    this.WORLD_W = 1254;
    this.WORLD_H = 940;
    this.phase = "arrival";
    this.facing = "up";
    this.playerLocked = false;
    this.nearHistorian = false;
    this.nearChest = false;
    this.historianSpoken = false;
    this.transitionStarted = false;

    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    this.createPlayerAnimations();
    this.createWorld();
    this.createPlayer();
    this.createHistorian();
    this.createChest();
    this.createWalls();
    this.createInput();
    this.createCamera();
    this.createHUD();
    this.createArrivalCinematic();

    this.physics.add.collider(this.player, this.walls);
    this.setObjective("Speak with the Historian.");
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#07090b");
    this.add.image(this.WORLD_W / 2, 470, "townSquareBg").setDepth(0);

    this.vignetteTop = this.add.rectangle(640, 0, 1280, 150, 0x05070d, 0.35).setOrigin(0.5, 0).setScrollFactor(0).setDepth(900);
    this.vignetteBottom = this.add.rectangle(640, 720, 1280, 150, 0x05070d, 0.35).setOrigin(0.5, 1).setScrollFactor(0).setDepth(900);

    this.titleText = this.add.text(640, 36, "ACT II - THE LOCKED CHEST", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#f1ca4f",
      backgroundColor: "#08090d",
      padding: { x: 16, y: 6 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setAlpha(0);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(627, 870, "idle-up-0");
    this.player.setScale(4);
    this.player.play("idle-up");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(12, 8);
    this.player.body.setOffset(2, 10);
    this.player.setDepth(60);
  }

  createHistorian() {
    this.historian = this.physics.add.staticSprite(435, 500, "idle-right-0");
    this.historian.setScale(4);
    this.historian.setTint(0xc9b27d);
    this.historian.setDepth(58);

    this.historianLabel = this.add.text(435, 438, "THE\nHISTORIAN", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#f4e7c5",
      align: "center",
      backgroundColor: "#2b2114",
      padding: { x: 7, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setDepth(80);
  }

  createChest() {
    this.chestBase = this.add.circle(627, 525, 108, 0x0b111b, 0.46).setDepth(22);
    this.chestBase.setStrokeStyle(5, 0x3e3529, 0.8);

    this.chestGlow = this.add.circle(627, 525, 82, 0x3b8cff, 0.1).setDepth(23);
    this.chestGlow.setStrokeStyle(3, 0xf1ca4f, 0.5);

    this.chest = this.physics.add.staticImage(627, 515, "libertyChest");
    this.chest.setScale(1.1);
    this.chest.setDepth(55);

    this.chainA = this.add.rectangle(627, 515, 160, 10, 0x3b3f48, 0.95).setDepth(65);
    this.chainA.setAngle(24);
    this.chainB = this.add.rectangle(627, 515, 160, 10, 0x3b3f48, 0.95).setDepth(65);
    this.chainB.setAngle(-24);
    this.lock = this.add.rectangle(627, 518, 30, 38, 0x111827, 0.95).setDepth(66);
    this.lock.setStrokeStyle(4, 0xf1ca4f, 0.75);

    this.tweens.add({
      targets: this.chestGlow,
      alpha: 0.28,
      scale: 1.12,
      duration: 1050,
      yoyo: true,
      repeat: -1
    });

    this.chestZone = this.add.zone(627, 540, 190, 170);
    this.physics.add.existing(this.chestZone, true);
  }

  createWalls() {
    this.walls = this.physics.add.staticGroup();

    this.makeWall(627, 88, 300, 170);
    this.makeWall(222, 170, 445, 250);
    this.makeWall(1027, 170, 445, 250);
    this.makeWall(110, 648, 220, 330);
    this.makeWall(1140, 648, 220, 330);
    this.makeWall(235, 902, 470, 78);
    this.makeWall(1019, 902, 470, 78);

    this.makeWall(356, 266, 42, 120);
    this.makeWall(1118, 282, 42, 120);
    this.makeWall(164, 746, 58, 120);
    this.makeWall(1034, 775, 58, 120);
    this.makeWall(627, 530, 116, 86);
  }

  makeWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xff0000, 0);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.06, 0.06);
    this.cameras.main.setZoom(1);
    this.cameras.main.centerOn(627, 560);
  }

  createHUD() {
    this.uiDepth = 1000;

    this.objectiveText = this.add.text(640, 84, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#111827",
      padding: { x: 16, y: 8 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.uiDepth);

    this.promptText = this.add.text(640, 132, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "17px",
      color: "#f4e7c5",
      backgroundColor: "#211309",
      padding: { x: 14, y: 7 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.uiDepth).setVisible(false);
  }

  createArrivalCinematic() {
    this.playerLocked = true;
    this.cameras.main.fadeIn(850, 7, 9, 11);
    this.tweens.add({
      targets: this.titleText,
      alpha: 1,
      duration: 600,
      yoyo: true,
      hold: 1200,
      onComplete: () => {
        this.titleText.setAlpha(0);
        this.playerLocked = false;
        this.showPrompt("The pamphlets have done their work. Find the Historian.");
      }
    });
  }

  update() {
    this.nearHistorian = false;
    this.nearChest = false;

    if (this.dialogueActive) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.advanceDialogue();
      }
      return;
    }

    if (this.transitionStarted) {
      this.player.setVelocity(0);
      this.updateGlitchBars();
      return;
    }

    if (this.playerLocked) {
      this.player.setVelocity(0);
      return;
    }

    this.updateProximity();
    this.handleMovement();
    this.handleInteraction();
    this.updatePrompt();
  }

  updateProximity() {
    this.nearHistorian = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.historian.x, this.historian.y) < 105;
    this.nearChest = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.chest.x, this.chest.y) < 126;
  }

  handleMovement() {
    const speed = 136;
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

  handleInteraction() {
    if (!Phaser.Input.Keyboard.JustDown(this.keyE)) return;

    if (this.nearHistorian && !this.historianSpoken) {
      this.startHistorianDialogue();
      return;
    }

    if (this.nearChest && this.historianSpoken) {
      this.startTimeShift();
    }
  }

  startHistorianDialogue() {
    this.playerLocked = true;
    this.showPrompt("");
    this.showDialogue([
      "Historian: You did your part back then, Bystander. But the fight did not end in 1776.",
      "Historian: This chest holds the rights people bled for: free speech, free press, free minds.",
      "Bystander: Why is it chained?",
      "Historian: Because tyranny learned new disguises. It does not always wear a red coat anymore.",
      "Historian: Touch the chest. See what has been locked away."
    ], () => {
      this.historianSpoken = true;
      this.playerLocked = false;
      this.setObjective("Approach the locked chest.");
      this.showPrompt("Stand near the chest and press E.");
      this.tweens.add({
        targets: [this.chainA, this.chainB, this.lock],
        alpha: 0.45,
        duration: 180,
        yoyo: true,
        repeat: 5
      });
    });
  }

  startTimeShift() {
    if (this.transitionStarted) return;

    this.transitionStarted = true;
    this.playerLocked = true;
    this.player.setVelocity(0);
    this.setObjective("Tyranny evolved.");
    this.showPrompt("");
    this.cameras.main.stopFollow();
    this.cameras.main.pan(627, 525, 650, "Sine.easeInOut");
    this.cameras.main.zoomTo(1.22, 650, "Sine.easeInOut");
    this.cameras.main.shake(1200, 0.012);

    this.createGlitchBars();

    this.tweens.add({
      targets: [this.chainA, this.chainB, this.lock],
      alpha: 0,
      scaleX: 1.35,
      duration: 800,
      ease: "Sine.easeIn"
    });

    this.tweens.add({
      targets: this.chestGlow,
      alpha: 0.78,
      scale: 2.4,
      duration: 1000,
      ease: "Sine.easeIn"
    });

    this.time.delayedCall(820, () => {
      this.flashRightsText();
    });

    this.time.delayedCall(2100, () => {
      this.cameras.main.fadeOut(900, 4, 10, 24);
    });

    this.time.delayedCall(3050, () => {
      this.scene.start("ModernCityScene");
    });
  }

  flashRightsText() {
    const rights = ["FREE SPEECH", "FREE PRESS", "FREE MINDS"];
    rights.forEach((right, index) => {
      const text = this.add.text(640, 235 + index * 58, right, {
        fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
        fontSize: "34px",
        color: index === 0 ? "#f1ca4f" : index === 1 ? "#bfefff" : "#d7ffd7",
        backgroundColor: "#05070d",
        padding: { x: 14, y: 6 },
        resolution: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2200).setAlpha(0);

      this.tweens.add({
        targets: text,
        alpha: 1,
        y: text.y - 10,
        delay: index * 170,
        duration: 260,
        yoyo: true,
        hold: 380,
        onComplete: () => text.destroy()
      });
    });
  }

  createGlitchBars() {
    this.glitchBars = [];
    for (let i = 0; i < 14; i++) {
      const color = i % 3 === 0 ? 0x3b8cff : i % 3 === 1 ? 0xf1ca4f : 0xff3b7a;
      const bar = this.add.rectangle(
        Phaser.Math.Between(120, 1160),
        Phaser.Math.Between(90, 660),
        Phaser.Math.Between(70, 260),
        Phaser.Math.Between(4, 14),
        color,
        0.0
      ).setScrollFactor(0).setDepth(2100);
      this.glitchBars.push(bar);
    }
  }

  updateGlitchBars() {
    if (!this.glitchBars) return;

    for (const bar of this.glitchBars) {
      bar.x += Phaser.Math.Between(-12, 12);
      bar.y += Phaser.Math.Between(-3, 3);
      bar.alpha = Phaser.Math.FloatBetween(0.08, 0.55);
      bar.width = Phaser.Math.Between(50, 300);
    }
  }

  updatePrompt() {
    if (!this.historianSpoken) {
      this.showPrompt(this.nearHistorian ? "Press E to speak with the Historian." : "Find the Historian beside the locked chest.");
      return;
    }

    this.showPrompt(this.nearChest ? "Press E to touch the locked chest." : "Approach the chained chest.");
  }

  setObjective(text) {
    this.objectiveText.setText(text);
  }

  showPrompt(text) {
    if (!text) {
      this.promptText.setVisible(false);
      this.promptText.setText("");
      return;
    }

    this.promptText.setText(text);
    this.promptText.setVisible(true);
  }

  showDialogue(lines, onDone) {
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueOnDone = onDone;
    this.dialogueActive = true;
    this.lineFinished = false;
    this.clearDialogueObjects();

    this.dialogueBox = this.add.rectangle(640, 552, 960, 190, 0x05070d, 0.96);
    this.dialogueBox.setStrokeStyle(5, 0xf4e7c5);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(2000);

    this.dialogueText = this.add.text(200, 484, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "21px",
      color: "#ffffff",
      lineSpacing: 8,
      wordWrap: { width: 865 },
      resolution: 2
    }).setScrollFactor(0).setDepth(2001);

    this.continueText = this.add.text(1048, 616, "E", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "20px",
      color: "#111111",
      backgroundColor: "#f4e7c5",
      padding: { x: 9, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002);

    this.renderDialogueLine();
  }

  renderDialogueLine() {
    if (this.typeTimer) this.typeTimer.remove(false);

    const line = this.dialogueLines[this.dialogueIndex];
    let i = 0;
    this.dialogueText.setText("");
    this.continueText.setAlpha(0.35);
    this.lineFinished = false;

    this.typeTimer = this.time.addEvent({
      delay: 18,
      loop: true,
      callback: () => {
        if (i >= line.length) {
          this.typeTimer.remove(false);
          this.typeTimer = null;
          this.lineFinished = true;
          this.continueText.setAlpha(1);
          return;
        }

        this.dialogueText.setText(line.slice(0, i + 1));
        i++;
      }
    });
  }

  advanceDialogue() {
    if (!this.lineFinished) {
      if (this.typeTimer) this.typeTimer.remove(false);
      this.dialogueText.setText(this.dialogueLines[this.dialogueIndex]);
      this.lineFinished = true;
      this.continueText.setAlpha(1);
      return;
    }

    this.dialogueIndex++;
    if (this.dialogueIndex < this.dialogueLines.length) {
      this.renderDialogueLine();
      return;
    }

    const done = this.dialogueOnDone;
    this.clearDialogueObjects();
    this.dialogueActive = false;
    this.dialogueLines = null;
    this.dialogueOnDone = null;
    if (done) done();
  }

  clearDialogueObjects() {
    if (this.typeTimer) this.typeTimer.remove(false);
    if (this.dialogueBox) this.dialogueBox.destroy();
    if (this.dialogueText) this.dialogueText.destroy();
    if (this.continueText) this.continueText.destroy();

    this.typeTimer = null;
    this.dialogueBox = null;
    this.dialogueText = null;
    this.continueText = null;
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
