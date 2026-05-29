class DistrictMapScene extends Phaser.Scene {
  constructor() {
    super("DistrictMapScene");
  }

  preload() {
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
    this.facing = "up";
    this.fixedDistricts = 0;
    this.requiredDistricts = 4;
    this.playerLocked = false;
    this.dialogueActive = false;
    this.transitioning = false;
    this.endingStarted = false;
    this.spottedCooldown = false;
    this.gridPulse = 0;
    this.relaysActivated = 0;
    this.supportPower = 0;
    this.testimoniesFound = {};
    this.keyAvailable = false;
    this.freezeCensorsUntil = 0;
    this.nearRelay = null;
    this.nearDistrict = null;
    this.nearCorruption = null;

    this.physics.world.setBounds(0, 0, 1280, 720);
    this.createPlayerAnimations();
    this.createRoom();
    this.createPlayer();
    this.createWalls();
    this.createPads();
    this.createDistrictBlocks();
    this.createCensorBars();
    this.createRelays();
    this.createTestimonies();
    this.createCorruptionBlocks();
    this.createInput();
    this.createHUD();
    this.createIntro();

    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.blocks, this.walls);
    this.physics.add.collider(this.player, this.blocks);
    this.physics.add.collider(this.blocks, this.blocks);
  }

  createRoom() {
    this.cameras.main.setBackgroundColor("#030712");

    for (let x = 70; x <= 1210; x += 70) {
      this.add.line(0, 0, x, 60, x, 660, 0x1ee7ff, 0.12).setOrigin(0);
    }
    for (let y = 60; y <= 660; y += 70) {
      this.add.line(0, 0, 70, y, 1210, y, 0xff3b7a, 0.1).setOrigin(0);
    }

    this.add.rectangle(640, 360, 1060, 560, 0x0b1020, 0.82).setStrokeStyle(5, 0xf1ca4f, 0.82);
    this.add.rectangle(640, 360, 920, 430, 0x111827, 0.64).setStrokeStyle(3, 0x1ee7ff, 0.35);

    this.add.text(640, 78, "THE GOVERNOR'S MAP ROOM", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "30px",
      color: "#f1ca4f",
      backgroundColor: "#05070d",
      padding: { x: 16, y: 7 },
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(640, 118, "Gather testimony, repair districts, and spend civic power on map tools.", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "17px",
      color: "#bfefff",
      resolution: 2
    }).setOrigin(0.5);

    this.keyGlow = this.add.star(640, 360, 8, 14, 42, 0xf1ca4f, 0.28).setDepth(160);
    this.keyGlow.setVisible(false);
    this.keyCore = this.add.star(640, 360, 6, 8, 25, 0xf1ca4f, 0.95).setDepth(161);
    this.keyCore.setVisible(false);
    this.keyLabel = this.add.text(640, 310, "KEY OF\nSOVEREIGNTY", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#f1ca4f",
      align: "center",
      backgroundColor: "#05070d",
      padding: { x: 8, y: 5 },
      resolution: 2
    }).setOrigin(0.5).setDepth(162);
    this.keyLabel.setVisible(false);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(640, 585, "idle-up-0");
    this.player.setScale(2.15);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(12, 8);
    this.player.body.setOffset(2, 10);
    this.player.setDepth(80);
    this.player.play("idle-up");
  }

  createWalls() {
    this.walls = this.physics.add.staticGroup();
    this.makeWall(640, 42, 1120, 24);
    this.makeWall(640, 678, 1120, 24);
    this.makeWall(72, 360, 24, 620);
    this.makeWall(1208, 360, 24, 620);
    this.makeWall(640, 205, 220, 34);
    this.makeWall(640, 515, 220, 34);
  }

  makeWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xff0000, 0);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  createPads() {
    this.pads = [
      this.makePad(260, 230, "SPEECH", 0xf1ca4f),
      this.makePad(1020, 230, "PRESS", 0x1ee7ff),
      this.makePad(260, 490, "ASSEMBLY", 0xff3b7a),
      this.makePad(1020, 490, "VOTE", 0x8ef28e)
    ];
  }

  makePad(x, y, label, color) {
    const plate = this.add.rectangle(x, y, 130, 86, color, 0.08).setStrokeStyle(4, color, 0.75);
    const text = this.add.text(x, y - 68, label, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#ffffff",
      backgroundColor: "#05070d",
      padding: { x: 8, y: 4 },
      resolution: 2
    }).setOrigin(0.5);

    return { x, y, label, color, plate, text, occupied: false };
  }

  createDistrictBlocks() {
    this.blocks = this.physics.add.group();
    this.districts = [
      this.makeBlock(430, 305, "SPEECH", 0xf1ca4f, "district"),
      this.makeBlock(850, 305, "PRESS", 0x1ee7ff, "district"),
      this.makeBlock(430, 415, "ASSEMBLY", 0xff3b7a, "district"),
      this.makeBlock(850, 415, "VOTE", 0x8ef28e, "district")
    ];
  }

  makeBlock(x, y, label, color, kind) {
    const block = this.add.rectangle(x, y, 86, 58, color, 0.78).setStrokeStyle(4, 0xffffff, 0.75);
    this.physics.add.existing(block);
    block.body.setCollideWorldBounds(true);
    block.body.setBounce(0);
    block.body.setDrag(1800, 1800);
    block.body.setMaxVelocity(76, 76);
    block.setDepth(40);

    const text = this.add.text(x, y, label, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#05070d",
      align: "center",
      resolution: 2
    }).setOrigin(0.5).setDepth(41);

    this.blocks.add(block);
    return { block, text, label, color, kind, startX: x, startY: y, rejectReadyAt: 0, fixed: false };
  }

  createCensorBars() {
    this.censorBars = [
      this.makeCensorBar(640, 285, 360, 16, 0.95),
      this.makeCensorBar(640, 438, 360, 16, -0.95)
    ];
  }

  makeCensorBar(x, y, travel, height, dir) {
    const bar = this.add.rectangle(x, y, 185, height, 0xff3b7a, 0.22).setStrokeStyle(2, 0xff3b7a, 0.65);
    const label = this.add.text(x, y, "CENSOR", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#ff9bb8",
      resolution: 2
    }).setOrigin(0.5);
    return { bar, label, startX: x - travel / 2, endX: x + travel / 2, t: dir > 0 ? 0 : 1, dir, speed: 0.0019 };
  }

  createRelays() {
    this.relays = [
      this.makeRelay(640, 232, "FREEZE", "PUBLIC\nHEARING", 0xbfefff),
      this.makeRelay(640, 360, "MAGNET", "FAIR\nLINES", 0xf1ca4f),
      this.makeRelay(640, 492, "RESET", "CIVIC\nAUDIT", 0xff9bb8)
    ];
  }

  makeRelay(x, y, type, label, color) {
    const ring = this.add.circle(x, y, 32, color, 0.08).setStrokeStyle(3, color, 0.7).setDepth(30);
    const core = this.add.circle(x, y, 10, color, 0.65).setDepth(31);
    const text = this.add.text(x, y - 48, label, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "12px",
      color: "#ffffff",
      align: "center",
      backgroundColor: "#05070d",
      padding: { x: 6, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(32);

    this.tweens.add({ targets: ring, alpha: 0.2, scale: 1.12, duration: 900, yoyo: true, repeat: -1 });
    return { x, y, type, label, color, ring, core, text, used: false, cost: type === "MAGNET" ? 2 : 1 };
  }

  createTestimonies() {
    this.testimonies = [
      this.makeTestimony(640, 168, "SPEECH", "BANNED WORDS", 0xf1ca4f),
      this.makeTestimony(1110, 360, "PRESS", "BURIED PRESS", 0x1ee7ff),
      this.makeTestimony(170, 360, "ASSEMBLY", "BROKEN ASSEMBLY", 0xff3b7a),
      this.makeTestimony(640, 552, "VOTE", "SPLIT VOTES", 0x8ef28e)
    ];
  }

  makeTestimony(x, y, label, title, color) {
    const ring = this.add.circle(x, y, 24, color, 0.08).setStrokeStyle(3, color, 0.85).setDepth(35);
    const core = this.add.star(x, y, 5, 5, 13, color, 0.85).setDepth(36);
    const text = this.add.text(x, y - 36, title, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "11px",
      color: "#ffffff",
      backgroundColor: "#05070d",
      padding: { x: 6, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(37);

    this.tweens.add({ targets: core, angle: 360, duration: 1800, repeat: -1 });
    return { x, y, label, title, color, ring, core, text, collected: false };
  }

  createCorruptionBlocks() {
    this.corruptions = [
      this.makeBlock(640, 305, "FEAR", 0x6d214f, "corruption"),
      this.makeBlock(640, 415, "APATHY", 0x4b5563, "corruption")
    ];
    for (const item of this.corruptions) {
      item.block.setFillStyle(item.color, 0.62);
      item.block.setStrokeStyle(4, 0xff9bb8, 0.55);
      item.text.setColor("#ffffff");
    }
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  createHUD() {
    this.objectiveText = this.add.text(640, 668, "DISTRICTS FIXED 0/4", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#f1ca4f",
      backgroundColor: "#05070d",
      padding: { x: 14, y: 7 },
      resolution: 2
    }).setOrigin(0.5).setDepth(200);

    this.supportText = this.add.text(1000, 668, "CIVIC POWER 0", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#bfefff",
      backgroundColor: "#05070d",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setOrigin(0.5).setDepth(200);

    this.promptText = this.add.text(640, 632, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#f4e7c5",
      backgroundColor: "#211309",
      padding: { x: 10, y: 5 },
      resolution: 2
    }).setOrigin(0.5).setDepth(200);
  }

  createIntro() {
    this.cameras.main.flash(700, 241, 202, 79);
    this.showDialogue([
      "Runaway Clerk: This is where the Governor redraws the city until the people cannot answer him.",
      "Runaway Clerk: First gather testimony. A district will not lock without proof from the people.",
      "Runaway Clerk: Spend civic power on map tools, clear corruption, and keep the censor sweeps from rewriting you."
    ]);
  }

  update() {
    this.syncBlockLabels();
    this.updateCensorBars();
    this.updateProximity();
    this.checkTestimonies();

    if (this.transitioning) {
      this.player.setVelocity(0);
      return;
    }

    if (this.dialogueActive) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) this.advanceDialogue();
      return;
    }

    this.handleMovement();
    this.handleInteraction();
    this.checkDistricts();
    this.checkCensorHit();
    this.updatePrompt();
  }

  handleMovement() {
    const speed = 126;
    this.player.setVelocity(0);
    let moving = false;

    if (this.cursors.left.isDown || this.keys.left.isDown) {
      this.player.setVelocityX(-speed);
      this.facing = "left";
      moving = true;
    } else if (this.cursors.right.isDown || this.keys.right.isDown) {
      this.player.setVelocityX(speed);
      this.facing = "right";
      moving = true;
    }

    if (this.cursors.up.isDown || this.keys.up.isDown) {
      this.player.setVelocityY(-speed);
      this.facing = "up";
      moving = true;
    } else if (this.cursors.down.isDown || this.keys.down.isDown) {
      this.player.setVelocityY(speed);
      this.facing = "down";
      moving = true;
    }

    this.player.body.velocity.normalize().scale(speed);
    const animKey = moving ? `walk-${this.facing}` : `idle-${this.facing}`;
    if (this.player.anims.currentAnim?.key !== animKey) this.player.play(animKey);
  }

  syncBlockLabels() {
    for (const district of this.districts) {
      if (!district.fixed) {
        const vx = district.block.body.velocity.x;
        const vy = district.block.body.velocity.y;
        district.block.body.setVelocity(vx * 0.68, vy * 0.68);
        if (Math.abs(vx) < 8) district.block.body.setVelocityX(0);
        if (Math.abs(vy) < 8) district.block.body.setVelocityY(0);
        const clampedX = Phaser.Math.Clamp(district.block.x, 135, 1145);
        const clampedY = Phaser.Math.Clamp(district.block.y, 155, 590);
        if (clampedX !== district.block.x || clampedY !== district.block.y) {
          district.block.body.reset(clampedX, clampedY);
        }
      }
      district.text.setPosition(district.block.x, district.block.y);
      if (district.fixed) district.block.body.setVelocity(0, 0);
    }

    for (const corruption of this.corruptions) {
      const vx = corruption.block.body.velocity.x;
      const vy = corruption.block.body.velocity.y;
      corruption.block.body.setVelocity(vx * 0.6, vy * 0.6);
      if (Math.abs(vx) < 8) corruption.block.body.setVelocityX(0);
      if (Math.abs(vy) < 8) corruption.block.body.setVelocityY(0);
      const clampedX = Phaser.Math.Clamp(corruption.block.x, 135, 1145);
      const clampedY = Phaser.Math.Clamp(corruption.block.y, 155, 590);
      if (clampedX !== corruption.block.x || clampedY !== corruption.block.y) {
        corruption.block.body.reset(clampedX, clampedY);
      }
      corruption.text.setPosition(corruption.block.x, corruption.block.y);
    }
  }

  updateCensorBars() {
    const frozen = this.time.now < this.freezeCensorsUntil;
    for (const censor of this.censorBars) {
      censor.bar.setAlpha(frozen ? 0.05 : 0.22);
      censor.label.setAlpha(frozen ? 0.22 : 1);
      if (frozen) continue;
      censor.t += censor.speed * censor.dir;
      if (censor.t >= 1) {
        censor.t = 1;
        censor.dir = -1;
      } else if (censor.t <= 0) {
        censor.t = 0;
        censor.dir = 1;
      }
      censor.bar.x = Phaser.Math.Linear(censor.startX, censor.endX, censor.t);
      censor.label.x = censor.bar.x;
    }
  }

  updateProximity() {
    this.nearRelay = null;
    this.nearDistrict = null;
    this.nearCorruption = null;

    for (const relay of this.relays) {
      if (!relay.used && Phaser.Math.Distance.Between(this.player.x, this.player.y, relay.x, relay.y) < 72) {
        this.nearRelay = relay;
        break;
      }
    }

    for (const district of this.districts) {
      if (!district.fixed && Phaser.Math.Distance.Between(this.player.x, this.player.y, district.block.x, district.block.y) < 88) {
        this.nearDistrict = district;
        break;
      }
    }

    for (const corruption of this.corruptions) {
      if (!corruption.fixed && Phaser.Math.Distance.Between(this.player.x, this.player.y, corruption.block.x, corruption.block.y) < 88) {
        this.nearCorruption = corruption;
        break;
      }
    }
  }

  checkTestimonies() {
    for (const item of this.testimonies) {
      if (item.collected) continue;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y) > 38) continue;
      item.collected = true;
      this.testimoniesFound[item.label] = true;
      this.supportPower++;
      this.supportText.setText(`CIVIC POWER ${this.supportPower}`);
      item.ring.destroy();
      item.core.destroy();
      item.text.setText(`${item.label} PROOF`);
      item.text.setColor("#f1ca4f");
      this.showFloatingText(item.x, item.y - 48, "testimony secured", item.color);
      this.cameras.main.shake(90, 0.003);
    }
  }

  checkDistricts() {
    for (const district of this.districts) {
      if (district.fixed) continue;
      const pad = this.pads.find(item => item.label === district.label);
      const distance = Phaser.Math.Distance.Between(district.block.x, district.block.y, pad.x, pad.y);
      if (distance > 42) continue;
      if (!this.testimoniesFound[district.label]) {
        if (this.time.now >= district.rejectReadyAt) {
          this.showFloatingText(pad.x, pad.y - 74, `needs ${district.label.toLowerCase()} testimony`, 0xff9bb8);
          district.rejectReadyAt = this.time.now + 900;
        }
        const angle = Phaser.Math.Angle.Between(pad.x, pad.y, district.block.x, district.block.y);
        district.block.body.setVelocity(Math.cos(angle) * 70, Math.sin(angle) * 70);
        continue;
      }

      district.fixed = true;
      pad.occupied = true;
      district.block.body.reset(pad.x, pad.y);
      district.block.body.enable = false;
      district.text.setPosition(pad.x, pad.y);
      district.block.setFillStyle(district.color, 0.95);
      district.block.setStrokeStyle(5, 0xf1ca4f, 0.95);
      pad.plate.setStrokeStyle(5, 0xf1ca4f, 0.95);
      this.fixedDistricts++;
      this.objectiveText.setText(`DISTRICTS FIXED ${this.fixedDistricts}/${this.requiredDistricts}`);
      this.cameras.main.shake(120, 0.004);
      this.showFloatingText(pad.x, pad.y - 74, `${district.label} restored`, 0xf1ca4f);

      if (this.fixedDistricts >= this.requiredDistricts) this.unlockKey();
    }
  }

  checkCensorHit() {
    if (this.spottedCooldown || this.fixedDistricts >= this.requiredDistricts || this.time.now < this.freezeCensorsUntil) return;

    for (const censor of this.censorBars) {
      if (this.pointInRect(this.player.x, this.player.y, censor.bar)) {
        this.spottedCooldown = true;
        this.player.setPosition(640, 585);
        this.player.setVelocity(0);
        this.cameras.main.flash(130, 255, 60, 110);
        this.cameras.main.shake(220, 0.01);
        this.showFloatingText(640, 560, "CENSOR SWEEP", 0xff9bb8);
        this.time.delayedCall(950, () => {
          this.spottedCooldown = false;
        });
        return;
      }
    }
  }

  pointInRect(x, y, rect) {
    return x > rect.x - rect.width / 2 && x < rect.x + rect.width / 2 && y > rect.y - rect.height / 2 && y < rect.y + rect.height / 2;
  }

  updatePrompt() {
    if (this.fixedDistricts >= this.requiredDistricts) {
      this.promptText.setText("Press E at the Key of Sovereignty.");
      return;
    }

    if (this.nearRelay) {
      this.promptText.setText(`Press E: ${this.nearRelay.label.replace("\n", " ").toLowerCase()} costs ${this.nearRelay.cost} civic power.`);
    } else if (this.nearDistrict) {
      const proofText = this.testimoniesFound[this.nearDistrict.label] ? "proof ready" : "find testimony first";
      this.promptText.setText(`Press E to stabilize ${this.nearDistrict.label.toLowerCase()} file. ${proofText}.`);
    } else if (this.nearCorruption) {
      this.promptText.setText("Press E to spend 1 civic power and clear corruption.");
    } else {
      this.promptText.setText("Collect testimony. Push files. Spend civic power on tools.");
    }
  }

  handleInteraction() {
    if (!Phaser.Input.Keyboard.JustDown(this.keyE)) return;

    if (this.fixedDistricts >= this.requiredDistricts) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, 640, 360) < 82) this.finishScene();
      return;
    }
    if (this.nearRelay) {
      this.activateRelay(this.nearRelay);
      return;
    }

    if (this.nearCorruption) {
      this.clearCorruption(this.nearCorruption);
      return;
    }

    if (this.nearDistrict) this.stabilizeDistrict(this.nearDistrict);
  }

  activateRelay(relay) {
    if (this.supportPower < relay.cost) {
      this.showFloatingText(relay.x, relay.y - 60, "needs more civic power", 0xff9bb8);
      return;
    }

    this.supportPower -= relay.cost;
    this.supportText.setText(`CIVIC POWER ${this.supportPower}`);
    relay.used = true;
    relay.ring.setStrokeStyle(4, 0xf1ca4f, 0.95);
    relay.core.setFillStyle(0xf1ca4f, 0.95);
    relay.text.setText("ACTIVE");
    relay.text.setColor("#f1ca4f");
    this.relaysActivated++;

    if (relay.type === "FREEZE") {
      this.freezeCensorsUntil = this.time.now + 5200;
      this.showFloatingText(relay.x, relay.y - 60, "censor sweeps paused", 0xbfefff);
    } else if (relay.type === "MAGNET") {
      for (const district of this.districts) {
        if (district.fixed) continue;
        const pad = this.pads.find(item => item.label === district.label);
        const angle = Phaser.Math.Angle.Between(district.block.x, district.block.y, pad.x, pad.y);
        district.block.body.setVelocity(Math.cos(angle) * 70, Math.sin(angle) * 70);
      }
      this.showFloatingText(relay.x, relay.y - 60, "district files pulled toward home", 0xf1ca4f);
    } else if (relay.type === "RESET") {
      for (const district of this.districts) {
        if (district.fixed) continue;
        district.block.body.reset(district.startX, district.startY);
        district.block.body.setVelocity(0, 0);
      }
      this.showFloatingText(relay.x, relay.y - 60, "loose files restored", 0xff9bb8);
    }

    this.cameras.main.shake(120, 0.004);
  }

  clearCorruption(corruption) {
    if (this.supportPower < 1) {
      this.showFloatingText(corruption.block.x, corruption.block.y - 54, "needs civic power", 0xff9bb8);
      return;
    }

    this.supportPower--;
    this.supportText.setText(`CIVIC POWER ${this.supportPower}`);
    corruption.fixed = true;
    corruption.block.body.enable = false;
    corruption.block.setAlpha(0.18);
    corruption.text.setText("CLEARED");
    corruption.text.setColor("#f1ca4f");
    this.showFloatingText(corruption.block.x, corruption.block.y - 54, "corruption cleared", 0xf1ca4f);
  }

  stabilizeDistrict(district) {
    district.block.body.setVelocity(0, 0);
    district.block.body.reset(Math.round(district.block.x / 20) * 20, Math.round(district.block.y / 20) * 20);
    district.text.setPosition(district.block.x, district.block.y);
    this.showFloatingText(district.block.x, district.block.y - 54, "file stabilized", 0xbfefff);
  }

  unlockKey() {
    this.keyAvailable = true;
    this.keyGlow.setVisible(true);
    this.keyCore.setVisible(true);
    this.keyLabel.setVisible(true);
    this.tweens.add({ targets: this.keyGlow, alpha: 0.85, scale: 1.25, duration: 800, yoyo: true, repeat: -1 });
    this.tweens.add({ targets: this.keyCore, angle: 360, duration: 1600, repeat: -1 });
    this.cameras.main.flash(260, 241, 202, 79);
    this.showDialogue([
      "The map stops fighting you.",
      "The districts reconnect. The castle machinery loses its grip.",
      "The Key of Sovereignty appears."
    ]);
  }

  finishScene() {
    if (this.endingStarted) return;
    this.endingStarted = true;
    this.player.setVelocity(0);
    this.showDialogue([
      "Bystander: The map belongs to the people.",
      "Runaway Clerk: Then the Governor can be challenged."
    ], () => {
      this.transitioning = true;
      this.objectiveText.setText("KEY OF SOVEREIGNTY CLAIMED");
      this.promptText.setText("Next: confront the Arbitrary Governor.");
      this.cameras.main.flash(500, 241, 202, 79);
      this.cameras.main.fadeOut(850, 241, 202, 79);
      this.time.delayedCall(900, () => this.scene.start("GovernorBossScene"));
    });
  }

  showFloatingText(x, y, text, color) {
    const label = this.add.text(x, y, text, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: `#${color.toString(16).padStart(6, "0")}`,
      backgroundColor: "#05070d",
      padding: { x: 8, y: 5 },
      resolution: 2
    }).setOrigin(0.5).setDepth(250);

    this.tweens.add({ targets: label, y: y - 30, alpha: 0, duration: 1500, onComplete: () => label.destroy() });
  }

  showDialogue(lines, onDone = null) {
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueOnDone = onDone;
    this.dialogueActive = true;
    this.lineFinished = false;
    this.clearDialogueObjects();

    this.dialogueBox = this.add.rectangle(640, 560, 880, 130, 0x05070d, 0.96).setDepth(300);
    this.dialogueBox.setStrokeStyle(5, 0x1ee7ff);
    this.dialogueText = this.add.text(225, 520, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      lineSpacing: 6,
      wordWrap: { width: 830 },
      resolution: 2
    }).setDepth(301);
    this.continueText = this.add.text(1048, 606, "E", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#111111",
      backgroundColor: "#bfefff",
      padding: { x: 7, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(302);

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
      delay: 16,
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
        this.anims.create({ key: `walk-${dir}`, frames: [0, 1, 2, 3].map(i => ({ key: `walk-${dir}-${i}` })), frameRate: 8, repeat: -1 });
      }
      if (!this.anims.exists(`idle-${dir}`)) {
        this.anims.create({ key: `idle-${dir}`, frames: [0, 1, 2, 3].map(i => ({ key: `idle-${dir}-${i}` })), frameRate: 4, repeat: -1 });
      }
    }
  }
}
