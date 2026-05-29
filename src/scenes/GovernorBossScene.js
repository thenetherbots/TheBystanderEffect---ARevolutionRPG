class GovernorBossScene extends Phaser.Scene {
  constructor() {
    super("GovernorBossScene");
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
    this.phase = "intro";
    this.facing = "up";
    this.lastDirection = new Phaser.Math.Vector2(0, -1);
    this.playerHP = 10;
    this.maxHP = 10;
    this.canDash = true;
    this.invulnerable = false;
    this.dialogueActive = false;
    this.lineFinished = false;
    this.transitioning = false;
    this.defeated = false;
    this.nextAttackAt = 0;
    this.nextMandateAt = 0;
    this.phaseStartedAt = this.time.now;
    this.channelingNode = null;
    this.channelingTower = null;
    this.channelingCitizen = null;
    this.channelStart = 0;
    this.voteCount = 0;
    this.freezeCensorsUntil = 0;
    this.sovereigntyCharge = 0;
    this.activeMandate = null;
    this.mandateUntil = 0;
    this.lastMoveAt = this.time.now;
    this.noDashActive = false;

    this.fearHP = 100;
    this.apathyHP = 100;
    this.controlHP = 100;
    this.systemHP = 100;
    this.towersDestroyed = 0;
    this.requiredTowers = 3;
    this.citizensAwakened = 0;
    this.requiredAwakened = 5;
    this.nodesFixed = 0;
    this.requiredNodes = 4;

    this.phaseObjects = [];
    this.hazards = [];
    this.projectiles = [];
    this.censorBars = [];
    this.clones = [];
    this.gerryWalls = [];
    this.powerCooldowns = { speech: 0, press: 0, minds: 0 };

    this.physics.world.setBounds(0, 0, 1280, 720);
    this.createPlayerAnimations();
    this.createArena();
    this.createPlayer();
    this.createGovernor();
    this.createInput();
    this.createHUD();
    this.showDialogue([
      "The Arbitrary Governor: You repaired a map and think you repaired a nation?",
      "The Arbitrary Governor: Representation is inefficient.",
      "The Arbitrary Governor: Bring your little key, Bystander."
    ], () => this.startFearPhase());
  }

  createArena() {
    this.cameras.main.setBackgroundColor("#020617");

    for (let x = 80; x <= 1200; x += 80) {
      this.add.line(0, 0, x, 92, x, 650, 0x1ee7ff, 0.12).setOrigin(0);
    }
    for (let y = 100; y <= 640; y += 70) {
      this.add.line(0, 0, 90, y, 1190, y, 0xff3b7a, 0.1).setOrigin(0);
    }

    this.add.rectangle(640, 370, 1080, 540, 0x0b1020, 0.88).setStrokeStyle(5, 0x1ee7ff, 0.5);
    this.add.rectangle(640, 106, 640, 82, 0x05070d, 0.96).setStrokeStyle(4, 0xf1ca4f, 0.8);
    this.add.text(640, 94, "THE ARBITRARY GOVERNOR'S COURT", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "25px",
      color: "#f1ca4f",
      resolution: 2
    }).setOrigin(0.5);
    this.screenText = this.add.text(640, 132, "ORDER  EFFICIENCY  COMPLIANCE", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#ff9bb8",
      resolution: 2
    }).setOrigin(0.5);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(640, 600, "idle-up-0");
    this.player.setScale(2.2);
    this.player.body.setSize(12, 8);
    this.player.body.setOffset(2, 10);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(90);
    this.player.play("idle-up");
  }

  createGovernor() {
    this.governor = this.add.container(640, 195).setDepth(70);
    const body = this.add.rectangle(0, 16, 72, 88, 0x111827, 0.95).setStrokeStyle(4, 0xff3b7a, 0.82);
    const head = this.add.circle(0, -42, 28, 0xd6c4a5, 1).setStrokeStyle(3, 0xf1ca4f, 0.8);
    const visor = this.add.rectangle(0, -45, 48, 10, 0x05070d, 1);
    const scepter = this.add.rectangle(54, 2, 12, 112, 0xff3b7a, 0.88);
    const bar = this.add.text(54, -20, "CENSOR", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "10px",
      color: "#05070d",
      resolution: 2
    }).setOrigin(0.5).setAngle(90);
    this.governor.add([body, head, visor, scepter, bar]);

    this.tweens.add({ targets: this.governor, y: 205, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
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
    this.keyShift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.keyOne = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.keyTwo = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.keyThree = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  }

  createHUD() {
    this.phaseText = this.add.text(24, 24, "PHASE: GOVERNOR", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#f1ca4f",
      backgroundColor: "#05070d",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setDepth(300);

    this.hpText = this.add.text(24, 62, "VOICE 10/10", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#bfefff",
      backgroundColor: "#05070d",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setDepth(300);

    this.voicePips = [];
    for (let i = 0; i < this.maxHP; i++) {
      this.voicePips.push(this.add.rectangle(34 + i * 26, 104, 18, 18, 0xf1ca4f, 0.95).setStrokeStyle(2, 0xffffff, 0.65).setDepth(300));
    }

    this.objectiveText = this.add.text(640, 660, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "17px",
      color: "#ffffff",
      backgroundColor: "#111827",
      padding: { x: 14, y: 7 },
      resolution: 2
    }).setOrigin(0.5).setDepth(300);

    this.powerText = this.add.text(1254, 24, "1 SPEECH  2 PRESS  3 MINDS", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#f4e7c5",
      backgroundColor: "#05070d",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setOrigin(1, 0).setDepth(300);

    this.bossBarBack = this.add.rectangle(640, 42, 420, 18, 0x05070d, 0.95).setStrokeStyle(3, 0xf1ca4f, 0.75).setDepth(300);
    this.bossBar = this.add.rectangle(433, 42, 414, 10, 0xff3b7a, 0.95).setOrigin(0, 0.5).setDepth(301);

    this.keyText = this.add.text(1254, 62, "KEY CHARGE 0%", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "13px",
      color: "#f1ca4f",
      backgroundColor: "#05070d",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setOrigin(1, 0).setDepth(300);

    this.mandateText = this.add.text(640, 182, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "20px",
      color: "#ff9bb8",
      backgroundColor: "#05070d",
      padding: { x: 14, y: 7 },
      resolution: 2
    }).setOrigin(0.5).setDepth(320).setVisible(false);

    this.warningText = this.add.text(640, 620, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#f1ca4f",
      backgroundColor: "#05070d",
      padding: { x: 10, y: 5 },
      resolution: 2
    }).setOrigin(0.5).setDepth(300);
  }

  update() {
    this.cleanupDeadObjects();

    if (this.defeated) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyR) || Phaser.Input.Keyboard.JustDown(this.keyE)) this.retryBoss();
      return;
    }

    if (this.transitioning) {
      this.player.setVelocity(0);
      return;
    }

    if (this.dialogueActive) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) this.advanceDialogue();
      return;
    }

    this.handlePlayerMovement();
    this.handleDash();
    this.updateMandate();
    this.handleKeyBurst();
    this.updateHazards();

    switch (this.phase) {
      case "fear":
        this.updateFearPhase();
        break;
      case "apathy":
        this.updateApathyPhase();
        break;
      case "control":
        this.updateControlPhase();
        break;
      case "system":
        this.updateSystemPhase();
        break;
      case "finalVote":
        this.updateFinalVote();
        break;
    }
  }

  handlePlayerMovement() {
    let speed = 150;
    if (this.phase === "apathy" && this.inFog()) speed = 98;

    this.player.setVelocity(0);
    let moving = false;

    if (this.cursors.left.isDown || this.keys.left.isDown) {
      this.player.setVelocityX(-speed);
      this.facing = "left";
      this.lastDirection.set(-1, 0);
      moving = true;
    } else if (this.cursors.right.isDown || this.keys.right.isDown) {
      this.player.setVelocityX(speed);
      this.facing = "right";
      this.lastDirection.set(1, 0);
      moving = true;
    }

    if (this.cursors.up.isDown || this.keys.up.isDown) {
      this.player.setVelocityY(-speed);
      this.facing = "up";
      this.lastDirection.set(0, -1);
      moving = true;
    } else if (this.cursors.down.isDown || this.keys.down.isDown) {
      this.player.setVelocityY(speed);
      this.facing = "down";
      this.lastDirection.set(0, 1);
      moving = true;
    }

    this.player.body.velocity.normalize().scale(speed);
    if (moving) this.lastMoveAt = this.time.now;
    const animKey = moving ? `walk-${this.facing}` : `idle-${this.facing}`;
    if (this.player.anims.currentAnim?.key !== animKey) this.player.play(animKey);
  }

  handleDash() {
    if (!Phaser.Input.Keyboard.JustDown(this.keyShift) || !this.canDash) return;
    if (this.activeMandate === "NO_DASH") {
      this.addFloatingLabel(this.player.x, this.player.y - 55, "mandate violated", 0xff9bb8, 800);
      this.damagePlayer();
      return;
    }
    this.canDash = false;
    this.player.body.velocity.x = this.lastDirection.x * 430;
    this.player.body.velocity.y = this.lastDirection.y * 430;
    this.player.setTint(0xbfefff);
    this.time.delayedCall(170, () => this.player.clearTint());
    this.time.delayedCall(700, () => {
      this.canDash = true;
    });
  }

  handleKeyBurst() {
    if (!Phaser.Input.Keyboard.JustDown(this.keySpace) || this.dialogueActive || this.phase === "finalVote") return;
    if (this.sovereigntyCharge < 100) {
      this.addFloatingLabel(this.player.x, this.player.y - 58, "key not charged", 0xb8b8c8, 700);
      return;
    }

    this.sovereigntyCharge = 0;
    this.updateKeyText();
    this.clearHazardsOnly();
    this.freezeCensorsUntil = this.time.now + 1800;
    this.cameras.main.flash(360, 241, 202, 79);
    this.cameras.main.shake(360, 0.012);

    const ring = this.add.circle(this.player.x, this.player.y, 18, 0xf1ca4f, 0.18).setStrokeStyle(5, 0xf1ca4f, 0.9).setDepth(250);
    this.tweens.add({
      targets: ring,
      radius: 420,
      alpha: 0,
      duration: 650,
      ease: "Sine.easeOut",
      onComplete: () => ring.destroy()
    });

    if (this.phase === "system") this.damageSystem(16, "key of sovereignty breaks the system");
    else this.addFloatingLabel(this.player.x, this.player.y - 70, "sovereign burst", 0xf1ca4f, 1000);
  }

  addCharge(amount) {
    this.sovereigntyCharge = Phaser.Math.Clamp(this.sovereigntyCharge + amount, 0, 100);
    this.updateKeyText();
    if (this.sovereigntyCharge >= 100) {
      this.keyText.setText("KEY CHARGED: SPACE");
      this.tweens.add({ targets: this.keyText, alpha: 0.35, duration: 220, yoyo: true, repeat: 5 });
    }
  }

  updateKeyText() {
    this.keyText.setText(`KEY CHARGE ${Math.floor(this.sovereigntyCharge)}%`);
  }

  updateMandate() {
    if (this.phase === "intro" || this.phase === "finalVote") return;

    if (this.activeMandate && this.time.now > this.mandateUntil) {
      this.clearMandate();
    }

    if (!this.activeMandate && this.time.now > this.nextMandateAt) {
      this.issueMandate();
    }

    if (this.activeMandate === "KEEP_MOVING" && this.time.now - this.lastMoveAt > 900) {
      this.addFloatingLabel(this.player.x, this.player.y - 55, "mandate violated", 0xff9bb8, 800);
      this.lastMoveAt = this.time.now;
      this.damagePlayer();
    }

    if (this.activeMandate === "STAND_IN_LIGHT" && (!this.mandateZone || Phaser.Math.Distance.Between(this.player.x, this.player.y, this.mandateZone.x, this.mandateZone.y) > this.mandateZone.radius)) {
      if (!this.mandateTick || this.time.now > this.mandateTick) {
        this.mandateTick = this.time.now + 850;
        this.damagePlayer();
        this.addFloatingLabel(this.player.x, this.player.y - 55, "outside public light", 0xff9bb8, 800);
      }
    }
  }

  issueMandate() {
    const pool = this.phase === "system" ? ["KEEP_MOVING", "NO_DASH", "STAND_IN_LIGHT"] : ["KEEP_MOVING", "STAND_IN_LIGHT", "NO_DASH"];
    this.activeMandate = pool[Phaser.Math.Between(0, pool.length - 1)];
    this.mandateUntil = this.time.now + 4300;
    this.nextMandateAt = this.time.now + 7600;
    this.mandateTick = 0;

    if (this.activeMandate === "KEEP_MOVING") {
      this.mandateText.setText("GOVERNOR MANDATE: KEEP MOVING");
    } else if (this.activeMandate === "NO_DASH") {
      this.mandateText.setText("GOVERNOR MANDATE: NO DASHING");
    } else {
      const x = Phaser.Math.Between(260, 1020);
      const y = Phaser.Math.Between(280, 555);
      this.mandateZone = this.add.circle(x, y, 74, 0xf1ca4f, 0.11).setStrokeStyle(4, 0xf1ca4f, 0.82).setDepth(33);
      this.phaseObjects.push(this.mandateZone);
      this.mandateText.setText("GOVERNOR MANDATE: STAND IN PUBLIC LIGHT");
    }

    this.mandateText.setVisible(true);
    this.cameras.main.shake(90, 0.003);
  }

  clearMandate() {
    if (this.mandateZone?.destroy) this.mandateZone.destroy();
    this.mandateZone = null;
    this.activeMandate = null;
    this.mandateText.setVisible(false);
  }

  startFearPhase() {
    this.phase = "fear";
    this.towersDestroyed = 0;
    this.fearHP = 100;
    this.phaseStartedAt = this.time.now;
    this.nextAttackAt = this.time.now + 650;
    this.nextMandateAt = this.time.now + 2800;
    this.clearPhaseObjects();
    this.screenText.setText("FEAR IS FASTER THAN FREEDOM");
    this.phaseText.setText("PHASE 1: FEAR");
    this.objectiveText.setText("Hold E at towers to expose them. Move when warnings flash.");
    this.warningText.setText("SHIFT dash through waves. Holding E is risky but necessary.");
    this.setBossBar(100, 0xff3b7a);
    this.towers = [
      this.makeTower(245, 292, "FEARCAST"),
      this.makeTower(640, 290, "LOYALTY"),
      this.makeTower(1035, 292, "ORDER")
    ];
    this.showDialogue([
      "The Arbitrary Governor: People obey when they are afraid.",
      "The Arbitrary Governor: Fear is faster than freedom."
    ]);
  }

  makeTower(x, y, label) {
    const base = this.add.rectangle(x, y, 70, 92, 0x270b20, 0.95).setStrokeStyle(4, 0xff3b7a, 0.85).setDepth(45);
    const eye = this.add.circle(x, y - 12, 16, 0xff3b7a, 0.65).setDepth(46);
    const text = this.add.text(x, y + 64, label, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "12px",
      color: "#ff9bb8",
      backgroundColor: "#05070d",
      padding: { x: 6, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(47);
    const progress = this.add.rectangle(x, y + 48, 0, 7, 0xf1ca4f, 0.9).setOrigin(0, 0.5).setDepth(48);
    progress.setVisible(false);
    const tower = { x, y, base, eye, text, progress, destroyed: false };
    this.phaseObjects.push(base, eye, text, progress);
    return tower;
  }

  updateFearPhase() {
    if (this.time.now >= this.nextAttackAt) {
      this.spawnFearAttack();
      this.nextAttackAt = this.time.now + Phaser.Math.Between(560, 860);
    }

    this.handleTowerExposure();
  }

  spawnFearAttack() {
    const roll = Phaser.Math.Between(0, 3);
    if (roll === 0) {
      this.spawnStrike(Phaser.Math.Between(160, 1120), Phaser.Math.Between(245, 585));
      this.time.delayedCall(120, () => this.spawnStrike(Phaser.Math.Between(160, 1120), Phaser.Math.Between(245, 585)));
    } else if (roll === 1) {
      this.spawnFearWave(Phaser.Math.Between(260, 585), 1);
    } else if (roll === 2) {
      this.spawnFearWave(Phaser.Math.Between(260, 585), 1);
      this.time.delayedCall(220, () => this.spawnFearWave(Phaser.Math.Between(260, 585), -1));
    } else {
      this.spawnStrike(this.player.x, this.player.y);
      this.spawnStrike(Phaser.Math.Clamp(this.player.x + Phaser.Math.Between(-160, 160), 150, 1130), Phaser.Math.Clamp(this.player.y + Phaser.Math.Between(-140, 100), 230, 610));
    }
  }

  spawnStrike(x, y) {
    const warning = this.add.circle(x, y, 38, 0xff3b7a, 0.12).setStrokeStyle(4, 0xff3b7a, 0.7).setDepth(35);
    this.hazards.push({ shape: warning, type: "circle", x, y, radius: 38, active: false, expires: this.time.now + 980 });
    this.phaseObjects.push(warning);
    this.tweens.add({ targets: warning, alpha: 0.55, scale: 1.18, duration: 240, yoyo: true, repeat: 3 });
    this.time.delayedCall(560, () => {
      warning.setFillStyle(0xff3b7a, 0.5);
      const item = this.hazards.find(h => h.shape === warning);
      if (item) item.active = true;
    });
  }

  spawnFearWave(y, dir = 1) {
    const startX = dir > 0 ? -90 : 1370;
    const wave = this.add.rectangle(startX, y, 190, 24, 0xff3b7a, 0.36).setStrokeStyle(2, 0xff9bb8, 0.8).setDepth(36);
    const hazard = { shape: wave, type: "rect", active: true, vx: 390 * dir, expires: this.time.now + 4200 };
    this.hazards.push(hazard);
    this.phaseObjects.push(wave);
    this.addFloatingLabel(dir > 0 ? 95 : 1185, y - 32, "FEAR WAVE", 0xff9bb8, 700);
  }

  handleTowerExposure() {
    let nearTower = null;
    for (const tower of this.towers) {
      if (!tower.destroyed && Phaser.Math.Distance.Between(this.player.x, this.player.y, tower.x, tower.y) < 92) {
        nearTower = tower;
        break;
      }
    }

    if (!nearTower || !this.keyE.isDown) {
      if (this.channelingTower?.progress) this.channelingTower.progress.setVisible(false);
      this.channelingTower = null;
      return;
    }

    if (this.channelingTower !== nearTower) {
      this.channelingTower = nearTower;
      this.channelStart = this.time.now;
      nearTower.progress.setVisible(true);
      nearTower.progress.x = nearTower.x - 35;
      nearTower.progress.width = 0;
    }

    const progress = Phaser.Math.Clamp((this.time.now - this.channelStart) / 880, 0, 1);
    nearTower.progress.width = 70 * progress;
    if (progress >= 1) {
      nearTower.progress.setVisible(false);
      this.destroyTower(nearTower);
      this.channelingTower = null;
    }
  }

  destroyTower(tower) {
    tower.destroyed = true;
    tower.base.setAlpha(0.22);
    tower.eye.destroy();
    tower.text.setText("EXPOSED");
    tower.text.setColor("#f1ca4f");
    this.towersDestroyed++;
    this.addCharge(18);
    this.fearHP = Math.max(0, 100 - this.towersDestroyed * 34);
    this.setBossBar(this.fearHP, 0xff3b7a);
    this.objectiveText.setText(`Hold E to expose towers: ${this.towersDestroyed}/${this.requiredTowers}`);
    this.cameras.main.shake(180, 0.006);
    this.addFloatingLabel(tower.x, tower.y - 68, "propaganda exposed", 0xf1ca4f, 1400);

    if (this.towersDestroyed >= this.requiredTowers) {
      this.showDialogue([
        "The Arbitrary Governor: Fine. Remove fear.",
        "The Arbitrary Governor: They still will not care."
      ], () => this.startApathyPhase());
    }
  }

  startApathyPhase() {
    this.phase = "apathy";
    this.citizensAwakened = 0;
    this.apathyHP = 100;
    this.phaseStartedAt = this.time.now;
    this.nextAttackAt = this.time.now + 650;
    this.nextMandateAt = this.time.now + 2800;
    this.clearPhaseObjects();
    this.player.setPosition(640, 600);
    this.screenText.setText("COMFORT FIRST. CONTRADICTION NEVER.");
    this.phaseText.setText("PHASE 2: APATHY");
    this.objectiveText.setText("Hold E by citizens to awaken them. Fog slows you; bars punish straight paths.");
    this.warningText.setText("Wake citizens during gaps. Let go to dodge.");
    this.setBossBar(100, 0x6b7280);
    this.apathyCitizens = [
      this.makeBossCitizen(230, 270, "TENANT"),
      this.makeBossCitizen(430, 515, "STUDENT"),
      this.makeBossCitizen(640, 330, "WORKER"),
      this.makeBossCitizen(850, 515, "REPORTER"),
      this.makeBossCitizen(1050, 270, "CLERK")
    ];
    this.fogPatches = [
      this.makeFog(330, 390),
      this.makeFog(640, 505),
      this.makeFog(950, 390)
    ];
    this.showDialogue([
      "The Arbitrary Governor: Look at them.",
      "The Arbitrary Governor: A quiet people are an easy people."
    ]);
  }

  makeBossCitizen(x, y, label) {
    const sprite = this.add.sprite(x, y, "idle-down-0").setScale(1.55).setTint(0x6b7280).setDepth(55);
    const ring = this.add.circle(x, y + 8, 25, 0x6b7280, 0.08).setStrokeStyle(2, 0x6b7280, 0.4).setDepth(45);
    const text = this.add.text(x, y - 38, label, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "12px",
      color: "#b8b8c8",
      backgroundColor: "#05070d",
      padding: { x: 6, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(56);
    const citizen = { x, y, sprite, ring, text, awakened: false };
    this.phaseObjects.push(sprite, ring, text);
    return citizen;
  }

  makeFog(x, y) {
    const fog = this.add.circle(x, y, 72, 0x6b7280, 0.12).setDepth(30);
    fog.setStrokeStyle(2, 0xb8b8c8, 0.16);
    this.phaseObjects.push(fog);
    return fog;
  }

  updateApathyPhase() {
    if (this.time.now >= this.nextAttackAt) {
      const roll = Phaser.Math.Between(0, 2);
      if (roll === 0) {
        this.spawnApathyBar();
        this.time.delayedCall(260, () => this.spawnApathyBar());
      } else if (roll === 1) {
        this.spawnDriftProjectile();
        this.time.delayedCall(160, () => this.spawnDriftProjectile());
      } else {
        this.spawnApathyBar();
        this.spawnDriftProjectile();
      }
      this.nextAttackAt = this.time.now + Phaser.Math.Between(680, 980);
    }

    this.handleCitizenAwakening();
  }

  inFog() {
    if (!this.fogPatches) return false;
    return this.fogPatches.some(fog => Phaser.Math.Distance.Between(this.player.x, this.player.y, fog.x, fog.y) < fog.radius);
  }

  spawnApathyBar() {
    const y = Phaser.Math.Between(245, 570);
    const bar = this.add.rectangle(1340, y, 220, 22, 0x05070d, 0.9).setStrokeStyle(2, 0xb8b8c8, 0.8).setDepth(36);
    const text = this.add.text(1340, y, "WHY BOTHER", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "12px",
      color: "#b8b8c8",
      resolution: 2
    }).setOrigin(0.5).setDepth(37);
    this.hazards.push({ shape: bar, label: text, type: "rect", active: true, vx: -285, expires: this.time.now + 5600 });
    this.phaseObjects.push(bar, text);
  }

  spawnDriftProjectile() {
    const x = Phaser.Math.Between(180, 1100);
    const orb = this.add.circle(x, 160, 14, 0xb8b8c8, 0.6).setDepth(38);
    const angle = Phaser.Math.Angle.Between(x, 160, this.player.x, this.player.y);
    this.projectiles.push({ shape: orb, vx: Math.cos(angle) * 95, vy: Math.sin(angle) * 95 + 55, expires: this.time.now + 5000 });
    this.phaseObjects.push(orb);
  }

  handleCitizenAwakening() {
    let nearCitizen = null;
    for (const citizen of this.apathyCitizens) {
      if (!citizen.awakened && Phaser.Math.Distance.Between(this.player.x, this.player.y, citizen.x, citizen.y) < 76) {
        nearCitizen = citizen;
        break;
      }
    }

    if (!nearCitizen || !this.keyE.isDown) {
      if (this.channelingCitizen?.wakeBar) this.channelingCitizen.wakeBar.setVisible(false);
      this.channelingCitizen = null;
      return;
    }

    if (!nearCitizen.wakeBar) {
      nearCitizen.wakeBar = this.add.rectangle(nearCitizen.x - 34, nearCitizen.y + 44, 0, 7, 0xf1ca4f, 0.9).setOrigin(0, 0.5).setDepth(58);
      this.phaseObjects.push(nearCitizen.wakeBar);
    }

    if (this.channelingCitizen !== nearCitizen) {
      this.channelingCitizen = nearCitizen;
      this.channelStart = this.time.now;
      nearCitizen.wakeBar.setVisible(true);
      nearCitizen.wakeBar.width = 0;
    }

    const progress = Phaser.Math.Clamp((this.time.now - this.channelStart) / 760, 0, 1);
    nearCitizen.wakeBar.width = 68 * progress;
    if (progress >= 1) {
      nearCitizen.wakeBar.setVisible(false);
      this.awakenBossCitizen(nearCitizen);
      this.channelingCitizen = null;
    }
  }

  awakenBossCitizen(citizen) {
    citizen.awakened = true;
    citizen.sprite.clearTint();
    citizen.sprite.setTint(0xf1ca4f);
    citizen.ring.setStrokeStyle(3, 0xf1ca4f, 0.9);
    citizen.text.setText("AWAKE");
    citizen.text.setColor("#f1ca4f");
    this.citizensAwakened++;
    this.addCharge(16);
    this.apathyHP = Math.max(0, 100 - this.citizensAwakened * 20);
    this.setBossBar(this.apathyHP, 0x6b7280);
    this.objectiveText.setText(`Hold E to awaken citizens: ${this.citizensAwakened}/${this.requiredAwakened}`);
    this.addFloatingLabel(citizen.x, citizen.y - 70, "voice restored", 0xf1ca4f, 1200);
    this.cameras.main.shake(120, 0.004);

    if (this.citizensAwakened >= this.requiredAwakened) {
      this.showDialogue([
        "The Arbitrary Governor: You mistake noise for power.",
        "The Arbitrary Governor: Power is in the lines that contain them."
      ], () => this.startControlPhase());
    }
  }

  startControlPhase() {
    this.phase = "control";
    this.nodesFixed = 0;
    this.controlHP = 100;
    this.channelingNode = null;
    this.phaseStartedAt = this.time.now;
    this.nextAttackAt = this.time.now + 650;
    this.nextMandateAt = this.time.now + 2600;
    this.clearPhaseObjects();
    this.player.setPosition(640, 600);
    this.screenText.setText("DISTRICTS CONTAIN THE DISOBEDIENT");
    this.phaseText.setText("PHASE 3: CONTROL");
    this.objectiveText.setText("Hold E on nodes. Channel through beam patterns and shifting walls.");
    this.warningText.setText("Taking damage interrupts node repair.");
    this.setBossBar(100, 0x1ee7ff);
    this.nodes = [
      this.makeControlNode(255, 270, "SPEECH"),
      this.makeControlNode(1025, 270, "PRESS"),
      this.makeControlNode(255, 515, "ASSEMBLY"),
      this.makeControlNode(1025, 515, "VOTE")
    ];
    this.spawnGerryWalls();
    this.showDialogue([
      "The Arbitrary Governor: Lines are quieter than soldiers.",
      "The Arbitrary Governor: A map can silence millions without raising its voice."
    ]);
  }

  makeControlNode(x, y, label) {
    const pad = this.add.circle(x, y, 34, 0x1ee7ff, 0.1).setStrokeStyle(4, 0x1ee7ff, 0.8).setDepth(45);
    const text = this.add.text(x, y - 52, label, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "12px",
      color: "#bfefff",
      backgroundColor: "#05070d",
      padding: { x: 6, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(46);
    const fill = this.add.circle(x, y, 6, 0xf1ca4f, 0.75).setDepth(47);
    fill.setVisible(false);
    const node = { x, y, label, pad, text, fill, fixed: false };
    this.phaseObjects.push(pad, text, fill);
    return node;
  }

  spawnGerryWalls() {
    this.gerryWalls.forEach(wall => wall.destroy());
    this.gerryWalls = [];
    const pattern = Phaser.Math.Between(0, 2);
    const configs = [
      [[640, 390, 36, 300], [455, 390, 260, 30], [825, 390, 260, 30]],
      [[640, 280, 36, 220], [640, 505, 36, 220], [430, 390, 30, 240], [850, 390, 30, 240]],
      [[500, 335, 330, 30], [780, 445, 330, 30], [640, 390, 32, 210]]
    ][pattern];

    for (const [x, y, w, h] of configs) {
      const wall = this.add.rectangle(x, y, w, h, 0x1ee7ff, 0.12).setStrokeStyle(3, 0x1ee7ff, 0.52).setDepth(34);
      this.gerryWalls.push(wall);
      this.phaseObjects.push(wall);
    }
    this.addFloatingLabel(640, 182, "district walls shifted", 0xbfefff, 900);
  }

  updateControlPhase() {
    if (this.time.now >= this.nextAttackAt) {
      if (Phaser.Math.Between(0, 1) === 0) this.spawnControlBeam();
      else if (Phaser.Math.Between(0, 1) === 0) this.spawnGerryWalls();
      else this.spawnControlBeamCross();
      this.nextAttackAt = this.time.now + Phaser.Math.Between(620, 1020);
    }

    this.handleControlNodes();
  }

  handleControlNodes() {
    let nearNode = null;
    for (const node of this.nodes) {
      if (!node.fixed && Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y) < 58) {
        nearNode = node;
        break;
      }
    }

    if (!nearNode || !this.keyE.isDown) {
      this.channelingNode = null;
      return;
    }

    if (this.channelingNode !== nearNode) {
      this.channelingNode = nearNode;
      this.channelStart = this.time.now;
      nearNode.fill.setVisible(true);
      nearNode.fill.setScale(0.3);
    }

    const progress = Phaser.Math.Clamp((this.time.now - this.channelStart) / 1350, 0, 1);
    nearNode.fill.setScale(0.3 + progress * 2.2);
    if (progress >= 1) this.fixControlNode(nearNode);
  }

  fixControlNode(node) {
    node.fixed = true;
    node.pad.setStrokeStyle(5, 0xf1ca4f, 0.95);
    node.fill.setScale(2.5);
    node.text.setColor("#f1ca4f");
    this.channelingNode = null;
    this.nodesFixed++;
    this.addCharge(18);
    this.controlHP = Math.max(0, 100 - this.nodesFixed * 25);
    this.setBossBar(this.controlHP, 0x1ee7ff);
    this.objectiveText.setText(`Hold E to reconnect district nodes: ${this.nodesFixed}/${this.requiredNodes}`);
    this.cameras.main.shake(160, 0.005);
    this.addFloatingLabel(node.x, node.y - 74, "district reconnected", 0xf1ca4f, 1200);

    if (this.nodesFixed >= this.requiredNodes) {
      this.showDialogue([
        "The Arbitrary Governor: Enough.",
        "The Arbitrary Governor: If the people will not obey the system...",
        "The Arbitrary Governor: Then I will become the system."
      ], () => this.startSystemPhase());
    }
  }

  spawnControlBeam() {
    const vertical = Phaser.Math.Between(0, 1) === 0;
    const beam = this.add.rectangle(
      vertical ? Phaser.Math.Between(230, 1050) : 640,
      vertical ? 380 : Phaser.Math.Between(245, 580),
      vertical ? 28 : 980,
      vertical ? 430 : 28,
      0x1ee7ff,
      0.12
    ).setStrokeStyle(2, 0xbfefff, 0.8).setDepth(36);
    this.hazards.push({ shape: beam, type: "rect", active: false, expires: this.time.now + 1200 });
    this.phaseObjects.push(beam);
    this.tweens.add({ targets: beam, alpha: 0.48, duration: 260, yoyo: true, repeat: 1 });
    this.time.delayedCall(430, () => {
      const hazard = this.hazards.find(h => h.shape === beam);
      if (hazard) hazard.active = true;
      if (beam.active) beam.setFillStyle(0x1ee7ff, 0.32);
    });
  }

  spawnControlBeamCross() {
    this.spawnControlBeam();
    this.time.delayedCall(180, () => this.spawnControlBeam());
  }

  startSystemPhase() {
    this.phase = "system";
    this.systemHP = 100;
    this.phaseStartedAt = this.time.now;
    this.nextAttackAt = this.time.now + 420;
    this.nextMandateAt = this.time.now + 2100;
    this.clearPhaseObjects();
    this.player.setPosition(640, 600);
    this.governor.setVisible(false);
    this.screenFace = this.add.container(640, 175).setDepth(80);
    const face = this.add.rectangle(0, 0, 360, 100, 0x05070d, 0.98).setStrokeStyle(5, 0xff3b7a, 0.95);
    const leftEye = this.add.rectangle(-70, -8, 70, 16, 0xff3b7a, 0.9);
    const rightEye = this.add.rectangle(70, -8, 70, 16, 0xff3b7a, 0.9);
    const mouth = this.add.rectangle(0, 32, 150, 10, 0xf1ca4f, 0.85);
    this.screenFace.add([face, leftEye, rightEye, mouth]);
    this.phaseObjects.push(this.screenFace);
    this.screenText.setText("I AM PROCEDURE. I AM ORDER. I AM THE MAP.");
    this.phaseText.setText("PHASE 4: THE SYSTEM");
    this.objectiveText.setText("Use powers with timing: 1 breaks bars, 2 clears clones, 3 freezes and strikes.");
    this.warningText.setText("Wrong timing wastes cooldown. Survive until the system breaks.");
    this.setBossBar(100, 0xf1ca4f);
    this.createEdgeCitizens();
    this.showDialogue([
      "The Arbitrary Governor: You cannot remove me.",
      "The Arbitrary Governor: I am procedure. I am order. I am the map."
    ]);
  }

  createEdgeCitizens() {
    this.edgeCitizens = [];
    const spots = [[170, 175], [1110, 175], [150, 360], [1130, 360], [260, 625], [1020, 625]];
    for (const [x, y] of spots) {
      const citizen = this.add.sprite(x, y, "idle-down-0").setScale(1.3).setTint(0xf1ca4f).setDepth(50);
      this.edgeCitizens.push(citizen);
      this.phaseObjects.push(citizen);
    }
  }

  updateSystemPhase() {
    if (this.time.now >= this.nextAttackAt) {
      const roll = Phaser.Math.Between(0, 3);
      if (roll === 0) {
        this.spawnSystemCensor();
        this.time.delayedCall(160, () => this.spawnSystemCensor());
      } else if (roll === 1) {
        this.spawnClone();
        this.spawnClone();
      } else if (roll === 2) {
        this.spawnFearPulseAtPlayer();
        this.time.delayedCall(220, () => this.spawnFearPulseAtPlayer());
      } else {
        this.spawnSystemWall();
        this.spawnSystemCensor();
      }
      this.nextAttackAt = this.time.now + Phaser.Math.Between(390, 720);
    }

    this.handleSystemPowers();

    if (this.systemHP <= 1) this.beginFinalVote();
  }

  handleSystemPowers() {
    if (Phaser.Input.Keyboard.JustDown(this.keyOne)) this.usePower("speech");
    if (Phaser.Input.Keyboard.JustDown(this.keyTwo)) this.usePower("press");
    if (Phaser.Input.Keyboard.JustDown(this.keyThree)) this.usePower("minds");
  }

  usePower(power) {
    if (this.time.now < this.powerCooldowns[power]) {
      this.addFloatingLabel(this.player.x, this.player.y - 55, "cooldown", 0xb8b8c8, 700);
      return;
    }

    if (power === "speech") {
      const nearBars = this.hazards.filter(h => h.shape && Phaser.Math.Distance.Between(this.player.x, this.player.y, h.shape.x, h.shape.y) < 230);
      if (nearBars.length === 0) {
        this.addFloatingLabel(this.player.x, this.player.y - 55, "no censor nearby", 0xff9bb8, 800);
        this.powerCooldowns[power] = this.time.now + 1100;
        return;
      }
      this.powerCooldowns[power] = this.time.now + 3200;
      this.hazards.forEach(h => {
        if (h.shape && Phaser.Math.Distance.Between(this.player.x, this.player.y, h.shape.x, h.shape.y) < 210) h.expires = 0;
      });
      this.damageSystem(8, "free speech breaks the censor");
    } else if (power === "press") {
      if (this.clones.length === 0) {
        this.addFloatingLabel(this.player.x, this.player.y - 55, "no false feed exposed", 0xff9bb8, 800);
        this.powerCooldowns[power] = this.time.now + 1100;
        return;
      }
      this.powerCooldowns[power] = this.time.now + 3200;
      this.clones.forEach(clone => clone.expires = 0);
      this.damageSystem(9, "free press exposes the false feed");
    } else {
      this.powerCooldowns[power] = this.time.now + 3200;
      this.freezeCensorsUntil = this.time.now + 1500;
      this.fireCitizenBeams();
      this.damageSystem(11, "free minds answer together");
    }
  }

  damageSystem(amount, label) {
    this.systemHP = Math.max(1, this.systemHP - amount);
    this.setBossBar(this.systemHP, 0xf1ca4f);
    this.objectiveText.setText(`Break the system with timed powers. Integrity ${this.systemHP}/100`);
    this.addFloatingLabel(640, 240, label, 0xf1ca4f, 1000);
    this.cameras.main.shake(140, 0.005);
    this.addCharge(8);
  }

  fireCitizenBeams() {
    if (!this.edgeCitizens || !this.screenFace) return;
    for (const citizen of this.edgeCitizens) {
      const beam = this.add.line(0, 0, citizen.x, citizen.y, 640, 175, 0xf1ca4f, 0.52).setOrigin(0).setDepth(49);
      this.phaseObjects.push(beam);
      this.tweens.add({ targets: beam, alpha: 0, duration: 500, onComplete: () => beam.destroy() });
    }
  }

  spawnSystemCensor() {
    const y = Phaser.Math.Between(245, 600);
    const bar = this.add.rectangle(-130, y, 250, 28, 0x05070d, 0.95).setStrokeStyle(3, 0xff3b7a, 0.9).setDepth(38);
    const text = this.add.text(-130, y, "CENSOR", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#ff9bb8",
      resolution: 2
    }).setOrigin(0.5).setDepth(39);
    this.hazards.push({ shape: bar, label: text, type: "rect", active: true, vx: 430, expires: this.time.now + 4000 });
    this.phaseObjects.push(bar, text);
  }

  spawnClone() {
    const x = Phaser.Math.Between(160, 1120);
    const clone = this.add.sprite(x, 165, "idle-down-0").setScale(1.35).setTint(0xff3b7a).setDepth(55);
    this.clones.push({ sprite: clone, speed: 128, expires: this.time.now + 5200 });
    this.phaseObjects.push(clone);
  }

  spawnFearPulseAtPlayer() {
    this.spawnStrike(this.player.x, this.player.y);
  }

  spawnSystemWall() {
    const wall = this.add.rectangle(Phaser.Math.Between(280, 1000), Phaser.Math.Between(315, 535), Phaser.Math.Between(190, 330), 24, 0xf1ca4f, 0.16).setStrokeStyle(2, 0xf1ca4f, 0.55).setDepth(34);
    this.hazards.push({ shape: wall, type: "rect", active: true, expires: this.time.now + 1700 });
    this.phaseObjects.push(wall);
  }

  beginFinalVote() {
    if (this.phase === "finalVote") return;
    this.phase = "finalVote";
    this.clearHazardsOnly();
    this.player.setVelocity(0);
    this.phaseText.setText("FINAL: SOVEREIGNTY");
    this.objectiveText.setText("The final vote begins.");
    this.showDialogue([
      "The Arbitrary Governor: You cannot remove me.",
      "The Arbitrary Governor: I am the system.",
      "Citizen: We are the map. We are the voice. We are the sovereign."
    ], () => {
      this.voteCount = 0;
      this.voteText = this.add.text(640, 360, "VOTES CAST: 0 / 100", {
        fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
        fontSize: "34px",
        color: "#f1ca4f",
        backgroundColor: "#05070d",
        padding: { x: 18, y: 10 },
        resolution: 2
      }).setOrigin(0.5).setDepth(320);
    });
  }

  updateFinalVote() {
    this.player.setVelocity(0);
    if (!this.voteText) return;
    this.voteCount = Math.min(100, this.voteCount + 0.65);
    this.voteText.setText(`VOTES CAST: ${Math.floor(this.voteCount)} / 100`);
    this.setBossBar(Math.max(0, 100 - this.voteCount), 0xf1ca4f);
    if (this.voteCount >= 100 && !this.victoryStarted) {
      this.victoryStarted = true;
      this.cameras.main.flash(900, 241, 202, 79);
      this.cameras.main.shake(650, 0.012);
      this.showDialogue([
        "The Arbitrary Governor: No... no, no, no. You WON?",
        "The Arbitrary Governor: I had every line, every feed, every locked door.",
        "The Arbitrary Governor: And still the people chose to speak.",
        "Citizen: The Revolution did not end. It came due.",
        "Bystander: Sovereignty restored."
      ], () => {
        this.objectiveText.setText("Governor defeated. Freedom requires maintenance.");
        this.phaseText.setText("VICTORY");
        this.screenText.setText("DO NOT BE A BYSTANDER");
        this.endBossFight();
      });
    }
  }

  endBossFight() {
    this.transitioning = true;
    this.clearHazardsOnly();
    this.clearMandate();
    this.setBossBar(0, 0xf1ca4f);

    const burst = this.add.circle(640, 360, 22, 0xf1ca4f, 0.18).setStrokeStyle(8, 0xf1ca4f, 0.9).setDepth(350);
    this.tweens.add({ targets: burst, radius: 620, alpha: 0, duration: 1400, ease: "Sine.easeOut" });
    this.tweens.add({
      targets: this.governor,
      alpha: 0,
      angle: 8,
      y: 150,
      duration: 1200,
      ease: "Sine.easeIn"
    });

    this.time.delayedCall(1700, () => {
      this.cameras.main.fadeOut(1200, 5, 7, 13);
    });
    this.time.delayedCall(3000, () => {
      this.scene.start("EndingScene");
    });
  }

  updateHazards() {
    const frozen = this.time.now < this.freezeCensorsUntil;

    for (const hazard of this.hazards) {
      if (!hazard.shape || !hazard.shape.active) continue;
      if (hazard.vx && !frozen) {
        hazard.shape.x += hazard.vx * this.game.loop.delta / 1000;
        if (hazard.label) hazard.label.x = hazard.shape.x;
      }
      if (hazard.vy && !frozen) hazard.shape.y += hazard.vy * this.game.loop.delta / 1000;

      if (hazard.active && this.hazardHitsPlayer(hazard)) this.damagePlayer();
      if (this.time.now > hazard.expires) this.expireHazard(hazard);
    }

    for (const projectile of this.projectiles) {
      if (!projectile.shape || !projectile.shape.active) continue;
      projectile.shape.x += projectile.vx * this.game.loop.delta / 1000;
      projectile.shape.y += projectile.vy * this.game.loop.delta / 1000;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, projectile.shape.x, projectile.shape.y) < 28) this.damagePlayer();
      if (this.time.now > projectile.expires) this.expireProjectile(projectile);
    }

    for (const clone of this.clones) {
      if (!clone.sprite || !clone.sprite.active) continue;
      const angle = Phaser.Math.Angle.Between(clone.sprite.x, clone.sprite.y, this.player.x, this.player.y);
      clone.sprite.x += Math.cos(angle) * clone.speed * this.game.loop.delta / 1000;
      clone.sprite.y += Math.sin(angle) * clone.speed * this.game.loop.delta / 1000;
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, clone.sprite.x, clone.sprite.y) < 34) this.damagePlayer();
      if (this.time.now > clone.expires) this.expireClone(clone);
    }

    for (const wall of this.gerryWalls) {
      if (wall.active && this.pointInRect(this.player.x, this.player.y, wall)) {
        this.player.x += this.player.x < wall.x ? -4 : 4;
        this.player.y += this.player.y < wall.y ? -4 : 4;
      }
    }
  }

  hazardHitsPlayer(hazard) {
    if (hazard.type === "circle") {
      return Phaser.Math.Distance.Between(this.player.x, this.player.y, hazard.x, hazard.y) < hazard.radius;
    }
    return this.pointInRect(this.player.x, this.player.y, hazard.shape);
  }

  damagePlayer() {
    if (this.invulnerable || this.transitioning || this.dialogueActive || this.phase === "finalVote") return;

    this.playerHP--;
    this.channelingNode = null;
    this.channelingTower = null;
    this.channelingCitizen = null;
    this.updateHealthUI();
    this.invulnerable = true;
    this.player.setTint(0xff9bb8);
    this.cameras.main.shake(220, 0.01);
    this.cameras.main.flash(120, 255, 60, 110);

    this.time.delayedCall(850, () => {
      this.invulnerable = false;
      if (this.player?.active) this.player.clearTint();
    });

    if (this.playerHP <= 0) this.restartBossPhase();
  }

  restartBossPhase() {
    this.defeated = true;
    this.clearHazardsOnly();
    this.clearMandate();
    this.player.setVelocity(0);
    this.player.setTint(0x6b7280);
    this.cameras.main.shake(600, 0.014);
    this.cameras.main.flash(300, 255, 60, 110);

    this.defeatBox = this.add.rectangle(640, 360, 760, 240, 0x05070d, 0.98).setStrokeStyle(6, 0xff3b7a, 0.95).setDepth(600);
    this.defeatText = this.add.text(640, 310, "The Arbitrary Governor: Back for more obedience?", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "24px",
      color: "#ff9bb8",
      align: "center",
      wordWrap: { width: 690 },
      resolution: 2
    }).setOrigin(0.5).setDepth(601);
    this.retryText = this.add.text(640, 395, "Press R or E to try again", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "22px",
      color: "#f1ca4f",
      resolution: 2
    }).setOrigin(0.5).setDepth(601);
    this.tweens.add({ targets: this.retryText, alpha: 0.35, duration: 520, yoyo: true, repeat: -1 });
  }

  retryBoss() {
    if (this.defeatBox) this.defeatBox.destroy();
    if (this.defeatText) this.defeatText.destroy();
    if (this.retryText) this.retryText.destroy();
    this.defeated = false;
    this.transitioning = false;
    this.dialogueActive = false;
    this.invulnerable = false;
    this.playerHP = this.maxHP;
    this.updateHealthUI();
    this.player.clearTint();
    this.player.setPosition(640, 600);
    this.clearHazardsOnly();
    this.sovereigntyCharge = 0;
    this.updateKeyText();
    this.addFloatingLabel(640, 565, "voice restored", 0xbfefff, 1200);

    if (this.phase === "fear") this.resumeFearPhase();
    else if (this.phase === "apathy") this.resumeApathyPhase();
    else if (this.phase === "control") this.resumeControlPhase();
    else if (this.phase === "system") this.resumeSystemPhase();
    else this.startFearPhase();
  }

  resumeFearPhase() {
    const destroyed = this.towersDestroyed;
    const hp = this.fearHP;
    this.startFearPhase();
    this.towersDestroyed = destroyed;
    this.fearHP = hp;
    this.setBossBar(this.fearHP, 0xff3b7a);
    this.objectiveText.setText(`Hold E to expose towers: ${this.towersDestroyed}/${this.requiredTowers}`);
  }

  resumeApathyPhase() {
    const awakened = this.citizensAwakened;
    const hp = this.apathyHP;
    this.startApathyPhase();
    this.citizensAwakened = awakened;
    this.apathyHP = hp;
    this.setBossBar(this.apathyHP, 0x6b7280);
    this.objectiveText.setText(`Hold E to awaken citizens: ${this.citizensAwakened}/${this.requiredAwakened}`);
  }

  resumeControlPhase() {
    const fixed = this.nodesFixed;
    const hp = this.controlHP;
    this.startControlPhase();
    this.nodesFixed = fixed;
    this.controlHP = hp;
    this.setBossBar(this.controlHP, 0x1ee7ff);
    this.objectiveText.setText(`Hold E to reconnect district nodes: ${this.nodesFixed}/${this.requiredNodes}`);
  }

  resumeSystemPhase() {
    const hp = this.systemHP;
    this.startSystemPhase();
    this.systemHP = hp;
    this.setBossBar(this.systemHP, 0xf1ca4f);
    this.objectiveText.setText(`Break the system with timed powers. Integrity ${this.systemHP}/100`);
  }

  setBossBar(value, color) {
    this.bossBar.setFillStyle(color, 0.95);
    this.bossBar.setDisplaySize(414 * Phaser.Math.Clamp(value / 100, 0, 1), 10);
  }

  updateHealthUI() {
    this.hpText.setText(`VOICE ${this.playerHP}/${this.maxHP}`);
    if (!this.voicePips) return;
    this.voicePips.forEach((pip, index) => {
      const alive = index < this.playerHP;
      pip.setFillStyle(alive ? 0xf1ca4f : 0x111827, alive ? 0.95 : 0.45);
      pip.setStrokeStyle(2, alive ? 0xffffff : 0x6b7280, 0.65);
    });
  }

  clearPhaseObjects() {
    this.clearMandate();
    this.clearHazardsOnly();
    for (const object of this.phaseObjects) {
      if (object && object.destroy) object.destroy();
    }
    this.phaseObjects = [];
    this.towers = [];
    this.apathyCitizens = [];
    this.fogPatches = [];
    this.nodes = [];
    this.gerryWalls = [];
  }

  clearHazardsOnly() {
    for (const hazard of this.hazards) {
      if (hazard.shape?.destroy) hazard.shape.destroy();
      if (hazard.label?.destroy) hazard.label.destroy();
    }
    for (const projectile of this.projectiles) {
      if (projectile.shape?.destroy) projectile.shape.destroy();
    }
    for (const clone of this.clones) {
      if (clone.sprite?.destroy) clone.sprite.destroy();
    }
    this.hazards = [];
    this.projectiles = [];
    this.clones = [];
  }

  expireHazard(hazard) {
    if (hazard.shape?.destroy) hazard.shape.destroy();
    if (hazard.label?.destroy) hazard.label.destroy();
    hazard.expires = 0;
  }

  expireProjectile(projectile) {
    if (projectile.shape?.destroy) projectile.shape.destroy();
    projectile.expires = 0;
  }

  expireClone(clone) {
    if (clone.sprite?.destroy) clone.sprite.destroy();
    clone.expires = 0;
  }

  cleanupDeadObjects() {
    this.hazards = this.hazards.filter(h => h.shape?.active && this.time.now <= h.expires + 50);
    this.projectiles = this.projectiles.filter(p => p.shape?.active && this.time.now <= p.expires + 50);
    this.clones = this.clones.filter(c => c.sprite?.active && this.time.now <= c.expires + 50);
  }

  pointInRect(x, y, rect) {
    return x > rect.x - rect.width / 2 && x < rect.x + rect.width / 2 && y > rect.y - rect.height / 2 && y < rect.y + rect.height / 2;
  }

  addFloatingLabel(x, y, text, color, duration) {
    const label = this.add.text(x, y, text, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: `#${color.toString(16).padStart(6, "0")}`,
      backgroundColor: "#05070d",
      padding: { x: 8, y: 5 },
      resolution: 2
    }).setOrigin(0.5).setDepth(310);

    this.tweens.add({ targets: label, y: y - 26, alpha: 0, duration, onComplete: () => label.destroy() });
  }

  showDialogue(lines, onDone = null) {
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueOnDone = onDone;
    this.dialogueActive = true;
    this.lineFinished = false;
    this.clearDialogueObjects();

    this.dialogueBox = this.add.rectangle(640, 560, 900, 132, 0x05070d, 0.96).setStrokeStyle(5, 0xf1ca4f, 0.9).setDepth(400);
    this.dialogueText = this.add.text(220, 520, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      lineSpacing: 6,
      wordWrap: { width: 835 },
      resolution: 2
    }).setDepth(401);
    this.continueText = this.add.text(1058, 606, "E", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#111111",
      backgroundColor: "#f1ca4f",
      padding: { x: 7, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(402);
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
      delay: 15,
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
