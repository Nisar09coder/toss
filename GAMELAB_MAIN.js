// ============================================================
//  FISHTOPIA — Code.org Game Lab
//  Paste this entire file into the Game Lab code editor
//  then press RUN. Everything is self-contained.
// ============================================================

// ─────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────
var screen = "title";       // "title" | "game" | "shop"
var coins  = 0;
var inventory = [];         // array of fish objects  { name, coins, rarity }
var upgrades = {
  rod:   1,   // 1-3  (better rod = better rare chance)
  speed: 1,   // 1-3  (multiplies player move speed)
  luck:  1,   // 1-3  (shifts rarity roll)
  money: 1    // 1-3  (multiplies sell value)
};

// ─────────────────────────────────────────
//  FISH TABLE
// ─────────────────────────────────────────
var fishTable = [
  { name: "Minnow",      coins: 5,   rarity: "Common",    weight: 50 },
  { name: "Bass",        coins: 15,  rarity: "Uncommon",  weight: 28 },
  { name: "Salmon",      coins: 35,  rarity: "Rare",      weight: 13 },
  { name: "Swordfish",   coins: 75,  rarity: "Epic",      weight: 7  },
  { name: "Golden Fish", coins: 200, rarity: "Legendary", weight: 2  }
];

// ─────────────────────────────────────────
//  PLAYER
// ─────────────────────────────────────────
var player = {
  x: 200,
  y: 220,
  speed: 3,
  width: 28,
  height: 28
};

// ─────────────────────────────────────────
//  ZONES  (x, y, width, height)
// ─────────────────────────────────────────
var waterZone = { x: 10,  y: 10,  w: 150, h: 100 };
var sellZone  = { x: 10,  y: 310, w: 120, h: 60  };
var shopZone  = { x: 260, y: 310, w: 120, h: 60  };

// ─────────────────────────────────────────
//  SHOP ITEMS
// ─────────────────────────────────────────
var shopItems = [
  { label: "Better Rod",    key: "rod",   cost: 75,  maxLevel: 3 },
  { label: "Speed Boost",   key: "speed", cost: 60,  maxLevel: 3 },
  { label: "Better Luck",   key: "luck",  cost: 80,  maxLevel: 3 },
  { label: "More Money",    key: "money", cost: 70,  maxLevel: 3 }
];

// ─────────────────────────────────────────
//  FISHING STATE
// ─────────────────────────────────────────
var fishing        = false;
var fishingTimer   = 0;
var cooldown       = false;
var cooldownTimer  = 0;
var COOLDOWN_MS    = 5000;   // 5 seconds
var catchMessage   = "";
var catchMsgTimer  = 0;

// ─────────────────────────────────────────
//  BOOLEANS
// ─────────────────────────────────────────
var nearWater     = false;
var nearSellTable = false;
var nearShop      = false;
var eWasDown      = false;
var eHoldTimer    = 0;
var HOLD_TIME     = 1500;   // hold E for 1.5s to enter shop

// ─────────────────────────────────────────
//  HELPER: overlaps
// ─────────────────────────────────────────
function overlaps(px, py, pw, ph, zx, zy, zw, zh) {
  return px < zx + zw &&
         px + pw > zx &&
         py < zy + zh &&
         py + ph > zy;
}

// ─────────────────────────────────────────
//  HELPER: roll a fish based on luck
// ─────────────────────────────────────────
function rollFish() {
  // Luck upgrade shifts rare fish weight up
  var luckBonus = (upgrades.luck - 1) * 5;
  var table = [];
  var total  = 0;
  for (var i = 0; i < fishTable.length; i++) {
    var w = fishTable[i].weight;
    if (i > 1) w += luckBonus;   // boost Rare, Epic, Legendary
    if (i < 2) w = Math.max(5, w - luckBonus); // reduce Common
    table.push({ fish: fishTable[i], w: w });
    total += w;
  }
  var roll = randomNumber(1, total);
  var acc  = 0;
  for (var j = 0; j < table.length; j++) {
    acc += table[j].w;
    if (roll <= acc) {
      return table[j].fish;
    }
  }
  return fishTable[0];
}

// ─────────────────────────────────────────
//  HELPER: sell all fish
// ─────────────────────────────────────────
function sellAll() {
  if (inventory.length === 0) {
    catchMessage  = "Nothing to sell!";
    catchMsgTimer = 2000;
    return;
  }
  var total = 0;
  for (var i = 0; i < inventory.length; i++) {
    total += inventory[i].coins;
  }
  total = Math.floor(total * upgrades.money);
  coins += total;
  catchMessage  = "Sold " + inventory.length + " fish for " + total + " coins!";
  catchMsgTimer = 3000;
  inventory = [];
}

// ─────────────────────────────────────────
//  DRAW HELPERS
// ─────────────────────────────────────────
function drawText(txt, x, y, size, col) {
  textSize(size);
  fill(col);
  text(txt, x, y);
}

function drawRect(x, y, w, h, col) {
  noStroke();
  fill(col);
  rect(x, y, w, h);
}

function drawRoundRect(x, y, w, h, r, col) {
  noStroke();
  fill(col);
  rect(x, y, w, h, r);
}

// ─────────────────────────────────────────
//  SCREEN: TITLE
// ─────────────────────────────────────────
function drawTitle() {
  // Sky background
  background(rgb(100, 180, 235));

  // Water strip
  drawRect(0, 220, 400, 180, rgb(30, 100, 180));

  // Ground strip
  drawRect(0, 160, 400, 70, rgb(90, 140, 70));

  // Title text
  textAlign(CENTER);
  textStyle(BOLD);
  drawText("FISHTOPIA", 200, 90, 36, rgb(20, 60, 120));
  textStyle(NORMAL);
  drawText("A Gimkit-style fishing game", 200, 118, 14, rgb(30, 80, 150));

  // Play button
  drawRoundRect(140, 140, 120, 44, 22, rgb(30, 100, 180));
  textAlign(CENTER);
  drawText("PLAY", 200, 167, 18, rgb(255, 255, 255));

  // Fish decoration
  drawText("~  ~  ~  ~", 200, 250, 18, rgb(80, 160, 230));
  drawText("press PLAY to start", 200, 360, 13, rgb(200, 230, 255));
}

function handleTitleClick() {
  // Play button bounds: x 140-260, y 140-184
  if (mouseX > 140 && mouseX < 260 && mouseY > 140 && mouseY < 184) {
    screen = "game";
    player.x = 180;
    player.y = 180;
  }
}

// ─────────────────────────────────────────
//  SCREEN: GAME MAP
// ─────────────────────────────────────────
function drawGame() {
  // Sky
  background(rgb(140, 200, 240));

  // Ground
  drawRect(0, 100, 400, 300, rgb(100, 160, 80));

  // ── WATER ZONE ──
  drawRoundRect(waterZone.x, waterZone.y, waterZone.w, waterZone.h, 8, rgb(30, 100, 200));
  textAlign(CENTER);
  drawText("~ WATER ~", waterZone.x + waterZone.w/2, waterZone.y + 30, 12, rgb(180, 230, 255));
  drawText("Press E to fish", waterZone.x + waterZone.w/2, waterZone.y + 50, 10, rgb(200, 240, 255));

  // ── SELL TABLE ──
  drawRoundRect(sellZone.x, sellZone.y, sellZone.w, sellZone.h, 8, rgb(120, 80, 40));
  textAlign(CENTER);
  drawText("SELL TABLE", sellZone.x + sellZone.w/2, sellZone.y + 20, 11, rgb(255, 220, 80));
  drawText("Press E", sellZone.x + sellZone.w/2, sellZone.y + 38, 10, rgb(255, 255, 200));
  drawText(inventory.length + " fish", sellZone.x + sellZone.w/2, sellZone.y + 54, 10, rgb(255, 255, 200));

  // ── SHOP ENTRANCE ──
  drawRoundRect(shopZone.x, shopZone.y, shopZone.w, shopZone.h, 8, rgb(80, 60, 180));
  textAlign(CENTER);
  drawText("SHOP  ->", shopZone.x + shopZone.w/2, shopZone.y + 20, 11, rgb(220, 215, 255));
  drawText("Hold E", shopZone.x + shopZone.w/2, shopZone.y + 38, 10, rgb(200, 195, 255));

  // ── HUD ──
  drawRoundRect(4, 4, 100, 22, 6, rgb(255, 215, 0));
  textAlign(LEFT);
  drawText("Coins: " + coins, 10, 19, 12, rgb(80, 50, 0));

  drawRoundRect(110, 4, 110, 22, 6, rgb(60, 60, 60));
  drawText("Inv: " + inventory.length + " fish", 116, 19, 12, rgb(220, 220, 220));

  // ── PROXIMITY PROMPTS ──
  textAlign(CENTER);
  if (nearWater && !fishing && !cooldown) {
    drawRoundRect(100, 380, 200, 24, 6, rgb(0, 0, 0));
    drawText("[E] Cast fishing line", 200, 396, 12, rgb(255, 255, 255));
  }
  if (nearSellTable) {
    drawRoundRect(100, 380, 200, 24, 6, rgb(0, 0, 0));
    drawText("[E] Sell all fish", 200, 396, 12, rgb(255, 255, 255));
  }
  if (nearShop) {
    var pct = Math.floor((eHoldTimer / HOLD_TIME) * 100);
    drawRoundRect(80, 380, 240, 24, 6, rgb(0, 0, 0));
    drawText("[Hold E] Enter shop  " + pct + "%", 200, 396, 12, rgb(200, 195, 255));
  }

  // ── FISHING ANIMATION ──
  if (fishing) {
    drawRoundRect(80, 355, 240, 24, 6, rgb(30, 100, 200));
    drawText("Fishing... reeling in!", 200, 371, 12, rgb(180, 230, 255));
    // animated dots based on timer
    var dots = Math.floor((fishingTimer / 400) % 4);
    var dotStr = "";
    for (var d = 0; d < dots; d++) dotStr += ".";
    drawText(dotStr, 200, 356, 14, rgb(255, 255, 255));
  }

  if (cooldown) {
    var secLeft = Math.ceil(cooldownTimer / 1000);
    drawRoundRect(110, 405, 180, 22, 6, rgb(60, 60, 60));
    textAlign(CENTER);
    drawText("Cooldown: " + secLeft + "s", 200, 420, 11, rgb(200, 200, 200));
  }

  // ── CATCH MESSAGE ──
  if (catchMsgTimer > 0) {
    drawRoundRect(60, 50, 280, 44, 8, rgb(20, 140, 100));
    textAlign(CENTER);
    drawText(catchMessage, 200, 76, 12, rgb(220, 255, 240));
  }

  // ── PLAYER ──
  // Shadow
  fill(rgb(0, 0, 0));
  ellipse(player.x + player.width/2, player.y + player.height + 4, 22, 6);
  // Body
  drawRoundRect(player.x, player.y, player.width, player.height, 5, rgb(220, 120, 50));
  // Head
  fill(rgb(240, 190, 120));
  ellipse(player.x + player.width/2, player.y - 6, 22, 22);
}

// ─────────────────────────────────────────
//  SCREEN: SHOP MAP
// ─────────────────────────────────────────
function drawShop() {
  background(rgb(40, 30, 80));

  // Title
  textAlign(CENTER);
  drawText("UPGRADE SHOP", 200, 30, 20, rgb(220, 215, 255));
  drawText("Coins: " + coins, 200, 52, 14, rgb(255, 215, 0));

  // Draw each upgrade item
  for (var i = 0; i < shopItems.length; i++) {
    var item = shopItems[i];
    var lv   = upgrades[item.key];
    var bx   = 20;
    var by   = 75 + i * 75;
    var bw   = 360;
    var bh   = 62;

    // Card background
    drawRoundRect(bx, by, bw, bh, 8, rgb(70, 55, 130));

    // Label + level
    textAlign(LEFT);
    drawText(item.label, bx + 12, by + 20, 14, rgb(220, 215, 255));
    drawText("Level: " + lv + " / " + item.maxLevel, bx + 12, by + 38, 11, rgb(160, 155, 220));

    // Level dots
    for (var d = 0; d < item.maxLevel; d++) {
      var dotCol = d < lv ? rgb(255, 215, 0) : rgb(100, 90, 160);
      fill(dotCol);
      noStroke();
      ellipse(bx + 12 + d * 18, by + 52, 12, 12);
    }

    // Buy button
    if (lv < item.maxLevel) {
      drawRoundRect(bx + bw - 90, by + 14, 80, 34, 8, rgb(255, 215, 0));
      textAlign(CENTER);
      drawText(item.cost + " coins", bx + bw - 50, by + 35, 12, rgb(60, 40, 0));
    } else {
      drawRoundRect(bx + bw - 90, by + 14, 80, 34, 8, rgb(40, 140, 80));
      textAlign(CENTER);
      drawText("MAX", bx + bw - 50, by + 35, 13, rgb(180, 255, 180));
    }
  }

  // Back button
  drawRoundRect(10, 380, 100, 34, 8, rgb(180, 60, 60));
  textAlign(CENTER);
  drawText("< Back", 60, 401, 13, rgb(255, 200, 200));

  // Instructions
  drawText("Click an item to buy it", 200, 440, 12, rgb(140, 130, 200));
  drawText("Hold E to return to map", 200, 458, 12, rgb(140, 130, 200));
}

function handleShopClick() {
  // Back button
  if (mouseX > 10 && mouseX < 110 && mouseY > 380 && mouseY < 414) {
    screen = "game";
    return;
  }
  // Item buy buttons
  for (var i = 0; i < shopItems.length; i++) {
    var item = shopItems[i];
    var bx   = 20;
    var by   = 75 + i * 75;
    var bw   = 360;
    var btnX = bx + bw - 90;
    var btnY = by + 14;
    if (mouseX > btnX && mouseX < btnX + 80 &&
        mouseY > btnY && mouseY < btnY + 34) {
      var lv = upgrades[item.key];
      if (lv < item.maxLevel && coins >= item.cost) {
        coins -= item.cost;
        upgrades[item.key]++;
        // Apply speed upgrade immediately
        player.speed = 3 + (upgrades.speed - 1);
      }
    }
  }
}

// ─────────────────────────────────────────
//  UPDATE LOGIC (called every frame)
// ─────────────────────────────────────────
function updateGame() {
  var spd = player.speed;

  // Movement
  if (keyDown("left")  || keyDown("a")) { player.x -= spd; }
  if (keyDown("right") || keyDown("d")) { player.x += spd; }
  if (keyDown("up")    || keyDown("w")) { player.y -= spd; }
  if (keyDown("down")  || keyDown("s")) { player.y += spd; }

  // Clamp to canvas
  player.x = Math.max(0,   Math.min(400 - player.width,  player.x));
  player.y = Math.max(100, Math.min(400 - player.height, player.y));

  // Zone detection
  nearWater     = overlaps(player.x, player.y, player.width, player.height,
                           waterZone.x, waterZone.y, waterZone.w, waterZone.h);
  nearSellTable = overlaps(player.x, player.y, player.width, player.height,
                           sellZone.x, sellZone.y, sellZone.w, sellZone.h);
  nearShop      = overlaps(player.x, player.y, player.width, player.height,
                           shopZone.x, shopZone.y, shopZone.w, shopZone.h);

  var eDown = keyDown("e");

  // ── E key: fishing ──
  if (eDown && nearWater && !fishing && !cooldown && !nearSellTable && !nearShop) {
    fishing      = true;
    fishingTimer = randomNumber(1500, 3000); // 1.5–3s wait
  }

  // ── E key: sell ──
  if (eDown && nearSellTable && !eWasDown) {
    sellAll();
  }

  // ── E key: shop hold ──
  if (eDown && nearShop) {
    eHoldTimer += 33; // approx ms per frame at 30fps
    if (eHoldTimer >= HOLD_TIME) {
      screen     = "shop";
      eHoldTimer = 0;
    }
  } else {
    eHoldTimer = 0;
  }

  eWasDown = eDown;

  // ── Fishing timer countdown ──
  if (fishing) {
    fishingTimer -= 33;
    if (fishingTimer <= 0) {
      fishing      = false;
      var caught   = rollFish();
      inventory.push(caught);
      catchMessage  = "You caught a " + caught.name + "! (" + caught.rarity + ")";
      catchMsgTimer = 3000;
      cooldown      = true;
      cooldownTimer = COOLDOWN_MS;
    }
  }

  // ── Cooldown countdown ──
  if (cooldown) {
    cooldownTimer -= 33;
    if (cooldownTimer <= 0) {
      cooldown      = false;
      cooldownTimer = 0;
    }
  }

  // ── Catch message timer ──
  if (catchMsgTimer > 0) {
    catchMsgTimer -= 33;
  }
}

// ─────────────────────────────────────────
//  MAIN DRAW LOOP
// ─────────────────────────────────────────
function draw() {
  if (screen === "title") {
    drawTitle();
  } else if (screen === "game") {
    updateGame();
    drawGame();
  } else if (screen === "shop") {
    drawShop();
  }
}

// ─────────────────────────────────────────
//  CLICK HANDLER
// ─────────────────────────────────────────
function mouseClicked() {
  if (screen === "title") {
    handleTitleClick();
  } else if (screen === "shop") {
    handleShopClick();
  }
}
