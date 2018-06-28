var socket = io.connect("http://localhost:7777");

socket.emit('Joined',null);

var loginPage = document.getElementById("Login"),
    gamePage = document.getElementById("slidecontent"),
    navBar = document.getElementById("files"),
    players = [],
    orders = [],
    pot = {},
    potTotal = 0,
    myPlayer = {},
    potList = [],
    lastSpin = 0;
  
    

function start () {
 var name = document.getElementById("name").value;
 socket.emit('Starting',name);
}

socket.on("You'reIn", function(player, lastSpins){
  loginPage.style.display = "none";
  gamePage.style.display = "block";
  navBar.style.display = "block";
  myplayer = player;
  lastSpin = Date.now() - lastSpins;
});

socket.on('CurrentCasino', function(data){
  pot = data.pot;
  potTotal = data.total;
  myPlayer = data.myPlayer;
  players = data.players;
  document.getElementById("bigwin").innerHTML = getPercent(myPlayer.username);
  document.getElementById("biglose").innerHTML = "lol kys";
  document.getElementById("ammountyouhave").innerHTML = "You have $" + myPlayer.money;
  document.getElementById("curramount").innerHTML = "Your pot contribution: $" + getMoneyInPot(myPlayer.username);
  generatePotList();
});

socket.on('CurrentDrugs', function(data){
  orders = data.orders;
  myPlayer = data.myPlayer;
  players = data.players;
  generateOrdersList();
});

function betMore () {
  socket.emit('BetMore',"");
}

function betLess () {
  socket.emit('BetLess',"");
}

socket.on('Rip', function(cid){
  for(var i in players) {
    if(players[i].cid = cid) {
      players.splice(i, 1);
    }
  }
});

function getMoneyInPot(username){
  if(pot[username]) {
    return pot[username];
  }
  else {
    return 0;
  }
}

function changeColor(num){
  socket.emit("Color", $("#c" + num + "").css("background-color"));
}

function generateOrdersList(){
  var orderList = [];
  for(i = 0; i < orders.length; i++){
    if(orders[i].ordererId != myPlayer.id) {
      orderList[i] = {
        payout: orders[i].runnerPayout,
        risk: orders[i].risk,
        id: orders[i].ordererId
      };
    }
  }

  orderList.sort(function(a, b) {
    return b.payout  - a.payout;
  });

  document.getElementById("runsHere").innerHTML = "";
  for(i = 0; i < orderList.length; i++){
    document.getElementById("runsHere").innerHTML += "<div class='runItem'>Payout: $" + orderList[i].payout + " Risk: %" + orderList[i].risk + " <button class='runButton' onclick='runOrder(" + orderList[i].id + ")'>RUN!</button></div>"
  }
}

function createOrder() {
  var fromPlaceEl = document.getElementById("fromPlace");
  var drugPlace = fromPlaceEl.options[fromPlaceEl.selectedIndex].value;

  var drugTypeEl = document.getElementById("drugType");
  var drugType = drugTypeEl.options[drugTypeEl.selectedIndex].value;

  var drugAmount = Math.floor(document.getElementById("drugsAmount").value);

  socket.emit("CreateOrder", {drugType:drugType, drugAmount:drugAmount, drugPlace:drugPlace});
}

function generatePotList(){
  for(i = 0; i < players.length; i++){
    potList[i] = {
      username: players[i].username,
      money: getMoneyInPot(players[i].username),
      percent: getPercent(players[i].username)
    }
  }
  potList.sort(function(a, b) {
    return b.money  - a.money;
  });
  document.getElementById("tbodusers").innerHTML = "";
  for(i = 0; i < potList.length; i++){
    document.getElementById("tbodusers").innerHTML += "<tr><td>" + potList[i].username + "</td><td>" + potList[i].money + "</td><td>" + potList[i].percent + "</td></tr>"
  }
}

function getPercent(username) {
  return potTotal != 0 ? ((getMoneyInPot(username) / potTotal) * 100).toFixed(2) + "%" : "0%";
}

setInterval(function(){
  document.getElementById("loadFill").style.width = Number(((Date.now() - lastSpin) / 30000) * document.getElementById("loadBar").offsetWidth) + "px";
}, 1000/45);

socket.on("Spin", function(inf){
  lastSpin = Date.now();
  genDivs(inf);
});

function genDivs(inf) {
  document.getElementById("innerSpin").innerHTML = "";
  for(i = 0; i < inf.length; i++){
    document.getElementById("innerSpin").innerHTML += "<div class='spinItem' style='background-color:" + inf[i].color + ";'>" + inf[i].username + "</div>"
  }
  spin();
}

function spin(){
  document.getElementById("innerSpin").style.opacity = "1";
  setTimeout(function(){
    document.getElementById("innerSpin").style.marginLeft = "-6000px";
  },500);
  setTimeout(function(){
    document.getElementById("innerSpin").style.opacity = "0";
    document.getElementById("innerSpin").style.marginLeft = "0px";
  },10000);
}

function focuss(slide) {
  if(slide == 1){
    $("#slidecontent").css("margin-left", '0');
    document.getElementById("file2").setAttribute("class", "");
    document.getElementById("file1").setAttribute("class", "lifocused");
  }
 if(slide == 2){
  $("#slidecontent").css("margin-left", '-100%');
  document.getElementById("file1").setAttribute("class", "");
  document.getElementById("file2").setAttribute("class", "lifocused");
  }
}

function calculateDrug() {
  var fromPlaceEl = document.getElementById("fromPlace");
  var drugPlace = fromPlaceEl.options[fromPlaceEl.selectedIndex].value;

  var drugTypeEl = document.getElementById("drugType");
  var drugType = drugTypeEl.options[drugTypeEl.selectedIndex].value;

  var drugAmount = Math.floor(document.getElementById("drugsAmount").value);

  var payout = priceFromDrug(drugType).cost;
  var risk = priceFromDrug(drugType).risk;

  payout *= drugAmount;
  risk *= drugAmount;

  payout *= multiplierFromCountry(drugPlace).cost;
  risk *= multiplierFromCountry(drugPlace).risk;

  var runnerPayout = Math.floor((payout/100)*.75) *100 ;
  var orderPayout =Math.floor((payout/100)*.25) *100;

  document.getElementById("outputDrugs").innerHTML = "Payout for you: $" + orderPayout + "<br>Payout for runner: $" + runnerPayout + "<br>Risk for runner: %" + risk.toFixed(2);

}

function priceFromDrug(drug) {
  if( drug == "weed") {
    return {cost:100, risk: .1};
  }
  else if (drug == "coke") {
    return {cost:300, risk: .5};
  }
  else if (drug == "heroin") {
    return {cost:600, risk: 1};
  }
  else if (drug == "meth") {
    return {cost:1000, risk: 2};
  }
}

function multiplierFromCountry(country) {
  if( country == "america") {
    return {cost:1, risk: 1};
  }
  else if (country == "canada") {
    return {cost:2, risk: 1.5};
  }
  else if (country == "mexico") {
    return {cost:3, risk: 4};
  }
  else if (country == "china") {
    return {cost:8, risk: 10};
  }
}
