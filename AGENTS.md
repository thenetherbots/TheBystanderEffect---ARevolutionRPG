Below is a detailed Codex-ready design script for the future arc and final Governor boss.

````md
# FUTURE ARC + GOVERNOR BOSS SCRIPT

## Overall Purpose

The future section is the main thematic payoff of the game. The player has already experienced the Revolution through the harbor, the printing press, and the locked chest. After touching the chest in the Town Square, the player is transported into a modern/futuristic city where the same struggle continues in a new form.

The Governor is not a monster or warrior. He is the embodiment of modern tyranny: censorship, rigged representation, controlled media, fear, and apathy.

The player should still experience this as a real video game boss fight with dodging, dashing, hazards, phases, and escalation. But the way the Governor is defeated should connect to the game’s argument: ordinary people must reclaim representation and refuse to be bystanders.

---

# PART 1: FUTURE CITY — SPREAD THE WORD

## Scene Name

`FutureCityScene`

## Narrative Goal

The player arrives in the future city after touching the locked chest.

The city looks clean and advanced, but lifeless. Citizens walk in loops. Screens repeat Governor propaganda. Police/enforcers block certain paths. District signs show that voting sectors have been manipulated.

The player’s goal is to wake people up by spreading information.

This connects directly to the Underground Press scene: the printing press has become modern information activism.

## Core Mechanic

The player must talk to citizens and distribute truth/evidence/pamphlets/messages.

Use a variable:

```js
this.awakenedCitizens = 0;
this.requiredCitizens = 5;
````

## Citizen States

Each citizen begins in an apathetic state.

Example citizen dialogue before being awakened:

```text
Citizen: "The Governor says the districts are safer this way."
Citizen: "Voting? It never changes anything."
Citizen: "I just keep my head down."
```

When player interacts and gives information:

```text
Bystander: "They split your district so your voice wouldn't count."
Citizen: "Wait... that's why my neighborhood was divided?"
Citizen: "I need to tell the others."
```

Then:

* citizen sprite color brightens
* citizen stops looping
* citizen faces player
* `awakenedCitizens += 1`
* resistance meter increases

## Resistance Meter

Add simple HUD:

```text
Resistance: 0 / 5
```

Each awakened citizen updates the meter.

When enough citizens are awakened:

```js
if (this.awakenedCitizens >= this.requiredCitizens) {
    this.unlockMapRoom();
}
```

## Enforcer Pressure

To make this section a game, not just talking:

* Enforcers patrol streets.
* If player enters vision cone, they are pushed back or temporarily stunned.
* Enforcers should not be too punishing.
* This is a light stealth section.

Detection result:

```text
Enforcer: "Disruptive messaging detected."
```

Then:

* camera shake
* player sent back to safe point
* no game over

## Goal of Part 1

When enough citizens are awakened:

* propaganda screens flicker
* a blocked path opens
* player can enter `DistrictMapScene`

Transition dialogue:

```text
Citizen: "The Governor's power comes from the map."
Citizen: "If the districts are broken, the vote is broken."
Citizen: "Find the map room."
```

---

# PART 2: DISTRICT MAP PUZZLE — UN-GERRYMANDER THE CITY

## Scene Name

`DistrictMapScene`

## Narrative Goal

The player enters a digital civic control room. In the center is a glowing district map. The Governor has redrawn voting districts to isolate communities and dilute their voices.

The player must repair the district map before confronting the Governor.

## Core Mechanic

Create a grid-based puzzle.

The player pushes or rotates district blocks until communities are connected fairly.

Simple prototype version:

* 4 district blocks
* 4 matching switch zones
* Player pushes blocks onto zones
* When all zones are filled, the map is repaired

Variables:

```js
this.districtsFixed = 0;
this.requiredDistricts = 4;
```

## Puzzle Objects

Each district block:

* colored rectangular block
* can be pushed by player
* snaps to grid
* when touching its switch, locks in place

Switches:

* glowing floor tiles
* each represents a community center

When block enters correct switch:

```js
district.locked = true;
this.districtsFixed++;
```

HUD:

```text
Districts Restored: 0 / 4
```

## Visual Feedback

As each district is fixed:

* district line glows gold
* screen pulse
* citizen voices briefly heard
* barriers around the central vault weaken

## Completion

When all districts are fixed:

```js
this.mapFixed = true;
this.giveKeyOfSovereignty();
```

Dialogue:

```text
SYSTEM: "District integrity restored."
SYSTEM: "Representation index rising."
SYSTEM: "Key of Sovereignty released."
```

Player receives:

```js
this.hasKeyOfSovereignty = true;
```

This unlocks the final confrontation.

## Transition to Boss

A huge screen turns on.

Governor appears:

```text
Governor: "You repaired a map and think you repaired a nation?"
Governor: "Representation is inefficient."
Governor: "People are easier to govern when their voices are separated."
Governor: "Come, then. Bring your little key."
```

Scene transitions to:

`GovernorCourtScene`

---

# PART 3: FINAL BOSS — THE ARBITRARY GOVERNOR

## Scene Name

`GovernorBossScene`

## Core Concept

This is a real boss fight, but the boss represents systems of control.

The Governor has three symbolic health bars:

```js
this.fearHP = 100;
this.apathyHP = 100;
this.controlHP = 100;
```

The player does not simply kill the Governor. The player survives, awakens citizens, repairs representation, and uses collected civic powers.

Final victory happens when the people collectively remove the Governor’s last point of power.

---

# Boss Arena

The arena is a digital courtroom / governor chamber.

Visual:

* dark floor
* glowing district lines
* giant screen behind Governor
* podium at top
* player starts bottom center
* citizens appear later
* walls are made of glowing barriers

Player mechanics:

* arrow key movement
* dash with SHIFT
* interact/use power with E or SPACE
* HP system

Player variables:

```js
this.playerHP = 5;
this.canDash = true;
this.dashCooldown = 700;
this.phase = "fear";
```

---

# Phase 1: FEAR

## Narrative Meaning

The Governor first rules through fear.

Dialogue:

```text
Governor: "People obey when they are afraid."
Governor: "Fear is faster than freedom."
```

## Gameplay

The Governor summons modern Redcoat-like enforcers and warning zones.

Attacks:

1. Red warning circles appear.
2. After delay, enforcement strikes hit those zones.
3. Horizontal fear waves move across arena.
4. Enforcer silhouettes patrol briefly.

Player must:

* dodge attacks
* dash through openings
* destroy 3 propaganda towers

## Propaganda Towers

Create 3 towers:

```js
this.towersDestroyed = 0;
this.requiredTowers = 3;
```

Each tower has:

* collision body
* interaction radius
* press E to destroy/expose it

When tower destroyed:

```js
this.towersDestroyed++;
this.fearHP -= 33;
```

Feedback:

* tower sparks
* screen shakes
* citizens’ voices briefly audible

When all towers destroyed:

```js
this.phase = "apathy";
```

Transition dialogue:

```text
Governor: "Fine. Remove fear."
Governor: "They still will not care."
```

---

# Phase 2: APATHY

## Narrative Meaning

The Governor’s second weapon is not violence. It is indifference.

Dialogue:

```text
Governor: "Look at them."
Governor: "They have learned to live without a voice."
Governor: "A quiet people are an easy people."
```

## Gameplay

The arena turns gray.

Citizens appear frozen around the arena.

Governor attacks continue, but slower:

* censorship bars sweep across screen
* small projectiles drift toward player
* gray fog slows movement in patches

Player objective:

* reach citizens
* press E near each one
* awaken them

Variables:

```js
this.citizensAwakened = 0;
this.requiredAwakened = 5;
```

When citizen awakened:

* citizen brightens
* citizen moves to edge of arena
* apathyHP decreases

```js
this.apathyHP -= 20;
```

Each awakened citizen later helps in the final phase.

When enough citizens are awakened:

```js
this.phase = "control";
```

Transition:

```text
Governor: "You mistake noise for power."
Governor: "Power is not in people."
Governor: "Power is in the lines that contain them."
```

---

# Phase 3: CONTROL

## Narrative Meaning

The Governor reveals the manipulated district map.

The arena itself becomes gerrymandered.

Walls shift.
Paths close.
The floor becomes a distorted district map.

## Gameplay

This phase combines dodging and spatial puzzle mechanics.

Arena changes shape every few seconds.

Mechanics:

* glowing district walls appear
* player must activate 4 district nodes
* each node reconnects part of the arena
* Governor fires censorship beams while player moves

Variables:

```js
this.nodesFixed = 0;
this.requiredNodes = 4;
```

Each node:

* glowing tile
* press E to activate
* requires standing still for 1 second
* dangerous because attacks continue

When node activated:

```js
this.nodesFixed++;
this.controlHP -= 25;
```

Visual:

* district wall collapses
* gold line spreads across floor
* citizens move closer to arena

When all nodes fixed:

```js
this.phase = "system";
```

Transition:

```text
Governor: "Enough."
Governor: "If the people will not obey the system..."
Governor: "Then I will become the system."
```

---

# Phase 4: THE SYSTEM

## Narrative Meaning

The Governor merges with the screen, map, propaganda system, and district algorithm.

He is no longer just a person. He is the machinery of modern control.

This is the bullet-hell final phase.

## Visual

* Governor sprite disappears
* giant screen face appears
* arena darkens
* propaganda text flashes
* district lines pulse red
* citizens stand around edge

Boss has final HP:

```js
this.systemHP = 100;
```

## Attacks

### Attack 1: CENSOR Bars

Black horizontal rectangles sweep across arena.

If hit:

```js
this.damagePlayer();
```

### Attack 2: Misinformation Clones

Fake citizen sprites appear and move toward player.

Player must avoid them.

### Attack 3: Gerrymander Walls

Temporary walls split arena into weird shapes.

Player must dash around them.

### Attack 4: Fear Pulse

Red circles appear beneath player and explode after delay.

## Player Powers

During this phase, player uses civic powers collected earlier.

### Free Speech

Key: 1

Effect:

* breaks nearby censor bars
* short cooldown

### Free Press

Key: 2

Effect:

* reveals real target among fake clones
* clears misinformation clones

### Free Minds

Key: 3

Effect:

* freezes attacks briefly
* citizens fire light beams at boss

Each successful use damages systemHP.

Example:

```js
this.systemHP -= 10;
```

## Final Moment

When systemHP reaches 1, normal attacks stop working.

```js
if (this.systemHP <= 1) {
    this.beginFinalVote();
}
```

The player cannot deliver the final hit.

Dialogue:

```text
Governor: "You cannot remove me."
Governor: "I am procedure."
Governor: "I am order."
Governor: "I am the map."
```

Then citizens step forward.

A vote counter appears.

```text
Votes Cast: 0 / 100
```

Citizens awakened throughout the future arc contribute.

The counter rises.

The Governor’s final HP disappears.

Dialogue:

```text
Citizen: "We are the map."
Citizen: "We are the voice."
Citizen: "We are the sovereign."
```

Final hit is collective representation, not player violence.

---

# Boss Fight Implementation Notes

## Required Scene Variables

```js
this.phase = "fear";

this.playerHP = 5;

this.fearHP = 100;
this.apathyHP = 100;
this.controlHP = 100;
this.systemHP = 100;

this.canDash = true;

this.towersDestroyed = 0;
this.citizensAwakened = 0;
this.nodesFixed = 0;
```

## Main Update Loop

Use a phase switch:

```js
update() {
    this.handlePlayerMovement();

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
```

## Damage Function

```js
damagePlayer() {
    if (this.invulnerable) return;

    this.playerHP--;
    this.invulnerable = true;
    this.cameras.main.shake(200, 0.01);

    this.time.delayedCall(900, () => {
        this.invulnerable = false;
    });

    if (this.playerHP <= 0) {
        this.restartBossPhase();
    }
}
```

## Dash

```js
dash() {
    if (!this.canDash) return;

    this.canDash = false;
    this.player.setVelocity(
        this.lastDirection.x * 420,
        this.lastDirection.y * 420
    );

    this.time.delayedCall(650, () => {
        this.canDash = true;
    });
}
```

---

# Thematic Payoff

The boss fight should feel like a video game boss, but its structure proves the game’s argument.

The player cannot win alone.

The Revolution began with ordinary people dumping tea and printing pamphlets.

It ends with ordinary people reclaiming representation.

The final victory is not assassination.

It is sovereignty restored.

```
```
