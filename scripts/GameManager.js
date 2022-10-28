const $ = (selector) => document.querySelector(selector)
const $createElementWithClasses = function(tagName, ...classes) {const tag = document.createElement(tagName);tag.classList.add(...classes);return tag;}
Node.prototype.appendChildren = function(...nodes) {for(const node of nodes) this.appendChild(node);}
class Item {constructor(type, name, count){this.type = type; this.name = name; this.count = count;}}
class PieceItem extends Item {constructor(name, count){super("piece", name, count);}}
class SwordItem extends Item {constructor(name, count){super("sword", name, count);}}
class MoneyItem extends Item {constructor(count){super("money", "돈", count);}}
class Sword {
  constructor(index, name, prob, cost, price, requiredRepairs, canSave, ...pieces) {
    this.index = index;
    this.name = name;
    this.image = "images/swords/" + name + ".png";
    this.prob = prob;
    this.cost = cost;
    this.price = price;
    this.requiredRepairs = requiredRepairs;
    this.canSave = canSave
    this.pieces = pieces;
  }
}
class Piece {
  constructor(name, prob, max_drop) {
    this.name = name;
    this.prob = prob;
    this.max_drop = max_drop;
  }
  calculate() {
    if(Math.random() < this.prob) {
      const result = Math.ceil(Math.round(Math.random()*100)/(100/this.max_drop));
      return new PieceItem(this.name, result);
    } return null;
  }
}
const GameManager = {
  swords: [],
  max_upgradable_index: 30,
  sword_index: 0,
  found_swords: [],
  money: 100000,
  repair_paper: 0,
  inventory: [
    new PieceItem("여신의 눈물", 33),
    new PieceItem("도란의 반지", 30),
    new PieceItem("저녁 갑주", 30),
    new PieceItem("암흑의 인장", 30),
    new PieceItem("삼위일체", 30),
    new PieceItem("신록의 장벽", 30),
    new PieceItem("에테르 환영", 30),
    new SwordItem("단검", 30),
    new SwordItem("그림자 검", 30),
    new SwordItem("제국의 명령", 30),
    new SwordItem("수호 천사", 300),
    new SwordItem("무한의 대검", 30),
    new SwordItem("드락사르의 황혼검", 30),
    new SwordItem("독사의 송곳니", 30)
  ],
  records: [],
  max_recordable_count: 10,
  repair_paper_recipe: [],
  recipes: {}
}
GameManager.resetSword = function() {
  this.jumpTo(0);
}
GameManager.upgradeSword = function() {
  this.jumpTo(this.sword_index +1)
}
GameManager.getSword = function(name) {
  const res = this.swords.find(value => value.name == name);
  if(res === undefined) throw new Error("There is no sword named arg-1.") 
  return res;
}
GameManager.isFound = function(sword_value) {
  switch (typeof sword_value) {
    case "number": return this.found_swords.includes(sword_value);
    case "string": return this.found_swords.includes(this.getSword(sword_value).index);
    default: throw new TypeError("Arg-1 must be sword_index: Number or sword_name: String.");
  }
}
GameManager.jumpTo = function(index) {
  if(index < 0 || index > this.max_upgradable_index) throw new RangeError("Sword can be upgrade in 0 ~ " + this.max_upgradable_index) + ".";
  if(!this.isFound(index)) this.found_swords.push(index);
  this.sword_index = index;
}
GameManager.canBeRepaired = function() {
  return this.repair_paper >= this.getCurrentSword().requiredRepairs;
}
GameManager.useRepairPair = function(count) {
  if(this.canBeRepaired()) {
    GameManager.repair_paper -= count;
    return true;
  }
  return false;
}
GameManager.getCurrentSword = function() {
  return this.swords[this.sword_index];
}
GameManager.appendSword = function(sword) {
  if(sword instanceof Sword) this.swords.push(sword);
  else throw new TypeError("Arg-1 must be Sword");
}
GameManager.calculateLoss = function(index) {
  return this.swords.filter((v, idx) => idx <= index).reduce((pre, cur) => pre += cur.cost, 0);
}
GameManager.saveItem = function(type, name, count) {
  const item = this.findItem(name, type);
  if(item === undefined) {
    switch (type) {
      case "piece":
        GameManager.inventory.push(new PieceItem(name, count));
        break;
      case "sword":
        GameManager.inventory.push(new SwordItem(name, count));
        break;
      default:
        throw new Error("Arg-1 must be 'piece' or 'sword'.");
    }
  } else {
    item.count += count;
  }
}
GameManager.savePiece = function(name, count) {
  this.saveItem("piece", name, count);
}
GameManager.saveSword = function(name, count) {
  this.saveItem("sword", name, count);
}
GameManager.subtractItem = function(type, name, count) {
  const item = this.findItem(name, type);
  if(item === undefined) return new Error("There is no such sword.");
  if(item.count < count) return false;
  item.count -= count
  return true;
  
}
GameManager.findItem = function(name, type) {
  if(type === undefined) return GameManager.inventory.find(value => value.name == name);
  return GameManager.inventory.find(value => value.type == type && value.name == name);
}
GameManager.sellSword = function(name) {
  if(this.subtractItem("sword", name, 1)) {
    this.renderInventory();
    this.changeGold(this.getSword(name).price);
  }
}
GameManager.renderGameInterFace = function() {

  $("#message-box").style.display = "none";

  const current_sword = this.getCurrentSword();
  $("#sword-image").src = current_sword.image;
  $("#sword-number").textContent = this.sword_index + "강";
  $("#sword-name").textContent = current_sword.name;
  $("#sword-prob").textContent = "강화 성공 확률: " + Math.floor(current_sword.prob *100) + "%";
  $("#sword-cost").textContent = "강화 비용: " + current_sword.cost + "원";
  $("#sword-price").textContent = "판매 가격: " + current_sword.price + "원";

  $("#sell-button").style.display = (this.sword_index == 0) ? "none" : "block";
  $("#save-button").style.display = (this.getCurrentSword().canSave) ? "block" : "none";
}
GameManager.makeSwordIcon = function(src, alt, type, name) {
  const div = $createElementWithClasses("div", "sword_icon", type);
  const img = new Image();
  img.src = src;
  img.alt = alt;
  div.appendChild(img);
  if(type == "sword") {
    const name_span = $createElementWithClasses("span", "sword_name");
    name_span.textContent = alt;
    div.appendChild(name_span)
  }
  return div;
}
GameManager.renderGameInformation = function() {
  const found = []
  for(let i=0; i<=this.max_upgradable_index;i++) {
    const value = this.swords[i];
    if(this.isFound(i)) {
      found.push(this.makeSwordIcon(value.image, value.name, "sword"))
    } else {
      found.push(this.makeSwordIcon("images/swords/unknown.png", "unknown", "unknown"))
    }
  }

  $("#found-swords").replaceChildren(...found);
  $("#found-sword-count").textContent = this.found_swords.length;

}
GameManager.makeHoverSellDiv = function(onclick) {
  const div = $createElementWithClasses("div", "hover_sell");
  const span = document.createElement("span");
  span.textContent = "판매 하기";
  div.appendChild(span);
  div.onclick = onclick;
  return div;
}
GameManager.makeInventoryArticle = function(src, name, count, sellFnc) {
  const article = $createElementWithClasses("article", "group");

  if(src === undefined) return article;

  const div = $createElementWithClasses("div", "item");
  const img = new Image();
  img.src = src;

  if(sellFnc !== undefined) {
    div.appendChild(this.makeHoverSellDiv(sellFnc));
  }

  div.appendChild(img);

  const pname = $createElementWithClasses("p", "item_name");
  pname.textContent = name;
  const pcount = $createElementWithClasses("p", "item_count");
  pcount.textContent = count;
  article.appendChildren(div, pname, pcount);

  return article;
}
GameManager.renderInventory = function() {
  const inner = [
    $createElementWithClasses("div", "underline", "bok"),
    this.makeInventoryArticle("images/repair_paper/복구권.png", "복구권", this.repair_paper), //복구권
    this.makeInventoryArticle()
  ];

  const pieces = this.inventory.filter(value => value.type == "piece" && value.count != 0);
  const swords = this.inventory.filter(value => value.type == "sword" && value.count != 0);
  pieces.sort((a, b) => a.count - b.count); // 조각은 갯수 순으로 정렬
  swords.sort((a, b) => this.getSword(a.name).index - this.getSword(b.name).index ) //검은 강화 순대로 정렬

  if(pieces.length != 0) inner.push($createElementWithClasses("div", "underline", "pie"))
  pieces.forEach(value => inner.push(this.makeInventoryArticle(`images/item/${value.name}.png`, value.name, value.count)))
  if(pieces.length%2 == 1) inner.push(this.makeInventoryArticle());
  if(swords.length != 0)inner.push($createElementWithClasses("div", "underline", "swo"))
  swords.forEach(value => inner.push(this.makeInventoryArticle(`images/swords/${value.name}.png`, value.name, value.count, () => this.sellSword(value.name))))
  if(swords.length%2 == 1) inner.push(this.makeInventoryArticle());
  $("#inventory-items").replaceChildren(...inner);
  
}
GameManager.makeMaterialSection = function(recipes) {
  const material = $createElementWithClasses("section", "material")

  if(recipes.length == 1) material.classList.add("one");

  for(const item of recipes) {
    const myitem = this.findItem(item.name, item.type);

    let mcount;
    if(item.type == "money") mcount = this.money;
    else if(myitem === undefined) mcount = 0;
    else mcount = myitem.count;

    if(item.type == "sword" && !this.isFound(item.name)) {
      material.appendChild(this.makeMaterialDiv("발견 안됨","unknown"));
    } else {
      material.appendChild(
        this.makeMaterialDiv(
          item.name,
          item.type,
          mcount,
          (item === undefined) ? 0 : item.count
        )
      );
    }
  }
  return material;
}
GameManager.makeMaterialDiv = function(item_name, item_type, curc, count) {

  const div = $createElementWithClasses("div", "item");

  const img = new Image();
  switch(item_type) {
    case "money":
    case "piece":
      img.src = `images/item/${item_name}.png`;
      break;
    case "sword":
      img.src = `images/swords/${item_name}.png`;
      break;
    case "unknown":
      img.src = "images/swords/unknown.png";
      break;
  }
  div.appendChild(img)
  if(item_type == "sword" || item_type == "unknown") {
    const name_span = $createElementWithClasses("span", "name");
    name_span.textContent = item_name;
    div.appendChild(name_span);
  }

  if(curc === undefined) return div;

  const count_span = $createElementWithClasses("span", "count");
  if(curc < count) count_span.classList.add("unable");

  /* 돈이면 "필요수량" 아니면 "가진갯수/필요수량" */
  count_span.textContent = (item_name == "돈") ? count : curc + "/" + count;
  div.appendChild(count_span);

  return div;
}
GameManager.makeGroupArticle = function(material, result, canMake, clickFunction) {

  const article = $createElementWithClasses("article", "group")

  article.appendChildren(material, result);
  
  const btn = document.createElement("button");
  btn.onclick = clickFunction;
  btn.textContent = "제작";
  btn.disabled = canMake;

  article.appendChild(btn);

  return article;

}
GameManager.makeResultSection = function(src, name, count)  {

  const result = $createElementWithClasses("section", "result");

  const img_div = $createElementWithClasses("div", "item");

  const img = new Image();
  img.src = src;

  const span = $createElementWithClasses("span", "name");
  span.textContent = name;

  img_div.appendChildren(img, span);


  /* 결과 아이템의 갯수 */
  if(count != null) {
    const countspan = $createElementWithClasses("span", "count");
    countspan.textContent = count;

    img_div.appendChild(countspan);
  }

  result.appendChild(img_div);

  return result;
}
GameManager.renderMaking = function() {

  const inner = [];

  /* 복구권 */
  const material = this.makeMaterialSection(this.repair_paper_recipe);

  const result = this.makeResultSection("images/repair_paper/복구권.png", "복구권", this.repair_paper)
  const article = this.makeGroupArticle(
    material, 
    result, 
    !this.canMake(this.repair_paper_recipe), 
    () => this.makeRepairPaper());

  inner.push(article);

  /* 워프권 */
  for(const [sword_name, recipe] of Object.entries(this.recipes)) {
    const material = this.makeMaterialSection(recipe);
    let result;
    if(this.isFound(sword_name))
      result = this.makeResultSection(`images/swords/${sword_name}.png`, sword_name)
    else
      result = this.makeResultSection(`images/swords/unknown.png`, "발견 안됨")
    const article = this.makeGroupArticle(
      material, 
      result, 
      !(this.canMake(recipe) && this.sword_index == 0), // 워프권은 0강이 아닐시 구매 불가
      () => GameManager.makeSword(sword_name));
    inner.push(article);
  }

  $("#recipes").replaceChildren(...inner);
}
GameManager.makeDroppedPieceDiv = function(name, count) {
  const div = document.createElement("div");

  const img = new Image();
  img.src = `images/item/${name}.png`;

  const span0 = $createElementWithClasses("span", "name");
  const span1 = $createElementWithClasses("span", "count");
  span0.innerHTML = name;
  span1.innerHTML = count;

  div.appendChildren(img, span0, span1)
  return div;
}
GameManager.renderFallMessage = function(...pieces) {

  if(pieces.length != 0 && !pieces.every(value => value instanceof PieceItem)) throw new TypeError("Args must be PieceItem")

  const pieces_box = $("#pieces");

  $("#loss").textContent = "손실: " + this.calculateLoss(this.sword_index) + "원";

  const ret = pieces.map(ele => this.makeDroppedPieceDiv(ele.name, ele.count));

  pieces_box.replaceChildren(...ret);

  if(this.canBeRepaired()) {
    $("#fix-button").style.display = "block";
    $("#required-count").textContent = `복구권 ${this.getCurrentSword().requiredRepairs}개로 복구할 수 있습니다. (${this.repair_paper}/${this.getCurrentSword().requiredRepairs})`;
    $("#required-count").classList.remove("red-text");
  } else {
    $("#fix-button").style.display = "none";
    $("#required-count").textContent = `복구권이 부족하여 복구할 수 없습니다. (${this.repair_paper}/${this.getCurrentSword().requiredRepairs})`;
    $("#required-count").classList.add("red-text");
  }
}
GameManager.gold_change_kef = [
  {opacity: '1', transform: 'translate(-30%, 0%)'}, 
  {opacity: '0', transform: 'translate(-30%, -70%)'}
];
GameManager.changeGold = function(number) {

  const gold_change_span = $("#gold-change");

  this.money += number;

  if(this.money < 0) {
    this.money = 0;
  }

  gold_change_span.textContent = ((number >= 0) ? "+" + number : number) + "원";

  gold_change_span.animate(
    this.gold_change_kef,
    {duration: 300, fill: "both"}
  );

  this.renderGold();

  return true;
}
GameManager.renderGold = function() {
  $("#gold-number").textContent = this.money;
}
GameManager.addRecord = function(sword, type) {
  if(sword instanceof Sword) this.swords.push(sword);
  else throw new TypeError("Arg-1 should be Sword");

  this.records.push({sword: sword, type: type});
  let idx = this.records.length - this.max_recordable_count;
  if(idx < 0) idx = 0;

  this.records = this.records.slice(idx);
  this.renderRecords();
}
GameManager.renderRecords = function () {
  const ret = this.records.map(rec => {
    const p = document.createElement("p");
    if(rec.type == "upgrade")
      p.textContent = `${rec.sword.name} 강화 -${rec.sword.cost}`;
    else if(rec.type == "sell")
      p.textContent =  `${rec.sword.name} 판매 +${rec.sword.price}`;
    else
    p.textContent =  "<알수없음>";
    return p;
  });

  $("#records").replaceChildren(...ret);
}
GameManager.changeBody = function(id) {
  $("#main-body").replaceChildren(document.importNode($("#" + id).content, true))
}
GameManager.showGameInterface = function() {
  this.changeBody("game-interface");
  this.renderGameInterFace();
}
GameManager.showGameInformation = function() {
  this.changeBody("game-information");
  this.renderGameInformation();
}
GameManager.showInventory = function() {
  this.changeBody("inventory");
  this.renderInventory();
}
GameManager.showMaking = function() {
  this.changeBody("making");
  this.renderMaking();
}
GameManager.popup_kef = [{opacity: '0'}, {opacity: '1'}];
GameManager.popupFallMessage = function(...pieces) {

  this.renderFallMessage(...pieces);

  const message_box = $("#message-box");
  message_box.style.display = "block";
  message_box.animate(
      this.popup_kef,
      {duration: 300, fill: "both"}
  );
}
GameManager.canMake = function(recipe) {
  for(const rec of recipe) {
    if(rec.type == "money") {
      if(this.money >= rec.count) continue;
      return false;
    }

    const item = this.findItem(rec.name, rec.type)

    if(item === undefined ||
      item.count < rec.count) //재료부족
      return false;
  }
  return true;
}
GameManager.makeWithRecipe = function(recipe) {
  if(!this.canMake(recipe)) return false;

  for(const item of recipe) {
    if(item.type == "money") this.changeGold(-item.count);
    else this.findItem(item.name, item.type).count -= item.count;
  }
  return true;
}
GameManager.lodding_kef = [{opacity: '0'}, {opacity: '1'}]
GameManager.hammer_kef = [{ transform: "translate(calc(-50% - 38.4765625px), -50%) rotate(0deg)", offset: 0, easing: "ease" },{ transform: "translate(calc(-50% - 38.4765625px), -50%) rotate(0.2turn)", offset: .5, easing: "ease" },{ transform: "translate(calc(-50% - 38.4765625px), -50%) rotate(0turn)", offset: 1}];
GameManager.animateLodding = function(duration, onfinish) {
  const lodding = $("#maker-window-lodding");
    const hammer = $("#maker-window-lodding div");

    lodding.style.display = "block";

    
    lodding.animate(
      this.lodding_kef,
      {duration: duration/2}
    );

    hammer.animate(
      this.hammer_kef,
      {duration: duration, iterations: 2}
    )
    
    setTimeout(() => {
      onfinish();
      lodding.animate(
        this.lodding_kef,
        {duration: duration/2, direction: "reverse"}
      ).onfinish = () => {
        lodding.style.display = "none";
      };
    }, duration);
}
GameManager.makeSword = function(sword_name) {
  if(this.makeWithRecipe(this.recipes[sword_name])) {
    const sword = this.swords.find(value => value.name == sword_name);
    const index = sword.index;
    this.jumpTo(index);
    this.animateLodding(800, () => this.showGameInterface());
  }
}
GameManager.makeRepairPaper = function() {
  if(this.makeWithRecipe(this.repair_paper_recipe)) {
    this.repair_paper += 1;
    this.animateLodding(450, () => this.renderMaking());
  }
}
GameManager.init = function(start) {
  if(start !== undefined) {
    this.jumpTo(start);
  } else this.resetSword();
  this.showGameInterface();
  this.renderGold();
}

/* Footer button */
$("#main-game-button").addEventListener("click", () => {
  GameManager.showGameInterface();
})
$("#information-button").addEventListener("click", () => {
  GameManager.showGameInformation();
})
$("#inventory-button").addEventListener("click", () => {
  GameManager.showInventory();
})
$("#making-button").addEventListener("click", () => {
  GameManager.showMaking();
})