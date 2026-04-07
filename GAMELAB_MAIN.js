var bgTitle;
var bgMap;
var playerSprite;
var screen = "title";
var coins = 0;
var inventory = [];
var upgrades = {
  rod: 1,
  speed: 1,
  luck: 1,
  money: 1,
};
var fishTable = [
  { name: "Minnow", coins: 5, rarity: "Common", weight: 50 },
  { name: "Bass", coins: 15, rarity: "Uncommon", weight: 28 },
  { name: "Salmon", coins: 35, rarity: "Rare", weight: 13 },
  { name: "Swordfish", coins: 75, rarity: "Epic", weight: 7 },
  { name: "Golden Fish", coins: 200, rarity: "Legendary", weight: 2},
];
var player = {
  x: 200,
  y: 220,
  speed: 3,
  width: 28,
  height: 28
};

var waterZone = { x: 10,  y: 10,  w: 150, h: 100 };
var sellZone  = { x: 10,  y: 310, w: 120, h: 60  };
var shopZone  = { x: 260, y: 310, w: 120, h: 60  };

var shopItems = [
  {label: "Better Rod", key: "rod", cost: 75, maxLevel: 3},
  {label: "Speed Boost", key: "speed", cost: 60, maxLevel: 3},
  {label: "Better Luck", key: "luck", cost: 80, maxLevel: 3},
  {label: "More Money", key: "money", cost: 70, maxLevel: 3},
];

var fishing = false;
var fishingTimer = 0;
var cooldown = false;
var cooldownTimer = 0;
var COOLDOWN_MS = 5000;
var catchMessage = "";
var catchMsgTimer = 0;

var nearWater = false;
var nearSellTable = false;
var nearShop = false;
var eWasDown = false;
var eHoldTimer = 0;
var HOLD_TIME = 1500;

function overlaps(px, py, pw, ph, zx, zy, zw, zh) {
  return px < zx + zw &&
         px + pw > zx &&
         py < zy + zh &&
         py + ph > zy;
}

function rollFish() {
  var luckBonus = (upgrades.luck - 1) * 5;
  var table = [];
  var total = 0;
  for (var i = 0; i < fishTable.length; i++) {
    var w = fishTable[i].weight;
    if (i > 1) w += luckBonus;
    if (i < 2) w = Math.max(5, w - luckBonus);
    table.push({fish: fishTable[i], w: w});
    total += w;
  }
  var roll = randomNumber(1, total);
  var acc = 0;
  for (var j = 0; j < table.length; j++) {
    acc += table[j].w;
    if (roll <= acc) {
      return table[j].fish;
    }
  }
  return fishTable[0];
}

function sellAll() {
  if (inventory.length === 0) {
    catchMessage = "Nothing to sell!";
    catchMsgTimer = 2000;
    return;
  }
  var total = 0;
  for (var i = 0; i < inventory.length; i++) {
    total += inventory[i].coins;
  }
  total = Math.floor(total * upgrades.money);
  coins += total;
  catchMessage = "Sold " + inventory.length + " fish for " + total + " coins!";
  catchMsgTimer = 3000;
  inventory = [];
}

function updateGame() {
  var spd = player.speed;

  if (keyDown("left")  || keyDown("a")) { playerSprite.x -= spd; }
  if (keyDown("right") || keyDown("d")) { playerSprite.x += spd; }
  if (keyDown("up")    || keyDown("w")) { playerSprite.y -= spd; }
  if (keyDown("down")  || keyDown("s")) { playerSprite.y += spd; }

  playerSprite.x = Math.max(20, Math.min(380, playerSprite.x));
  playerSprite.y = Math.max(20, Math.min(380, playerSprite.y));

  player.x = playerSprite.x;
  player.y = playerSprite.y;

  nearWater     = overlaps(player.x, player.y, player.width, player.height,
                           waterZone.x, waterZone.y, waterZone.w, waterZone.h);
  nearSellTable = overlaps(player.x, player.y, player.width, player.height,
                           sellZone.x, sellZone.y, sellZone.w, sellZone.h);
  nearShop      = overlaps(player.x, player.y, player.width, player.height,
                           shopZone.x, shopZone.y, shopZone.w, shopZone.h);

  var eDown = keyDown("e");

  if (eDown && nearWater && !fishing && !cooldown && !nearSellTable && !nearShop) {
    fishing = true;
    fishingTimer = randomNumber(1500, 3000);
  }

  if (eDown && nearSellTable && !eWasDown) {
    sellAll();
  }

  if (eDown && nearShop) {
    eHoldTimer += 33;
    if (eHoldTimer >= HOLD_TIME) {
      screen = "shop";
      eHoldTimer = 0;
    }
  } else {
    eHoldTimer = 0;
  }

  eWasDown = eDown;

  if (fishing) {
    fishingTimer -= 33;
    if (fishingTimer <= 0) {
      fishing = false;
      var caught = rollFish();
      inventory.push(caught);
      catchMessage = "You caught a " + caught.name + "! (" + caught.rarity + ")";
      catchMsgTimer = 3000;
      cooldown = true;
      cooldownTimer = COOLDOWN_MS;
    }
  }

  if (cooldown) {
    cooldownTimer -= 33;
    if (cooldownTimer <= 0) {
      cooldown = false;
      cooldownTimer = 0;
    }
  }

  if (catchMsgTimer > 0) {
    catchMsgTimer -= 33;
  }
}

function drawHUD() {
  noStroke();
  fill(rgb(0, 0, 0));
  rect(4, 4, 110, 22, 6);
  fill(rgb(255, 215, 0));
  textSize(12);
  textAlign(LEFT);
  text("Coins: " + coins, 10, 20);

  fill(rgb(40, 40, 40));
  rect(120, 4, 120, 22, 6);
  fill(rgb(220, 220, 220));
  text("Inv: " + inventory.length + " fish", 126, 20);

  textAlign(CENTER);
  if (nearWater && !fishing && !cooldown) {
    fill(rgb(0, 0, 0));
    rect(100, 375, 200, 22, 6);
    fill(rgb(255, 255, 255));
    textSize(11);
    text("[E] Cast fishing line", 200, 390);
  }
  if (nearSellTable) {
    fill(rgb(0, 0, 0));
    rect(100, 375, 200, 22, 6);
    fill(rgb(255, 220, 80));
    textSize(11);
    text("[E] Sell all fish", 200, 390);
  }
  if (nearShop) {
    var pct = Math.floor((eHoldTimer / HOLD_TIME) * 100);
    fill(rgb(0, 0, 0));
    rect(80, 375, 240, 22, 6);
    fill(rgb(200, 195, 255));
    textSize(11);
    text("[Hold E] Enter shop " + pct + "%", 200, 390);
  }
  if (fishing) {
    fill(rgb(30, 100, 200));
    rect(80, 350, 240, 22, 6);
    fill(rgb(180, 230, 255));
    textSize(11);
    text("Fishing... reeling in!", 200, 365);
  }
  if (cooldown) {
    var secLeft = Math.ceil(cooldownTimer / 1000);
    fill(rgb(60, 60, 60));
    rect(110, 350, 180, 22, 6);
    fill(rgb(200, 200, 200));
    textSize(11);
    text("Cooldown: " + secLeft + "s", 200, 365);
  }
  if (catchMsgTimer > 0) {
    fill(rgb(20, 140, 100));
    rect(60, 45, 280, 36, 8);
    fill(rgb(220, 255, 240));
    textSize(11);
    text(catchMessage, 200, 67);
  }
}

function drawShop() {
  background(rgb(40, 30, 80));
  textAlign(CENTER);
  fill(rgb(220, 215, 255));
  textSize(20);
  text("UPGRADE SHOP", 200, 30);
  fill(rgb(255, 215, 0));
  textSize(14);
  text("Coins: " + coins, 200, 52);

  for (var i = 0; i < shopItems.length; i++) {
    var item = shopItems[i];
    var lv = upgrades[item.key];
    var bx = 20;
    var by = 75 + i * 75;
    var bw = 360;

    fill(rgb(70, 55, 130));
    rect(bx, by, bw, 62, 8);

    textAlign(LEFT);
    fill(rgb(220, 215, 255));
    textSize(14);
    text(item.label, bx + 12, by + 20);
    fill(rgb(160, 155, 220));
    textSize(11);
    text("Level: " + lv + " / " + item.maxLevel, bx + 12, by + 38);

    for (var d = 0; d < item.maxLevel; d++) {
      if (d < lv) {
        fill(rgb(255, 215, 0));
      } else {
        fill(rgb(100, 90, 160));
      }
      noStroke();
      ellipse(bx + 12 + d * 18, by + 52, 12, 12);
    }

    if (lv < item.maxLevel) {
      fill(rgb(255, 215, 0));
      rect(bx + bw - 90, by + 14, 80, 34, 8);
      fill(rgb(60, 40, 0));
      textAlign(CENTER);
      textSize(12);
      text(item.cost + " coins", bx + bw - 50, by + 35);
    } else {
      fill(rgb(40, 140, 80));
      rect(bx + bw - 90, by + 14, 80, 34, 8);
      fill(rgb(180, 255, 180));
      textAlign(CENTER);
      textSize(13);
      text("MAX", bx + bw - 50, by + 35);
    }
  }

  fill(rgb(180, 60, 60));
  rect(10, 380, 100, 34, 8);
  fill(rgb(255, 200, 200));
  textAlign(CENTER);
  textSize(13);
  text("< Back", 60, 401);
  fill(rgb(140, 130, 200));
  textSize(12);
  text("Click an item to buy", 200, 440);
}

function mouseClicked() {
  if (screen === "shop") {
    if (mouseX > 10 && mouseX < 110 && mouseY > 380 && mouseY < 414) {
      screen = "game";
      return;
    }
    for (var i = 0; i < shopItems.length; i++) {
      var item = shopItems[i];
      var bx = 20;
      var by = 75 + i * 75;
      var bw = 360;
      var btnX = bx + bw - 90;
      var btnY = by + 14;
      if (mouseX > btnX && mouseX < btnX + 80 &&
          mouseY > btnY && mouseY < btnY + 34) {
        var lv = upgrades[item.key];
        if (lv < item.maxLevel && coins >= item.cost) {
          coins -= item.cost;
          upgrades[item.key]++;
          player.speed = 3 + (upgrades.speed - 1);
        }
      }
    }
  }
}

function draw() {
  background("white");

  if (screen === "title") {
    if (!bgTitle) {
      bgTitle = createSprite(200, 200);
      bgTitle.setAnimation("StartScreen");
    }
    bgTitle.visible = true;
    if (bgMap) bgMap.visible = false;
    if (playerSprite) playerSprite.visible = false;
    if (keyDown("space")) {
      screen = "game";
    }
  }

  if (screen === "game") {
    if (!bgMap) {
      bgMap = createSprite(200, 200);
      bgMap.setAnimation("MainMap");
    }
    bgMap.visible = true;
    if (bgTitle) bgTitle.visible = false;

    if (!playerSprite) {
      playerSprite = createSprite(200, 300);
      playerSprite.setAnimation("Player");
      playerSprite.scale = 0.14;
    }
    playerSprite.visible = true;
    updateGame();
    drawHUD();
  }

  if (screen === "shop") {
    if (playerSprite) playerSprite.visible = false;
    if (bgMap) bgMap.visible = false;
    drawShop();
  }

  drawSprites();
}
