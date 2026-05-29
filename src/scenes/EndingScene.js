class EndingScene extends Phaser.Scene {
  constructor() {
    super("EndingScene");
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
    this.cameras.main.setBackgroundColor("#05070d");
    this.createPlayerAnimations();
    this.buildBackdrop();
    this.buildRecap();
  }

  buildBackdrop() {
    for (let y = 0; y < 720; y += 24) {
      const alpha = y % 48 === 0 ? 0.16 : 0.08;
      this.add.rectangle(640, y, 1280, 2, 0x1ee7ff, alpha);
    }
    for (let x = 0; x < 1280; x += 48) {
      this.add.rectangle(x, 360, 2, 720, 0xff3b7a, 0.06);
    }

    this.add.text(640, 70, "THE REVOLUTION CONTINUES", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "35px",
      color: "#f1ca4f",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(640, 112, "1776  ->  2026", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "18px",
      color: "#bfefff",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);
  }

  buildRecap() {
    this.recapLayer = this.add.container(0, 0);
    this.recapIndex = 0;
    this.recapScenes = [
      {
        title: "A Quiet Room",
        line: "You began as a bystander, unsure whether one person could matter.",
        color: 0x6f4e37,
        accent: 0xf4e7c5
      },
      {
        title: "Boston Harbor",
        line: "You carried crates into the water and turned a protest into action.",
        color: 0x1d4e89,
        accent: 0xbfefff
      },
      {
        title: "The Underground Press",
        line: "You spread Common Sense, because ideas can outrun fear.",
        color: 0x6b3f1d,
        accent: 0xf1ca4f
      },
      {
        title: "The Locked Chest",
        line: "You saw that the rights people fought for can be chained again.",
        color: 0x3f2c1d,
        accent: 0xf1ca4f
      },
      {
        title: "The Modern City",
        line: "You woke citizens, gathered evidence, and resisted silence in a new age.",
        color: 0x0b1630,
        accent: 0x1ee7ff
      },
      {
        title: "The Map Room",
        line: "You repaired broken districts and recovered the Key of Sovereignty.",
        color: 0x111827,
        accent: 0xff3b7a
      },
      {
        title: "The Governor's Court",
        line: "You proved that no system is stronger than people who refuse to disappear.",
        color: 0x05070d,
        accent: 0xf1ca4f
      }
    ];

    this.recapTitle = this.add.text(640, 170, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "30px",
      color: "#f1ca4f",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.recapText = this.add.text(640, 585, "", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "22px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: 900 },
      resolution: 2
    }).setOrigin(0.5);

    this.progressText = this.add.text(640, 650, "Press E to continue", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#b8b8c8",
      align: "center",
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({ targets: this.progressText, alpha: 1, duration: 600, yoyo: true, repeat: -1 });
    this.showRecapScene();
    this.input.keyboard.on("keydown-E", () => this.skipOrAdvance());
    this.input.keyboard.on("keydown-SPACE", () => this.skipOrAdvance());
  }

  skipOrAdvance() {
    if (this.inScroll) return;
    this.recapIndex++;
    if (this.recapIndex >= this.recapScenes.length) {
      this.startEndScroll();
    } else {
      this.showRecapScene();
    }
  }

  showRecapScene() {
    this.recapLayer.removeAll(true);
    const scene = this.recapScenes[this.recapIndex];
    this.recapTitle.setText(scene.title);
    this.recapText.setText(scene.line);

    const panel = this.add.rectangle(640, 360, 850, 300, scene.color, 0.72).setStrokeStyle(5, scene.accent, 0.8);
    const road = this.add.rectangle(640, 440, 760, 52, 0x101827, 0.95).setStrokeStyle(2, scene.accent, 0.35);
    const glow = this.add.circle(640, 360, 86, scene.accent, 0.14).setStrokeStyle(4, scene.accent, 0.75);
    const player = this.add.sprite(400, 430, "walk-right-0").setScale(2.4).setDepth(5);
    player.play("walk-right");

    const markers = [];
    for (let i = 0; i < 5; i++) {
      markers.push(this.add.rectangle(430 + i * 105, 440, 46, 6, scene.accent, 0.65));
    }

    const icon = this.add.star(640, 350, 5, 28, 64, scene.accent, 0.9).setDepth(4);
    const caption = this.add.text(640, 350, `${this.recapIndex + 1}`, {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "30px",
      color: "#05070d",
      resolution: 2
    }).setOrigin(0.5).setDepth(6);

    this.recapLayer.add([panel, road, glow, player, icon, caption, ...markers]);
    this.recapLayer.setAlpha(0);
    this.tweens.add({ targets: this.recapLayer, alpha: 1, duration: 500 });
    this.tweens.add({ targets: player, x: 880, duration: 3100, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: glow, scale: 1.35, alpha: 0.04, duration: 1000, yoyo: true, repeat: -1 });

    if (this.autoAdvance) this.autoAdvance.remove(false);
    this.autoAdvance = this.time.delayedCall(3900, () => this.skipOrAdvance());
  }

  startEndScroll() {
    this.inScroll = true;
    if (this.autoAdvance) this.autoAdvance.remove(false);
    this.recapLayer.removeAll(true);
    this.recapTitle.destroy();
    this.recapText.destroy();
    this.progressText.destroy();

    this.cameras.main.fadeOut(600, 5, 7, 13);
    this.time.delayedCall(650, () => {
      this.children.removeAll();
      this.cameras.main.setBackgroundColor("#020617");
      this.cameras.main.fadeIn(900, 5, 7, 13);
      this.buildScrollText();
    });
  }

  buildScrollText() {
    const paragraphs = [
      "The Revolution was not a one-time event. It is an ongoing fight.",
      "Ordinary people stepped up in 1776. They still do today.",
      "History can inspire us to make a difference in the world and make it better.",
      "The main goal of our history project was to take our quote and turn it into a real playable experience, not just a sentence on a poster board. When we look at the American Revolution, we see that it did not truly end in 1776. The fight for rights, representation, and voice continues.",
      "There will always be someone who tries to take what rightfully belongs to others. Simply standing by can lead people toward their own doom. The patterns of the past continue to appear in the present, and they will continue to challenge the future.",
      "Be the one who makes change. Bring good to yourself and to the people around you. History inspires us to act, and we have a duty to help form a better world.",
      "Simple acts, such as spreading a message or throwing crates into the harbor, can have much larger effects on who gets a say and who does not. From 1776 to 2026, we have seen 250 years of people fighting for rights they deserved from the start.",
      "One day, those people may be us. Knowing when to speak, when to act, and when to resist is vital for humanity to persevere and grow. Staying silent may seem easier at times, but knowing when action is necessary is crucial for the development of humankind.",
      "Ordinary people, like the hidden bystander, remain at the center of this struggle. Make the world a better place. When you see something, say something.",
      "You cannot just be a bystander."
    ];

    this.add.text(640, 70, "BYSTANDER", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "45px",
      color: "#f1ca4f",
      align: "center",
      resolution: 2
    }).setOrigin(0.5);

    this.add.text(640, 116, "A History Project By Zidaan Barodawala, Vihaan Tanikonda, and Emmett Yu", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "16px",
      color: "#bfefff",
      align: "center",
      wordWrap: { width: 1020 },
      resolution: 2
    }).setOrigin(0.5);

    const scrollText = this.add.text(640, 770, paragraphs.join("\n\n"), {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "24px",
      color: "#ffffff",
      align: "center",
      lineSpacing: 10,
      wordWrap: { width: 900 },
      resolution: 2
    }).setOrigin(0.5, 0);

    const finalText = this.add.text(640, 610, "Thank you for playing.", {
      fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
      fontSize: "28px",
      color: "#f1ca4f",
      align: "center",
      resolution: 2
    }).setOrigin(0.5).setAlpha(0);

    this.add.rectangle(640, 0, 1280, 170, 0x020617, 0.94).setOrigin(0.5, 0).setDepth(5);
    this.add.rectangle(640, 719, 1280, 120, 0x020617, 0.94).setOrigin(0.5, 1).setDepth(5);

    this.tweens.add({
      targets: scrollText,
      y: -scrollText.height - 90,
      duration: 62000,
      ease: "Linear",
      onComplete: () => {
        this.tweens.add({ targets: finalText, alpha: 1, duration: 1200 });
        this.add.text(640, 660, "The end.", {
          fontFamily: "Trebuchet MS, Verdana, Arial, sans-serif",
          fontSize: "18px",
          fontStyle: "bold",
          color: "#b8b8c8",
          align: "center",
          resolution: 2
        }).setOrigin(0.5);
      }
    });
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
