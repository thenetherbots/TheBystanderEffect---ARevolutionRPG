// src/scenes/HarborScene.js

class HarborScene extends Phaser.Scene {
  constructor() {
    super("HarborScene");
  }

  preload() {
    this.load.image("harborMap", "assets/harbor/harbor.png");
    this.load.image("teaCrate", "assets/harbor/crate.png");

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
    this.WORLD_W = 960;
    this.WORLD_H = 640;
    this.phase = "intro";
    this.facing = "left";
    this.playerLocked = true;
    this.carryingCrate = false;
    this.cratesDumped = 0;
    this.requiredCrates = 3;
    this.nearCrate = null;
    this.nearDumpZone = false;
    this.canDash = true;
    this.dashReadyAt = 0;
    this.redcoatActive = false;
    this.escapeStarted = false;

    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    this.createPlayerAnimations();
    this.createWorld();
    this.createPlayer();
    this.createCrates();
    this.createRedcoat();
    this.createZones();
    this.createInput();
    this.createCamera();
    this.createHUD();

    this.beginIntro();
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#101726");

    this.add.rectangle(480, 320, this.WORLD_W, this.WORLD_H, 0x172335);
    this.add.image(470, 180, "harborMap").setScale(3.25).setAlpha(0.55);

    this.add.rectangle(480, 492, 960, 210, 0x4a2d1c);
    this.add.rectangle(480, 394, 960, 26, 0x7a5530);
    this.add.rectangle(480, 400, 960, 6, 0x211309);

    this.water = this.add.rectangle(96, 333, 170, 245, 0x214b68, 0.9);
    this.add.rectangle(96, 333, 170, 245, 0x4fc3f7, 0.12).setStrokeStyle(4, 0xaee9ff);

    for (let i = 0; i < 7; i++) {
      const wave = this.add.rectangle(48 + i * 26, 278 + (i % 2) * 38, 18, 3, 0xbfefff, 0.45);
      this.tweens.add({
        targets: wave,
        x: wave.x + 12,
        alpha: 0.15,
        duration: 900 + i * 80,
        yoyo: true,
        repeat: -1
      });
    }

    this.shipHold = this.add.rectangle(300, 382, 300, 132, 0x6e411f);
    this.shipHold.setStrokeStyle(5, 0x261307);
    this.add.rectangle(300, 328, 300, 18, 0x9a6937);
    this.add.text(300, 298, "SHIP HOLD", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "20px",
      color: "#f4e7c5",
      resolution: 2
    }).setOrigin(0.5);

    this.dumpMarker = this.add.rectangle(96, 332, 128, 190, 0x6bd4ff, 0.12);
    this.dumpMarker.setStrokeStyle(4, 0xbfefff);
    this.add.text(96, 208, "WATER\nDUMP ZONE", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "17px",
      color: "#bfefff",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.dumpMarker,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1
    });

    this.escapeBanner = this.add.text(480, 603, "SOUTH ESCAPE ROUTE", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#f4e7c5",
      backgroundColor: "#211309",
      padding: { x: 12, y: 6 },
      resolution: 2
    }).setOrigin(0.5).setAlpha(0.35);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(760, 500, "idle-left-0");
    this.player.setScale(4);
    this.player.play("idle-left");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(12, 8);
    this.player.body.setOffset(2, 10);
  }

  createCrates() {
    this.crates = [];

    [
      [230, 370],
      [300, 370],
      [370, 370]
    ].forEach(([x, y], index) => {
      const crate = this.add.image(x, y, "teaCrate");
      crate.setScale(2.4);
      crate.setDepth(25);
      crate.activeCrate = true;
      crate.crateIndex = index;

      crate.prompt = this.add.text(x, y - 44, "E", {
        fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
        fontSize: "20px",
        color: "#111111",
        backgroundColor: "#f4e7c5",
        padding: { x: 8, y: 4 },
        resolution: 2
      }).setOrigin(0.5).setDepth(80).setVisible(false);

      crate.glow = this.add.rectangle(x, y, 58, 72, 0xf1ca4f, 0.16);
      crate.glow.setStrokeStyle(2, 0xf1ca4f, 0.35);
      crate.glow.setDepth(20);

      this.tweens.add({
        targets: crate.glow,
        alpha: 0.04,
        duration: 760,
        yoyo: true,
        repeat: -1
      });

      this.crates.push(crate);
    });
  }

  createRedcoat() {
    this.redcoat = this.physics.add.sprite(805, 390, "idle-left-0");
    this.redcoat.setScale(4);
    this.redcoat.setTint(0xb81f2b);
    this.redcoat.setAlpha(0.9);
    this.redcoat.play("idle-left");
    this.redcoat.body.setEnable(false);

    this.redcoatDirection = -1;
    this.vision = this.add.rectangle(700, 390, 170, 72, 0xffdf8a, 0.07);
    this.vision.setStrokeStyle(3, 0xffdf8a, 0.18);
    this.vision.setDepth(15);

    this.redcoatLabel = this.add.text(805, 328, "REDCOAT\nWATCH", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#ffd6d6",
      align: "center",
      backgroundColor: "#351013",
      padding: { x: 7, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setDepth(85);
  }

  createZones() {
    this.dumpZone = this.add.zone(96, 332, 150, 220);
    this.physics.add.existing(this.dumpZone, true);

    this.escapeZone = this.add.zone(480, 622, 520, 36);
    this.physics.add.existing(this.escapeZone, true);

    this.physics.add.overlap(this.player, this.dumpZone, () => {
      this.nearDumpZone = true;
    });

    this.physics.add.overlap(this.player, this.escapeZone, () => {
      if (this.phase === "chase" && !this.escapeStarted) {
        this.beginEscape();
      }
    });
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.12);
    this.cameras.main.centerOn(480, 360);
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

    this.statusText = this.add.text(36, 36, "BOSTON HARBOR", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#b8b8c8",
      backgroundColor: "#111827",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setScrollFactor(0).setDepth(this.uiDepth);
  }

  beginIntro() {
    this.phase = "intro";
    this.playerLocked = true;
    this.setObjective("Boston Harbor");
    this.setPhaseLabel("Phase: Intro");
    this.showDialogue([
      "Keep low. The tea is in the ship hold.",
      "Take a crate, carry it to the water, and press E to release it before the patrol understands.",
      "Press E near marked objects. Move with arrow keys."
    ], () => {
      this.beginDumping();
    });
  }

  beginDumping() {
    this.phase = "dumping";
    this.playerLocked = false;
    this.setObjective("Dump the tea crates: 0/3");
    this.setPhaseLabel("Phase: Dumping");
    this.showPrompt("Find a glowing crate in the ship hold.");
  }

  beginWarning() {
    if (this.redcoatActive) return;

    this.redcoatActive = true;
    this.redcoat.body.setEnable(true);
    this.redcoat.play("walk-left", true);
    this.tweens.add({
      targets: [this.vision, this.redcoatLabel],
      alpha: { from: 0, to: 1 },
      duration: 450
    });
    this.vision.setFillStyle(0xffdf8a, 0.16);
    this.vision.setStrokeStyle(3, 0xffdf8a, 0.55);
    this.cameras.main.shake(240, 0.006);
    this.showPrompt("The watchman turns his lantern. Avoid the yellow light.");
  }

  beginCaught() {
    if (this.phase !== "dumping") return;

    this.phase = "caught";
    this.playerLocked = true;
    this.player.setVelocity(0);
    this.dropCarriedCrate(false);
    this.redcoat.setVelocity(0);
    this.redcoat.play("idle-left", true);
    this.cameras.main.shake(460, 0.014);
    this.setObjective("Caught in the lantern.");
    this.setPhaseLabel("Phase: Spotted");
    this.showPrompt("");

    this.showDialogue([
      "Redcoat: You there! Step away from the hold.",
      "The crate hits the dock. There is no pretending this is innocent now.",
      "Run south. Your dash is ready."
    ], () => {
      this.beginChase();
    });
  }

  beginChase() {
    this.phase = "chase";
    this.playerLocked = false;
    this.canDash = true;
    this.setObjective("Run south to the escape route.");
    this.setPhaseLabel("Phase: Chase");
    this.showPrompt("SHIFT: Dash");
    this.escapeBanner.setAlpha(1);
    this.escapeBanner.setColor("#ffffff");
    this.vision.setVisible(false);
    this.redcoat.body.setEnable(true);
    this.redcoat.setAlpha(1);
    this.redcoat.setTint(0xff2222);
    this.cameras.main.flash(180, 140, 20, 20);
  }

  beginEscape() {
    this.escapeStarted = true;
    this.phase = "escape";
    this.playerLocked = true;
    this.player.setVelocity(0);
    this.redcoat.setVelocity(0);
    this.setObjective("Into the underground press.");
    this.setPhaseLabel("Phase: Escape");
    this.showPrompt("");
    this.cameras.main.fadeOut(750, 8, 8, 12);
    this.time.delayedCall(800, () => {
      this.scene.start("PrintShopScene");
    });
  }

  update() {
    this.nearDumpZone = false;
    this.nearCrate = null;

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

    if (this.phase === "dumping") {
      this.updateZoneProximity();
      this.checkCrateProximity();
      this.updateRedcoatPatrol();
      this.checkVision();
    }

    if (this.phase === "chase") {
      this.updateChase();
      this.checkEscapeRoute();
    }

    this.handleMovement();
    this.handleInteraction();
    this.updateCarryVisual();
    this.updateCratePrompts();
    this.updatePrompt();
  }

  updateRedcoatPatrol() {
    if (!this.redcoatActive || this.phase !== "dumping") return;

    this.redcoat.x += this.redcoatDirection * 0.85;

    if (this.redcoat.x < 560) {
      this.redcoatDirection = 1;
      this.redcoat.play("walk-right", true);
    }

    if (this.redcoat.x > 835) {
      this.redcoatDirection = -1;
      this.redcoat.play("walk-left", true);
    }

    const facingLeft = this.redcoatDirection < 0;
    this.vision.x = this.redcoat.x + (facingLeft ? -96 : 96);
    this.vision.y = this.redcoat.y + 2;
    this.redcoatLabel.x = this.redcoat.x;
    this.redcoatLabel.y = this.redcoat.y - 62;
  }

  checkVision() {
    if (!this.redcoatActive || !this.carryingCrate || this.phase !== "dumping") return;

    const seen =
      this.player.x > this.vision.x - this.vision.width / 2 &&
      this.player.x < this.vision.x + this.vision.width / 2 &&
      this.player.y > this.vision.y - this.vision.height / 2 &&
      this.player.y < this.vision.y + this.vision.height / 2;

    if (seen) {
      this.beginCaught();
    }
  }

  checkCrateProximity() {
    if (this.carryingCrate) return;

    for (const crate of this.crates) {
      if (!crate.activeCrate) continue;

      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, crate.x, crate.y);
      if (d < 78) {
        this.nearCrate = crate;
        return;
      }
    }
  }

  updateZoneProximity() {
    this.nearDumpZone =
      this.player.x > 21 &&
      this.player.x < 171 &&
      this.player.y > 222 &&
      this.player.y < 442;
  }

  checkEscapeRoute() {
    if (!this.escapeStarted && this.player.y > 590 && this.player.x > 220 && this.player.x < 740) {
      this.beginEscape();
    }
  }

  handleInteraction() {
    if (!Phaser.Input.Keyboard.JustDown(this.keyE)) return;

    if (this.phase === "dumping" && !this.carryingCrate && this.nearCrate) {
      this.pickUpCrate(this.nearCrate);
      return;
    }

    if (this.phase === "dumping" && this.carryingCrate && this.nearDumpZone) {
      this.dumpCrate();
    }
  }

  pickUpCrate(crate) {
    crate.activeCrate = false;
    crate.prompt.destroy();
    crate.glow.destroy();
    crate.destroy();

    this.carryingCrate = true;
    this.carriedCrate = this.add.image(this.player.x, this.player.y - 52, "teaCrate");
    this.carriedCrate.setScale(1.9);
    this.carriedCrate.setDepth(80);

    this.cameras.main.shake(120, 0.003);
    this.setObjective("Carry the crate to the water.");
    this.showPrompt("Move to the blue dump zone.");
  }

  dumpCrate() {
    this.releaseCrateIntoWater();
    this.cratesDumped++;
    this.cameras.main.shake(260, 0.008);

    this.setObjective(`Dump the tea crates: ${this.cratesDumped}/${this.requiredCrates}`);

    if (this.cratesDumped === 1) {
      this.beginWarning();
    } else if (this.cratesDumped === 2) {
      this.showPrompt("One crate left. The patrol is searching.");
    } else if (this.cratesDumped >= this.requiredCrates) {
      this.beginCaught();
    }
  }

  dropCarriedCrate(destroyOnly) {
    this.carryingCrate = false;

    if (!this.carriedCrate) return;

    if (destroyOnly) {
      this.carriedCrate.destroy();
    } else {
      this.tweens.add({
        targets: this.carriedCrate,
        y: this.player.y + 18,
        alpha: 0,
        duration: 240,
        onComplete: () => this.carriedCrate.destroy()
      });
    }

    this.carriedCrate = null;
  }

  releaseCrateIntoWater() {
    this.carryingCrate = false;

    const crate = this.carriedCrate;
    this.carriedCrate = null;

    if (!crate) return;

    crate.setDepth(70);
    this.tweens.add({
      targets: crate,
      x: 96,
      y: Phaser.Math.Clamp(this.player.y, 250, 410),
      scale: 1.35,
      angle: -18,
      alpha: 0.9,
      duration: 260,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.createSplash(crate.x, crate.y);
        crate.destroy();
      }
    });
  }

  createSplash(x, y) {
    const splash = this.add.circle(x, y, 12, 0xbfefff, 0.9).setDepth(75);
    const ripple = this.add.ellipse(x, y + 5, 28, 9, 0xbfefff, 0.4).setDepth(74);

    this.tweens.add({
      targets: splash,
      scale: 4,
      alpha: 0,
      duration: 520,
      onComplete: () => splash.destroy()
    });

    this.tweens.add({
      targets: ripple,
      scaleX: 3,
      scaleY: 1.6,
      alpha: 0,
      duration: 620,
      onComplete: () => ripple.destroy()
    });
  }

  updateChase() {
    this.physics.moveToObject(this.redcoat, this.player, 112);
    this.redcoatLabel.x = this.redcoat.x;
    this.redcoatLabel.y = this.redcoat.y - 62;

    const d = Phaser.Math.Distance.Between(this.redcoat.x, this.redcoat.y, this.player.x, this.player.y);

    if (d < 38) {
      this.cameras.main.shake(260, 0.015);
      this.player.setPosition(720, 500);
      this.redcoat.setPosition(805, 390);
    }
  }

  handleMovement() {
    const baseSpeed = this.carryingCrate ? 82 : 128;
    let speed = baseSpeed;

    if (this.phase === "chase" && Phaser.Input.Keyboard.JustDown(this.keyShift) && this.canDash) {
      speed = 330;
      this.canDash = false;
      this.dashReadyAt = this.time.now + 650;
      this.cameras.main.shake(80, 0.004);
      this.time.delayedCall(650, () => {
        this.canDash = true;
      });
    }

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

  updateCarryVisual() {
    if (!this.carriedCrate) return;

    this.carriedCrate.x = this.player.x + Phaser.Math.Between(-1, 1);
    this.carriedCrate.y = this.player.y - 52 + Phaser.Math.Between(-1, 1);
  }

  updateCratePrompts() {
    for (const crate of this.crates) {
      if (crate.prompt && crate.activeCrate) {
        crate.prompt.setVisible(crate === this.nearCrate);
      }
    }
  }

  updatePrompt() {
    if (this.phase === "chase") {
      this.showPrompt(this.canDash ? "SHIFT: Dash" : "Dash recovering...");
      return;
    }

    if (this.phase !== "dumping") return;

    if (!this.carryingCrate && this.nearCrate) {
      this.showPrompt("Press E to take this crate.");
    } else if (this.carryingCrate && this.nearDumpZone) {
      this.showPrompt("Press E to release the crate into the water.");
    } else if (this.carryingCrate && this.redcoatActive) {
      this.showPrompt("Avoid the lantern and reach the water.");
    } else if (this.carryingCrate) {
      this.showPrompt("Carry the crate to the blue water zone.");
    } else if (this.redcoatActive) {
      this.showPrompt("Take the last crate without crossing the lantern.");
    } else {
      this.showPrompt("Find a glowing crate in the ship hold.");
    }
  }

  setObjective(text) {
    this.objectiveText.setText(text);
  }

  setPhaseLabel(text) {
    this.currentPhaseLabel = text;
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
    this.clearUI();
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueOnDone = onDone;
    this.dialogueActive = true;

    this.dialogueBox = this.add.rectangle(640, 552, 940, 190, 0x05070d, 0.96);
    this.dialogueBox.setStrokeStyle(5, 0xf4e7c5);
    this.dialogueBox.setScrollFactor(0);
    this.dialogueBox.setDepth(2000);

    this.dialogueText = this.add.text(212, 484, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "21px",
      color: "#ffffff",
      lineSpacing: 8,
      wordWrap: { width: 840 },
      resolution: 2
    });
    this.dialogueText.setScrollFactor(0);
    this.dialogueText.setDepth(2001);

    this.continueText = this.add.text(1038, 616, "E", {
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
    this.clearUI();
    if (done) done();
  }

  clearUI() {
    if (this.typeTimer) this.typeTimer.remove(false);
    if (this.dialogueBox) this.dialogueBox.destroy();
    if (this.dialogueText) this.dialogueText.destroy();
    if (this.continueText) this.continueText.destroy();

    this.typeTimer = null;
    this.dialogueBox = null;
    this.dialogueText = null;
    this.continueText = null;
    this.dialogueLines = null;
    this.dialogueOnDone = null;
    this.dialogueActive = false;
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
