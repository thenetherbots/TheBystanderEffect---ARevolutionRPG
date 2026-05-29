class PrintShopScene extends Phaser.Scene {
  constructor() {
    super("PrintShopScene");
  }

  preload() {
    this.load.image("printShopBg", "assets/printingshop/printingshopbg.png");

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
    this.WORLD_H = 1254;
    this.phase = "arrival";
    this.facing = "up";
    this.playerLocked = false;
    this.nearPrinter = false;
    this.nearDelivery = null;
    this.deliveredCount = 0;
    this.totalPamphlets = 3;
    this.pamphletsReceived = false;
    this.escapeStarted = false;
    this.spottedCooldown = false;

    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    this.createPlayerAnimations();
    this.createWorld();
    this.createPlayer();
    this.createPrinter();
    this.createWalls();
    this.createDeliverySpots();
    this.createRedcoats();
    this.createInput();
    this.createCamera();
    this.createHUD();

    this.physics.add.collider(this.player, this.walls);
    this.setObjective("Find the printer.");
    this.showPrompt("The press is still warm. Find Thomas.");
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#07090b");
    this.add.image(this.WORLD_W / 2, this.WORLD_H / 2, "printShopBg").setDepth(0);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(627, 1120, "idle-up-0");
    this.player.setScale(4);
    this.player.play("idle-up");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(12, 8);
    this.player.body.setOffset(2, 10);
    this.player.setDepth(50);
  }

  createPrinter() {
    this.printer = this.physics.add.staticSprite(710, 500, "idle-left-0");
    this.printer.setScale(4);
    this.printer.setTint(0x7fcf7f);
    this.printer.setDepth(45);

    this.printerLabel = this.add.text(710, 438, "THOMAS\nTHE PRINTER", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#d7ffd7",
      align: "center",
      backgroundColor: "#132a1a",
      padding: { x: 7, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setDepth(70);

    this.printerZone = this.add.zone(710, 500, 145, 145);
    this.physics.add.existing(this.printerZone, true);
  }

  createWalls() {
    this.walls = this.physics.add.staticGroup();

    this.makeWall(627, 22, 1180, 44);
    this.makeWall(627, 1232, 1180, 44);
    this.makeWall(22, 627, 44, 1180);
    this.makeWall(1232, 627, 44, 1180);

    // Left shelves and stacked crates.
    this.makeWall(132, 312, 135, 375);
    this.makeWall(176, 1072, 250, 285);
    this.makeWall(364, 1082, 230, 142);

    // Main press and upper work tables.
    this.makeWall(608, 345, 150, 320);
    this.makeWall(853, 257, 260, 170);
    this.makeWall(1070, 273, 178, 186);

    // Lower-left composition table and paper stacks.
    this.makeWall(270, 650, 360, 160);
    this.makeWall(478, 705, 96, 230);
    this.makeWall(744, 682, 148, 210);
    this.makeWall(842, 682, 90, 162);

    // Right-hand press island and desks.
    this.makeWall(1028, 620, 215, 360);
    this.makeWall(930, 806, 145, 155);
    this.makeWall(1078, 889, 130, 205);
    this.makeWall(1060, 1106, 235, 170);
  }

  makeWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xff0000, 0);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  createDeliverySpots() {
    this.deliverySpots = [
      this.makeDeliverySpot(875, 456, 0x3b8cff, "BLUE DOOR"),
      this.makeDeliverySpot(825, 850, 0x46e36f, "GREEN DOOR"),
      this.makeDeliverySpot(350, 930, 0xffa23b, "AMBER DOOR")
    ];
  }

  makeDeliverySpot(x, y, color, label) {
    const zone = this.add.zone(x, y, 118, 118);
    this.physics.add.existing(zone, true);

    const glow = this.add.circle(x, y, 54, color, 0.15).setDepth(18);
    glow.setStrokeStyle(4, color, 0.75);

    const marker = this.add.rectangle(x, y, 42, 78, color, 0.1).setDepth(19);
    marker.setStrokeStyle(4, color, 0.95);

    const text = this.add.text(x, y - 72, label, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#ffffff",
      backgroundColor: "#101318",
      padding: { x: 7, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setDepth(70);

    this.tweens.add({
      targets: glow,
      alpha: 0.04,
      duration: 850,
      yoyo: true,
      repeat: -1
    });

    return {
      x,
      y,
      color,
      label,
      zone,
      glow,
      marker,
      text,
      delivered: false
    };
  }

  createRedcoats() {
    this.redcoats = [
      this.makeRedcoat(704, 540, 704, 835, "vertical"),
      this.makeRedcoat(300, 922, 560, 922, "horizontal"),
      this.makeRedcoat(905, 533, 905, 716, "vertical")
    ];
  }

  makeRedcoat(x1, y1, x2, y2, mode) {
    const guard = this.physics.add.sprite(x1, y1, mode === "vertical" ? "idle-down-0" : "idle-right-0");
    guard.setScale(4);
    guard.setTint(0xb81f2b);
    guard.setDepth(48);
    guard.body.setSize(12, 8);
    guard.body.setOffset(2, 10);

    const vision = this.add.ellipse(x1, y1, mode === "vertical" ? 92 : 170, mode === "vertical" ? 185 : 86, 0xffdf8a, 0.13);
    vision.setStrokeStyle(3, 0xffdf8a, 0.45);
    vision.setDepth(16);

    return {
      guard,
      vision,
      start: new Phaser.Math.Vector2(x1, y1),
      end: new Phaser.Math.Vector2(x2, y2),
      progress: 0,
      direction: 1,
      mode
    };
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1);
  }

  createHUD() {
    this.uiDepth = 1000;

    this.objectiveText = this.add.text(640, 38, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#111827",
      padding: { x: 16, y: 8 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.uiDepth);

    this.promptText = this.add.text(640, 88, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "17px",
      color: "#f4e7c5",
      backgroundColor: "#211309",
      padding: { x: 14, y: 7 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.uiDepth).setVisible(false);

    this.counterText = this.add.text(1110, 38, "PAMPHLETS 0/3", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#f1ca4f",
      backgroundColor: "#111827",
      padding: { x: 12, y: 8 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(this.uiDepth);

    this.statusText = this.add.text(36, 36, "UNDERGROUND PRESS", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#b8b8c8",
      backgroundColor: "#111827",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setScrollFactor(0).setDepth(this.uiDepth);
  }

  update() {
    this.nearPrinter = false;
    this.nearDelivery = null;

    if (this.dialogueActive) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) {
        this.advanceDialogue();
      }
      return;
    }

    if (this.playerLocked) {
      this.player.setVelocity(0);
      return;
    }

    this.updateProximity();
    this.updateRedcoats();
    this.checkLanterns();
    this.handleMovement();
    this.handleInteraction();
    this.updatePrompt();
  }

  updateProximity() {
    this.nearPrinter = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.printer.x, this.printer.y) < 105;

    if (!this.pamphletsReceived) return;

    for (const spot of this.deliverySpots) {
      if (spot.delivered) continue;

      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, spot.x, spot.y);
      if (d < 78) {
        this.nearDelivery = spot;
        return;
      }
    }
  }

  updateRedcoats() {
    if (!this.pamphletsReceived || this.phase === "complete") return;

    for (const redcoat of this.redcoats) {
      redcoat.progress += 0.0022 * redcoat.direction;

      if (redcoat.progress >= 1) {
        redcoat.progress = 1;
        redcoat.direction = -1;
      } else if (redcoat.progress <= 0) {
        redcoat.progress = 0;
        redcoat.direction = 1;
      }

      const x = Phaser.Math.Linear(redcoat.start.x, redcoat.end.x, redcoat.progress);
      const y = Phaser.Math.Linear(redcoat.start.y, redcoat.end.y, redcoat.progress);
      redcoat.guard.setPosition(x, y);
      redcoat.vision.setPosition(x, y);

      if (redcoat.mode === "vertical") {
        const anim = redcoat.direction > 0 ? "walk-down" : "walk-up";
        redcoat.guard.play(anim, true);
      } else {
        const anim = redcoat.direction > 0 ? "walk-right" : "walk-left";
        redcoat.guard.play(anim, true);
      }
    }
  }

  checkLanterns() {
    if (!this.pamphletsReceived || this.phase === "complete" || this.spottedCooldown) return;

    for (const redcoat of this.redcoats) {
      const dx = Math.abs(this.player.x - redcoat.vision.x);
      const dy = Math.abs(this.player.y - redcoat.vision.y);
      const inside = dx / (redcoat.vision.width / 2) + dy / (redcoat.vision.height / 2) < 0.92;

      if (inside) {
        this.onSpotted();
        return;
      }
    }
  }

  onSpotted() {
    this.spottedCooldown = true;
    this.playerLocked = true;
    this.player.setVelocity(0);
    this.cameras.main.shake(300, 0.012);
    this.cameras.main.flash(160, 140, 20, 20);
    this.setObjective("Spotted. Get back into shadow.");
    this.showPrompt("");

    this.time.delayedCall(420, () => {
      this.player.setPosition(627, 1120);
      this.facing = "up";
      this.player.play("idle-up");
      this.setObjective(`Deliver pamphlets: ${this.deliveredCount}/3`);
      this.showPrompt("Move when the lanterns pass.");
      this.playerLocked = false;
    });

    this.time.delayedCall(1300, () => {
      this.spottedCooldown = false;
    });
  }

  handleMovement() {
    const speed = 132;
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

    if (!this.pamphletsReceived && this.nearPrinter) {
      this.startPrinterDialogue();
      return;
    }

    if (this.pamphletsReceived && this.nearDelivery) {
      this.deliverPamphlet(this.nearDelivery);
    }
  }

  startPrinterDialogue() {
    this.playerLocked = true;
    this.showDialogue([
      "Thomas: Take this. Thomas Paine just finished writing it. It is called Common Sense.",
      "Thomas: The Crown wants to kill the free press, but they cannot catch all of us.",
      "Thomas: Slip these pamphlets into the marked doors. Move when the lanterns pass."
    ], () => {
      this.pamphletsReceived = true;
      this.phase = "delivery";
      this.playerLocked = false;
      this.setObjective("Deliver pamphlets: 0/3");
      this.updateCounter();
      this.showPrompt("Press E at each glowing door.");
      this.cameras.main.shake(160, 0.004);
    });
  }

  deliverPamphlet(spot) {
    spot.delivered = true;
    this.deliveredCount++;
    this.updateCounter();

    this.tweens.add({
      targets: [spot.glow, spot.marker, spot.text],
      alpha: 0.18,
      duration: 260
    });

    const slip = this.add.rectangle(spot.x, spot.y, 30, 12, 0xf4e7c5, 0.95).setDepth(80);
    this.tweens.add({
      targets: slip,
      y: spot.y + 28,
      alpha: 0,
      duration: 500,
      onComplete: () => slip.destroy()
    });

    this.cameras.main.shake(120, 0.004);
    this.setObjective(`Deliver pamphlets: ${this.deliveredCount}/3`);

    if (this.deliveredCount >= this.totalPamphlets) {
      this.completeDelivery();
    } else {
      this.showPrompt("Pamphlet delivered. Find the next glowing door.");
    }
  }

  completeDelivery() {
    this.phase = "complete";
    this.playerLocked = true;
    this.player.setVelocity(0);
    this.showPrompt("");
    this.setObjective("Common Sense will spread.");

    this.showDialogue([
      "Thomas: You did it. Three pamphlets delivered.",
      "Thomas: Common Sense will spread through every alley and tavern in Boston.",
      "Thomas: Ideas are more powerful than bayonets. Remember that."
    ], () => {
      this.beginTownSquareTransition();
    });
  }

  beginTownSquareTransition() {
    this.playerLocked = true;
    this.setObjective("The words leave the press.");
    this.showPrompt("");
    this.cameras.main.shake(180, 0.004);

    for (let i = 0; i < 18; i++) {
      const page = this.add.rectangle(
        this.player.x + Phaser.Math.Between(-35, 35),
        this.player.y + Phaser.Math.Between(-20, 20),
        22,
        30,
        0xf4e7c5,
        0.95
      ).setDepth(120);
      page.setAngle(Phaser.Math.Between(-18, 18));

      this.tweens.add({
        targets: page,
        x: page.x + Phaser.Math.Between(-260, 260),
        y: page.y - Phaser.Math.Between(180, 520),
        angle: page.angle + Phaser.Math.Between(-80, 80),
        alpha: 0,
        delay: i * 35,
        duration: 1050,
        ease: "Sine.easeOut",
        onComplete: () => page.destroy()
      });
    }

    const bridgeText = this.add.text(640, 230, "COMMON SENSE SPREADS", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "34px",
      color: "#f1ca4f",
      backgroundColor: "#05070d",
      padding: { x: 18, y: 8 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2100).setAlpha(0);

    const bridgeSubtext = this.add.text(640, 286, "Words become a public square.", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: "#05070d",
      padding: { x: 14, y: 6 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2100).setAlpha(0);

    this.tweens.add({
      targets: [bridgeText, bridgeSubtext],
      alpha: 1,
      y: "-=12",
      duration: 420,
      ease: "Sine.easeOut"
    });

    this.time.delayedCall(1350, () => {
      this.cameras.main.fadeOut(650, 241, 202, 79);
    });

    this.time.delayedCall(2050, () => {
      this.scene.start("TownSquareScene");
    });
  }

  updatePrompt() {
    if (!this.pamphletsReceived) {
      this.showPrompt(this.nearPrinter ? "Press E to speak with Thomas." : "Find Thomas near the printing press.");
      return;
    }

    if (this.nearDelivery) {
      this.showPrompt(`Press E to deliver to the ${this.nearDelivery.label.toLowerCase()}.`);
      return;
    }

    this.showPrompt("Avoid lanterns. Deliver pamphlets to glowing doors.");
  }

  updateCounter() {
    this.counterText.setText(`PAMPHLETS ${this.deliveredCount}/${this.totalPamphlets}`);
  }

  setObjective(text) {
    this.objectiveText.setText(text);
  }

  showPrompt(text) {
    if (!text) {
      this.promptText.setText("");
      this.promptText.setVisible(false);
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
