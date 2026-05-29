class ModernCityScene extends Phaser.Scene {
  constructor() {
    super("ModernCityScene");
  }

  preload() {
    this.load.image("futureCityMap", "assets/future_city/futurecity.png");

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
    this.WORLD_W = 1516;
    this.WORLD_H = 1038;
    this.facing = "up";
    this.playerLocked = false;
    this.dialogueActive = false;
    this.choiceActive = false;
    this.channeling = false;
    this.transitioning = false;
    this.canDash = true;
    this.spottedCooldown = false;
    this.threatsEnabled = false;

    this.awakenedCitizens = 0;
    this.requiredCitizens = 5;
    this.evidenceFound = 0;
    this.requiredEvidence = 5;
    this.actionsComplete = 0;
    this.requiredActions = 3;
    this.evidence = {};
    this.mapRoomUnlocked = false;
    this.safePoint = new Phaser.Math.Vector2(758, 520);

    this.nearCitizen = null;
    this.nearEvidence = null;
    this.nearAction = null;
    this.nearGuide = false;
    this.nearMapGate = false;
    this.choiceCitizen = null;
    this.physics.world.setBounds(0, 0, this.WORLD_W, this.WORLD_H);

    this.createPlayerAnimations();
    this.createWorld();
    this.createPlayer();
    this.createGuide();
    this.createWalls();
    this.createEvidenceNodes();
    this.createResistanceActions();
    this.createCitizens();
    this.createThreats();
    this.createMapGate();
    this.createInput();
    this.createCamera();
    this.createHUD();
    this.createUICamera();
    this.createArrival();

    this.physics.add.collider(this.player, this.walls);

    this.time.delayedCall(50, () => {
      this.playerLocked = false;
      this.dialogueActive = false;
      this.choiceActive = false;
      this.channeling = false;
      this.transitioning = false;
      this.player.setPosition(this.safePoint.x, this.safePoint.y);
      this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
      this.cameras.main.centerOn(this.player.x, this.player.y);
    });

    this.time.delayedCall(1800, () => {
      this.threatsEnabled = true;
    });
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#030712");
    this.add.image(0, 0, "futureCityMap").setOrigin(0, 0).setDepth(0);

    this.mapRoomHalo = this.add.circle(758, 184, 72, 0x1ee7ff, 0.025).setDepth(6);
    this.mapRoomHalo.setStrokeStyle(2, 0xf1ca4f, 0.24);
    this.tweens.add({
      targets: this.mapRoomHalo,
      alpha: 0.1,
      scale: 1.08,
      duration: 1100,
      yoyo: true,
      repeat: -1
    });

    this.add.text(758, 44, "MAP ROOM", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "17px",
      color: "#f1ca4f",
      backgroundColor: "#05070d",
      padding: { x: 10, y: 5 },
      resolution: 2
    }).setOrigin(0.5).setDepth(70);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(this.safePoint.x, this.safePoint.y, "idle-up-0");
    this.player.setScale(1.7);
    this.player.setTint(0xffffff);
    this.player.play("idle-up");
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(12, 8);
    this.player.body.setOffset(2, 10);
    this.player.setDepth(95);

    this.playerLocator = this.add.circle(this.player.x, this.player.y - 21, 10, 0xf1ca4f, 0.72).setDepth(130);
    this.tweens.add({
      targets: this.playerLocator,
      alpha: 0.2,
      scale: 1.35,
      duration: 520,
      yoyo: true,
      repeat: -1
    });
  }

  createGuide() {
    this.guide = this.physics.add.staticSprite(1185, 985, "idle-left-0");
    this.guide.setScale(1.3);
    this.guide.setTint(0xf1ca4f);
    this.guide.setDepth(90);

    this.guideLabel = this.add.text(1185, 950, "RUNAWAY\nCLERK", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "12px",
      color: "#f1ca4f",
      align: "center",
      backgroundColor: "#211309",
      padding: { x: 7, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setDepth(120);
  }

  createWalls() {
    this.walls = this.physics.add.staticGroup();

    this.makeWall(758, 133, 536, 246);    // castle/map room
    this.makeWall(230, 430, 390, 230);    // upper-left block
    this.makeWall(600, 430, 150, 230);    // upper-middle west block
    this.makeWall(910, 430, 150, 230);    // upper-middle east block
    this.makeWall(1265, 430, 410, 230);   // upper-right block
    this.makeWall(230, 800, 390, 245);    // lower-left block
    this.makeWall(758, 800, 315, 245);    // lower-center block
    this.makeWall(1265, 800, 410, 245);   // lower-right block

    this.makeWall(18, 519, 36, 1028);
    this.makeWall(1498, 519, 36, 1028);
    this.makeWall(758, 14, 1516, 28);
    this.makeWall(758, 1022, 1516, 32);
  }

  makeWall(x, y, width, height) {
    const wall = this.add.rectangle(x, y, width, height, 0xff0000, 0);
    this.physics.add.existing(wall, true);
    this.walls.add(wall);
  }

  createEvidenceNodes() {
    this.evidenceNodes = [
      this.makeEvidence(506, 610, "freeSpeech", "CENSORSHIP ORDER", [
        "Leaked order: Public language filters now require Governor approval.",
        "Flagged words: protest, district, assembly, representation.",
        "Free speech did not disappear. It was hidden behind permissions."
      ]),
      this.makeEvidence(758, 985, "districtSplit", "BROKEN DISTRICT MAP", [
        "District file opened: neighborhoods split across unrelated sectors.",
        "The Governor says the lines are efficient. The numbers say they dilute opposition.",
        "The vote was not silenced. It was rearranged."
      ]),
      this.makeEvidence(1010, 610, "freePress", "PRESS BLACKLIST", [
        "Independent publishers still exist, but every civic feed buries them.",
        "The Governor calls it anti-panic moderation.",
        "The free press is alive. The city just cannot see it."
      ]),
      this.makeEvidence(402, 985, "algorithmFeed", "FEED ALGORITHM", [
        "Citizen feed rule: Show comfort first. Show contradiction never.",
        "Outrage is routed. Apathy is recommended.",
        "The city is not sleeping by accident."
      ]),
      this.makeEvidence(1120, 985, "sovereignty", "SOVEREIGNTY AUDIT", [
        "Civic audit: emergency powers never expired.",
        "Every locked route traces back to the castle map room.",
        "Repair the map, and the city can remember who owns itself."
      ])
    ];
  }

  makeEvidence(x, y, key, title, lines) {
    const base = this.add.rectangle(x, y, 42, 30, 0x1ee7ff, 0.12).setDepth(44);
    base.setStrokeStyle(3, 0x1ee7ff, 0.82);

    const core = this.add.rectangle(x, y, 22, 14, 0xbfefff, 0.6).setDepth(45);
    const label = this.add.text(x, y - 36, title, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "11px",
      color: "#bfefff",
      backgroundColor: "#05070d",
      padding: { x: 6, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(125);

    this.tweens.add({ targets: base, alpha: 0.28, duration: 850, yoyo: true, repeat: -1 });
    return { x, y, key, title, lines, base, core, label, collected: false };
  }

  createResistanceActions() {
    this.actions = [
      this.makeAction(1018, 985, "signal", "HACK RELAY", "Hold the street relay open long enough for banned feeds to leak through."),
      this.makeAction(230, 610, "poster", "TEAR POSTERS", "Rip down the Governor notice before the cameras sweep back."),
      this.makeAction(1310, 610, "jammer", "JAM SCANNER", "Jam a checkpoint scanner and open a safer route for citizens.")
    ];
  }

  makeAction(x, y, type, title, successLine) {
    const color = type === "signal" ? 0x1ee7ff : type === "poster" ? 0xf1ca4f : 0xff3b7a;
    const ring = this.add.circle(x, y, 24, color, 0.08).setDepth(36);
    ring.setStrokeStyle(3, color, 0.75);
    const label = this.add.text(x, y - 39, title, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "12px",
      color: "#ffffff",
      backgroundColor: "#05070d",
      padding: { x: 7, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setDepth(126);

    return { x, y, type, title, successLine, ring, label, complete: false };
  }

  createCitizens() {
    this.citizens = [
      this.makeCitizen(340, 610, "Tenant", "freeSpeech", "Citizen: The Governor says banned words prevent unrest.", "Show the censorship order.", "Tell them quiet is peace.", "Citizen: Those are not safety rules. Those are shackles."),
      this.makeCitizen(650, 610, "Neighbor", "districtSplit", "Citizen: My block votes downtown now. My sister across the road votes elsewhere.", "Show the broken district map.", "Say voting is symbolic.", "Citizen: They divided us so none of us could answer."),
      this.makeCitizen(1175, 610, "Reporter", "freePress", "Citizen: My paper still exists. Nobody can find it, but it exists.", "Show the press blacklist.", "Share another official feed.", "Citizen: They did not beat the press. They buried it."),
      this.makeCitizen(620, 985, "Student", "algorithmFeed", "Citizen: My feed says everyone agrees. It is easier that way.", "Show the feed algorithm.", "Agree that comfort is truth.", "Citizen: It was choosing silence for me."),
      this.makeCitizen(1310, 985, "Clerk", "sovereignty", "Citizen: Emergency rule was temporary. I think. I stopped checking.", "Show the sovereignty audit.", "Say procedure is enough.", "Citizen: Procedure without consent is just a cage with paperwork.")
    ];
  }

  makeCitizen(x, y, name, evidenceKey, clue, right, wrong, awakened) {
    const sprite = this.physics.add.sprite(x, y, "idle-down-0");
    sprite.setScale(1.25);
    sprite.setTint(0x6b7280);
    sprite.setDepth(86);
    sprite.body.setSize(12, 8);
    sprite.body.setOffset(2, 10);

    const ring = this.add.circle(x, y + 5, 18, 0x6b7280, 0.08).setDepth(35);
    ring.setStrokeStyle(2, 0x6b7280, 0.35);
    const tag = this.add.text(x, y - 27, name.toUpperCase(), {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "11px",
      color: "#b8b8c8",
      backgroundColor: "#111827",
      padding: { x: 6, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setDepth(126);

    return { x, y, name, evidenceKey, clue, right, wrong, awakened, sprite, ring, tag, awakenedDone: false };
  }

  createThreats() {
    this.scanners = [
      this.makeScanner(495, 545, 495, 760, 0x1ee7ff),
      this.makeScanner(1030, 545, 1030, 760, 0xff3b7a),
      this.makeScanner(840, 706, 1290, 706, 0xff3b7a),
      this.makeScanner(845, 930, 1210, 930, 0x1ee7ff)
    ];

    this.securityCameras = [
      this.makeCamera(480, 285, 0),
      this.makeCamera(1035, 285, Math.PI),
      this.makeCamera(480, 770, -0.3),
      this.makeCamera(1035, 770, Math.PI + 0.3)
    ];
  }

  makeScanner(x1, y1, x2, y2, color) {
    const horizontal = Math.abs(x2 - x1) > Math.abs(y2 - y1);
    const beam = this.add.rectangle(x1, y1, horizontal ? 86 : 30, horizontal ? 22 : 78, color, 0.1).setDepth(32);
    beam.setStrokeStyle(2, color, 0.46);
    return { beam, color, start: new Phaser.Math.Vector2(x1, y1), end: new Phaser.Math.Vector2(x2, y2), t: 0, dir: 1, speed: 0.0027, disabled: false };
  }

  makeCamera(x, y, angle) {
    const base = this.add.circle(x, y, 11, 0xff3b7a, 0.5).setDepth(42);
    const cone = this.add.triangle(x, y, 0, -12, 118, 0, 0, 12, 0xff3b7a, 0.12).setDepth(33);
    cone.setStrokeStyle(2, 0xff3b7a, 0.42);
    cone.rotation = angle;
    return { base, cone, angle, sweep: 0, dir: 1 };
  }

  createMapGate() {
    this.gate = this.add.rectangle(758, 275, 122, 42, 0x1ee7ff, 0.035).setDepth(60);
    this.gate.setStrokeStyle(2, 0x1ee7ff, 0.45);
    this.gateBars = [];

    for (let i = 0; i < 6; i++) {
      this.gateBars.push(this.add.rectangle(710 + i * 20, 275, 7, 42, 0xff3b7a, 0.45).setDepth(61));
    }

    this.gateText = this.add.text(758, 312, "MAP ROOM SEALED", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "11px",
      color: "#bfefff",
      backgroundColor: "#05070d",
      padding: { x: 9, y: 4 },
      resolution: 2
    }).setOrigin(0.5).setDepth(126);
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
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.WORLD_W, this.WORLD_H);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.16);
  }

  createHUD() {
    this.uiObjects = [];

    this.objectiveText = this.trackUI(this.add.text(640, 28, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      backgroundColor: "#111827",
      padding: { x: 14, y: 7 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000));

    this.promptText = this.trackUI(this.add.text(640, 66, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#f4e7c5",
      backgroundColor: "#211309",
      padding: { x: 12, y: 6 },
      wordWrap: { width: 900 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000).setVisible(false));

    this.resistanceText = this.trackUI(this.add.text(1138, 28, "RESISTANCE 0/5", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#f1ca4f",
      backgroundColor: "#111827",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000));

    this.evidenceText = this.trackUI(this.add.text(1138, 62, "EVIDENCE 0/5", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#bfefff",
      backgroundColor: "#111827",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000));

    this.actionText = this.trackUI(this.add.text(1138, 96, "ACTIONS 0/3", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: "#ff9bb8",
      backgroundColor: "#111827",
      padding: { x: 10, y: 6 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000));

    this.statusText = this.trackUI(this.add.text(28, 28, "FUTURE CITY", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "14px",
      color: "#b8b8c8",
      backgroundColor: "#111827",
      padding: { x: 10, y: 5 },
      resolution: 2
    }).setScrollFactor(0).setDepth(1000));

  }

  trackUI(object) {
    if (!this.uiObjects) this.uiObjects = [];
    this.uiObjects.push(object);
    this.cameras.main.ignore(object);
    return object;
  }

  ignoreForUICamera(object) {
    if (this.uiCamera && object) this.uiCamera.ignore(object);
    return object;
  }

  createUICamera() {
    this.uiCamera = this.cameras.add(0, 0, 1280, 720);
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setZoom(1);
    this.uiCamera.setBackgroundColor("rgba(0,0,0,0)");
    this.uiCamera.ignore(this.children.list.filter(child => !this.uiObjects.includes(child)));
    this.cameras.main.ignore(this.uiObjects);
  }

  createArrival() {
    this.playerLocked = false;
    this.dialogueActive = false;
    this.cameras.main.flash(450, 80, 190, 255);
    this.cameras.main.shake(180, 0.006);
    this.setObjective("Collect evidence. Build resistance. Reach the castle.");
    this.showPrompt("The castle holds the Governor's map room. Ask the Runaway Clerk for context.");
    this.showFloatingText(this.player.x, this.player.y - 70, "The city opens. The castle is north.", 0xbfefff);
    this.time.delayedCall(500, () => {
      this.playerLocked = false;
      this.dialogueActive = false;
      this.choiceActive = false;
    });
  }

  update() {
    this.nearCitizen = null;
    this.nearEvidence = null;
    this.nearAction = null;
    this.nearGuide = false;
    this.nearMapGate = false;

    if (this.transitioning) {
      this.player.setVelocity(0);
      return;
    }

    if (this.choiceActive) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyOne)) this.resolveCitizenChoice(1);
      if (Phaser.Input.Keyboard.JustDown(this.keyTwo)) this.resolveCitizenChoice(2);
      return;
    }

    if (this.dialogueActive) {
      this.player.setVelocity(0);
      if (Phaser.Input.Keyboard.JustDown(this.keyE) || Phaser.Input.Keyboard.JustDown(this.keySpace)) this.advanceDialogue();
      return;
    }

    if (this.channeling || this.playerLocked) {
      this.player.setVelocity(0);
      return;
    }

    this.handleMovement();
    this.updatePlayerLocator();
    this.updateThreats();
    if (this.threatsEnabled) this.checkThreats();
    this.updateProximity();
    this.handleInteraction();
    this.updatePrompt();
  }

  updateThreats() {
    for (const scanner of this.scanners) {
      if (scanner.disabled) continue;
      scanner.t += scanner.speed * scanner.dir;
      if (scanner.t >= 1) {
        scanner.t = 1;
        scanner.dir = -1;
      } else if (scanner.t <= 0) {
        scanner.t = 0;
        scanner.dir = 1;
      }
      scanner.beam.x = Phaser.Math.Linear(scanner.start.x, scanner.end.x, scanner.t);
      scanner.beam.y = Phaser.Math.Linear(scanner.start.y, scanner.end.y, scanner.t);
    }

    for (const camera of this.securityCameras) {
      camera.sweep += 0.012 * camera.dir;
      if (camera.sweep > 0.55 || camera.sweep < -0.55) camera.dir *= -1;
      camera.cone.rotation = camera.angle + camera.sweep;
    }
  }

  updateProximity() {
    this.nearGuide = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.guide.x, this.guide.y) < 82;

    for (const node of this.evidenceNodes) {
      if (!node.collected && Phaser.Math.Distance.Between(this.player.x, this.player.y, node.x, node.y) < 72) {
        this.nearEvidence = node;
        break;
      }
    }

    for (const action of this.actions) {
      if (!action.complete && Phaser.Math.Distance.Between(this.player.x, this.player.y, action.x, action.y) < 76) {
        this.nearAction = action;
        break;
      }
    }

    for (const citizen of this.citizens) {
      if (!citizen.awakenedDone && Phaser.Math.Distance.Between(this.player.x, this.player.y, citizen.x, citizen.y) < 72) {
        this.nearCitizen = citizen;
        break;
      }
    }

    this.nearMapGate = this.mapRoomUnlocked && Phaser.Math.Distance.Between(this.player.x, this.player.y, 758, 292) < 95;
  }

  checkThreats() {
    if (this.spottedCooldown) return;

    for (const scanner of this.scanners) {
      if (scanner.disabled) continue;
      if (this.pointInRect(this.player.x, this.player.y, scanner.beam)) {
        this.onSpotted("SCAN LOCK");
        return;
      }
    }

    for (const camera of this.securityCameras) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, camera.base.x, camera.base.y);
      const angleToPlayer = Phaser.Math.Angle.Between(camera.base.x, camera.base.y, this.player.x, this.player.y);
      const rawDiff = angleToPlayer - camera.cone.rotation;
      const diff = Math.abs(Math.atan2(Math.sin(rawDiff), Math.cos(rawDiff)));
      if (d < 140 && diff < 0.34) {
        this.onSpotted("CAMERA TRACE");
        return;
      }
    }
  }

  pointInRect(x, y, rect) {
    return x > rect.x - rect.width / 2 && x < rect.x + rect.width / 2 && y > rect.y - rect.height / 2 && y < rect.y + rect.height / 2;
  }

  onSpotted(reason) {
    this.spottedCooldown = true;
    this.playerLocked = true;
    this.player.setVelocity(0);
    this.setObjective("Governor network detected you.");
    this.showPrompt("");
    this.cameras.main.shake(330, 0.014);
    this.cameras.main.flash(150, 255, 60, 110);
    this.showFloatingText(this.player.x, this.player.y - 58, reason, 0xff9bb8);

    this.time.delayedCall(500, () => {
      this.player.setPosition(this.safePoint.x, this.safePoint.y);
      this.player.play("idle-up");
      this.facing = "up";
      this.playerLocked = false;
    });

    this.time.delayedCall(1400, () => {
      this.spottedCooldown = false;
    });
  }

  handleMovement() {
    const baseSpeed = 112;
    let speed = baseSpeed;

    if (Phaser.Input.Keyboard.JustDown(this.keyShift) && this.canDash) {
      speed = 260;
      this.canDash = false;
      this.cameras.main.shake(70, 0.004);
      this.time.delayedCall(700, () => {
        this.canDash = true;
      });
    }

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

  updatePlayerLocator() {
    if (!this.playerLocator) return;
    this.playerLocator.x = this.player.x;
    this.playerLocator.y = this.player.y - 21;
  }

  handleInteraction() {
    if (!Phaser.Input.Keyboard.JustDown(this.keyE)) return;

    if (this.nearGuide) {
      this.showDialogue([
        "Runaway Clerk: The castle is the map room. The Governor's district machine is inside.",
        "Runaway Clerk: Evidence persuades citizens. Street actions disrupt his network.",
        "Runaway Clerk: When people wake up and the network stumbles, the castle gate opens."
      ]);
      return;
    }

    if (this.nearEvidence) {
      this.collectEvidence(this.nearEvidence);
      return;
    }

    if (this.nearAction) {
      this.startResistanceAction(this.nearAction);
      return;
    }

    if (this.nearCitizen) {
      this.startCitizenEncounter(this.nearCitizen);
      return;
    }

    if (this.nearMapGate) this.beginMapRoomTransition();
  }

  collectEvidence(node) {
    node.collected = true;
    this.evidence[node.key] = true;
    this.evidenceFound++;
    this.evidenceText.setText(`EVIDENCE ${this.evidenceFound}/${this.requiredEvidence}`);
    node.core.destroy();
    node.base.setStrokeStyle(4, 0xf1ca4f, 0.75);
    node.base.setFillStyle(0xf1ca4f, 0.08);
    node.label.setText("EVIDENCE SECURED");
    node.label.setColor("#f1ca4f");
    this.cameras.main.shake(130, 0.004);

    this.showDialogue(node.lines, () => this.setObjective("Use evidence to persuade citizens."));
  }

  startResistanceAction(action) {
    this.channeling = true;
    this.player.setVelocity(0);
    this.showPrompt("");
    this.setObjective(action.title);

    const barBack = this.trackUI(this.add.rectangle(640, 620, 360, 18, 0x05070d, 0.95).setScrollFactor(0).setDepth(2200));
    barBack.setStrokeStyle(3, 0xf1ca4f, 0.75);
    const bar = this.trackUI(this.add.rectangle(462, 620, 0, 10, 0xf1ca4f, 0.95).setOrigin(0, 0.5).setScrollFactor(0).setDepth(2201));

    this.tweens.add({
      targets: bar,
      width: 350,
      duration: 1200,
      ease: "Linear",
      onComplete: () => {
        barBack.destroy();
        bar.destroy();
        this.completeResistanceAction(action);
      }
    });
  }

  completeResistanceAction(action) {
    action.complete = true;
    this.channeling = false;
    this.actionsComplete++;
    this.actionText.setText(`ACTIONS ${this.actionsComplete}/${this.requiredActions}`);
    action.ring.setFillStyle(0xf1ca4f, 0.18);
    action.ring.setStrokeStyle(4, 0xf1ca4f, 0.9);
    action.label.setText("RESISTANCE WON");
    action.label.setColor("#f1ca4f");
    this.applyResistanceEffect(action);
    this.cameras.main.flash(160, 241, 202, 79);
    this.cameras.main.shake(240, 0.008);
    this.showFloatingText(action.x, action.y - 72, action.successLine, 0xf1ca4f);
    this.checkUnlockMapRoom();
  }

  applyResistanceEffect(action) {
    if (action.type === "jammer") {
      for (const scanner of this.scanners) {
        if (scanner.color === 0xff3b7a) {
          scanner.disabled = true;
          scanner.beam.setAlpha(0.06);
          scanner.beam.setStrokeStyle(2, 0x6b7280, 0.25);
        }
      }
      this.showPrompt("Pink scanners jammed. A safer lower route is open.");
    } else if (action.type === "signal") {
      for (const scanner of this.scanners) scanner.speed *= 0.68;
      this.showPrompt("Relay hacked. Scanner sweeps slowed.");
    } else if (action.type === "poster") {
      for (const camera of this.securityCameras) {
        camera.cone.setAlpha(0.06);
      }
      this.showPrompt("Posters down. Camera attention weakened.");
    }
  }

  startCitizenEncounter(citizen) {
    if (!this.evidence[citizen.evidenceKey]) {
      this.showDialogue([citizen.clue, "Bystander: I need proof, not another slogan.", "Find the city record that answers this."]);
      return;
    }

    this.choiceCitizen = citizen;
    this.showDialogue([citizen.clue, "Bystander: I found something you should see."], () => this.showCitizenChoice(citizen));
  }

  showCitizenChoice(citizen) {
    this.choiceActive = true;
    this.dialogueActive = false;
    this.playerLocked = true;
    this.clearDialogueObjects();

    this.dialogueBox = this.trackUI(this.add.rectangle(640, 550, 800, 150, 0x05070d, 0.97).setScrollFactor(0).setDepth(2000));
    this.dialogueBox.setStrokeStyle(5, 0xf1ca4f);
    this.dialogueText = this.trackUI(this.add.text(260, 500, `${citizen.name}: What are you showing me?\n\n[1] ${citizen.right}\n[2] ${citizen.wrong}`, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "17px",
      color: "#ffffff",
      lineSpacing: 6,
      wordWrap: { width: 760 },
      resolution: 2
    }).setScrollFactor(0).setDepth(2001));
  }

  resolveCitizenChoice(choice) {
    if (!this.choiceCitizen) return;

    const citizen = this.choiceCitizen;
    this.choiceActive = false;
    this.choiceCitizen = null;
    this.playerLocked = false;
    this.clearDialogueObjects();

    if (choice === 1) {
      this.awakenCitizen(citizen);
    } else {
      this.showDialogue([`${citizen.name}: That sounds like the Governor with nicer words.`, "Bystander: Right. Proof, plainly. Try again."]);
    }
  }

  awakenCitizen(citizen) {
    citizen.awakenedDone = true;
    citizen.sprite.clearTint();
    citizen.sprite.setTint(0xf1ca4f);
    citizen.ring.setFillStyle(0xf1ca4f, 0.2);
    citizen.ring.setStrokeStyle(3, 0xf1ca4f, 0.9);
    citizen.tag.setText("AWAKE");
    citizen.tag.setColor("#f1ca4f");
    this.awakenedCitizens++;
    this.resistanceText.setText(`RESISTANCE ${this.awakenedCitizens}/${this.requiredCitizens}`);
    this.cameras.main.shake(180, 0.006);
    this.showFloatingText(citizen.x, citizen.y - 70, citizen.awakened, 0xf1ca4f);
    this.checkUnlockMapRoom();
  }

  checkUnlockMapRoom() {
    if (this.mapRoomUnlocked) return;
    if (this.awakenedCitizens < this.requiredCitizens || this.actionsComplete < this.requiredActions) return;

    this.mapRoomUnlocked = true;
    this.setObjective("Enter the castle map room.");
    this.showPrompt("The castle gate has opened.");
    this.cameras.main.shake(700, 0.012);
    this.cameras.main.flash(220, 241, 202, 79);
    this.gateText.setText("MAP ROOM OPEN");
    this.gateText.setColor("#f1ca4f");
    this.gate.setStrokeStyle(5, 0xf1ca4f, 0.95);

    this.gateBars.forEach((bar, index) => {
      this.tweens.add({
        targets: bar,
        y: bar.y - 95,
        alpha: 0,
        delay: index * 70,
        duration: 520,
        onComplete: () => bar.destroy()
      });
    });

    this.showDialogue([
      "Citizen: The Governor's power comes from the castle map room.",
      "Citizen: If the districts are broken, the vote is broken.",
      "Citizen: Go. Make the map answer to us again."
    ]);
  }

  beginMapRoomTransition() {
    if (this.transitioning) return;
    this.transitioning = true;
    this.playerLocked = true;
    this.player.setVelocity(0);
    this.setObjective("Entering the district map.");
    this.showPrompt("");
    this.cameras.main.pan(758, 206, 650, "Sine.easeInOut");
    this.cameras.main.zoomTo(1.16, 650, "Sine.easeInOut");
    this.cameras.main.fadeOut(900, 30, 231, 255);
    this.time.delayedCall(950, () => this.scene.start("DistrictMapScene"));
  }

  updatePrompt() {
    if (this.nearMapGate) {
      this.showPrompt("Press E to enter the castle map room.");
    } else if (this.nearGuide) {
      this.showPrompt("Press E to ask the Runaway Clerk about the Governor.");
    } else if (this.nearEvidence) {
      this.showPrompt(`Press E to inspect ${this.nearEvidence.title.toLowerCase()}.`);
    } else if (this.nearAction) {
      this.showPrompt(`Press E to start ${this.nearAction.title.toLowerCase()}.`);
    } else if (this.nearCitizen) {
      this.showPrompt(this.evidence[this.nearCitizen.evidenceKey] ? "Press E to persuade with evidence." : "Press E to hear what they believe.");
    } else {
      this.showPrompt(this.mapRoomUnlocked ? "Reach the castle gate." : "Collect evidence, persuade citizens, and complete resistance actions. SHIFT: Dash.");
    }
  }

  showFloatingText(x, y, text, color) {
    const label = this.ignoreForUICamera(this.add.text(x, y, text, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "15px",
      color: `#${color.toString(16).padStart(6, "0")}`,
      backgroundColor: "#05070d",
      align: "center",
      padding: { x: 8, y: 5 },
      wordWrap: { width: 360 },
      resolution: 2
    }).setOrigin(0.5).setDepth(300));

    this.tweens.add({ targets: label, y: y - 28, alpha: 0, duration: 1700, ease: "Sine.easeOut", onComplete: () => label.destroy() });
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

  showDialogue(lines, onDone = null) {
    this.dialogueLines = lines;
    this.dialogueIndex = 0;
    this.dialogueOnDone = onDone;
    this.dialogueActive = true;
    this.lineFinished = false;
    this.clearDialogueObjects();

    this.dialogueBox = this.trackUI(this.add.rectangle(640, 552, 800, 142, 0x05070d, 0.96).setScrollFactor(0).setDepth(2000));
    this.dialogueBox.setStrokeStyle(5, 0x1ee7ff);
    this.dialogueText = this.trackUI(this.add.text(260, 508, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#ffffff",
      lineSpacing: 6,
      wordWrap: { width: 760 },
      resolution: 2
    }).setScrollFactor(0).setDepth(2001));
    this.continueText = this.trackUI(this.add.text(1014, 606, "E", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#111111",
      backgroundColor: "#bfefff",
      padding: { x: 7, y: 3 },
      resolution: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2002));
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
        this.anims.create({ key: `walk-${dir}`, frames: [0, 1, 2, 3].map(i => ({ key: `walk-${dir}-${i}` })), frameRate: 8, repeat: -1 });
      }
      if (!this.anims.exists(`idle-${dir}`)) {
        this.anims.create({ key: `idle-${dir}`, frames: [0, 1, 2, 3].map(i => ({ key: `idle-${dir}-${i}` })), frameRate: 4, repeat: -1 });
      }
    }
  }
}
