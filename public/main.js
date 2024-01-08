var socket = io.connect("http://127.0.0.1:7777");

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
    lastSpin = 0
    perc = 0
    invperc = 0,
    startRun = 0,
    opaque = true;

function start () {
 var name = document.getElementById("name").value;
 socket.emit('Starting',name);
}

socket.on("You'reIn", function(player, lastSpins){
  loginPage.style.display = "none";
  gamePage.style.display = "block";
  navBar.style.display = "block";
  document.getElementById("mydiv").style.display = "block";
  myplayer = player;
  sessionStorage.setItem("username", myplayer.username);
  lastSpin = Date.now() - lastSpins;
});

socket.on('CurrentCasino', function(data){
  pot = data.pot;
  potTotal = data.total;
  myPlayer = data.myPlayer;
  players = data.players;
  document.getElementById("bigwin").innerHTML = getPercent(myPlayer.username);
  document.getElementById("biglose").innerHTML = invperc;
  document.getElementById("ammountyouhave").innerHTML = "You have $" + myPlayer.money;
  document.getElementById("currmoney").innerHTML = "You have $" + myPlayer.money;
  document.getElementById("curramount").innerHTML = "Your pot contribution: $" + getMoneyInPot(myPlayer.username);
  generatePotList();
});

socket.on('Current', function(data){
  myPlayer = data.myPlayer;
  players = data.players;
  document.getElementById("currmoney").innerHTML = "You have $" + myPlayer.money;
  document.getElementById("ammountyouhave").innerHTML = "You have $" + myPlayer.money;
});

socket.on('Caught', function(data){
  alert("You/your runner got CAUGHT!");
});

socket.on('CurrentDrugs', function(data){
  if(data.myPlayer.running && !myPlayer.running) {
    document.getElementById("loaderbar").style.transition = "margin-left 10s linear";
    document.getElementById("loaderbar").style.marginLeft = "0";
  }
  else if(!data.myPlayer.running && myPlayer.running) {
    document.getElementById("loaderbar").style.transition = "none";
    document.getElementById("loaderbar").style.marginLeft = "-105%";
  }

  orders = data.orders;
  myPlayer = data.myPlayer;
  players = data.players;
  document.getElementById("currmoney").innerHTML = "You have $" + myPlayer.money;
  if(myPlayer.hasOrder) {
    var theButton = document.getElementById("createOrder");
    theButton.onclick = deleteOrder;
    theButton.style.backgroundColor = "#C03232";
    theButton.style.borderColor = "#C03232";
    theButton.innerText = "Delete Current";
  }
  else {
    var theButton = document.getElementById("createOrder");
    theButton.onclick = createOrder;
    theButton.style.backgroundColor = "#00c12d";
    theButton.style.borderColor = "#00c12d";
    theButton.innerText = "Create";
  }
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
    if(orders[i].ordererId != myPlayer.id && !orders[i].beingRan) {
      orderList[i] = {
        payout: orders[i].runnerPayout,
        risk: orders[i].risk,
        id: orders[i].id
      };
    }
  }

  orderList.sort(function(a, b) {
    return b.payout  - a.payout;
  });

  document.getElementById("runsHere").innerHTML = "";
  for(i = 0; i < orderList.length; i++){
    document.getElementById("runsHere").innerHTML += "<div class='runItem'><p>Payout: $" + orderList[i].payout + "</p><p>Risk: " + orderList[i].risk + "%</p><button class='runButton' onclick='runOrder(\"" + orderList[i].id + "\")'>RUN!</button></div>"
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

function deleteOrder() {
  socket.emit("DeleteOrder","lmao");
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
  perc = potTotal != 0 ? ((getMoneyInPot(username) / potTotal) * 100).toFixed(2) : 0;
  invperc = (100-perc).toFixed(2) + "%";
  return perc + "%";
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
    document.getElementById("file3").setAttribute("class", "");
    document.getElementById("file1").setAttribute("class", "lifocused");
  }
 if(slide == 2){
  $("#slidecontent").css("margin-left", '-100%');
  document.getElementById("file1").setAttribute("class", "");
  document.getElementById("file3").setAttribute("class", "");
  document.getElementById("file2").setAttribute("class", "lifocused");
  }
  if(slide == 3){
    $("#slidecontent").css("margin-left", '-200%');
    document.getElementById("file1").setAttribute("class", "");
    document.getElementById("file2").setAttribute("class", "");
    document.getElementById("file3").setAttribute("class", "lifocused");
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
  var productionCost = priceFromDrug(drugType).production;

  payout *= drugAmount;
  risk *= drugAmount;

  payout *= multiplierFromCountry(drugPlace).cost;
  risk *= multiplierFromCountry(drugPlace).risk;

  var runnerPayout = Math.floor((payout/100)*.75) *100 ;
  var orderPayout =Math.floor((payout/100)*.25) *100;

  document.getElementById("outputDrugs").innerHTML = "<p>Payout for you: $" + orderPayout + "</p><p>Payout for runner: $" + runnerPayout + "</p><p>Risk for runner: " + risk.toFixed(2) + " %</p><p>Production Cost(Flatrate): $" + productionCost + "</p>";

}

function priceFromDrug(drug) {
  if( drug == "weed") {
    return {cost:100, risk: .4, production:100};
  }
  else if (drug == "coke") {
    return {cost:300, risk: 1.1, production:200};
  }
  else if (drug == "heroin") {
    return {cost:600, risk: 2, production:400};
  }
  else if (drug == "meth") {
    return {cost:1000, risk: 3.8, production:600};
  }
}

function multiplierFromCountry(country) {
  if( country == "america") {
    return {cost:1, risk: 3};
  }
  else if (country == "canada") {
    return {cost:2, risk: 6};
  }
  else if (country == "mexico") {
    return {cost:3, risk: 9};
  }
  else if (country == "china") {
    return {cost:8, risk: 24};
  }
}

function runOrder(id){
  socket.emit("Run", id);
}

dragElement(document.getElementById("mydiv"));

function dragElement(elmnt) {
  var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  if (document.getElementById(elmnt.id + "header")) {
    document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
  } else {
    elmnt.onmousedown = dragMouseDown;
  }

  function dragMouseDown(e) {
    e = e || window.event;
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e = e || window.event;
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

function toggleopacity() {
  if(opaque){
    document.getElementById("toggleopacity").innerHTML = "<i class='fa fa-adjust' aria-hidden='true'></i>";
    document.getElementById("mydiv").style.opacity = ".25"; 
  }
  else {
    document.getElementById("toggleopacity").innerHTML = "<i class='fa fa-circle' aria-hidden='true'></i>";
    document.getElementById("mydiv").style.opacity = "1"; 
  }
  opaque = !opaque;
}

function sendchat() {
  socket.emit("Chat", $("#textmsg").val());
}

socket.on("NewChat", function(username, message){
  if(username == sessionStorage.getItem("username")){
    document.getElementById("chat").innerHTML += "<div class='mychat'>" + username + ": " + message + "</div>";
  }
  else {
    document.getElementById("chat").innerHTML += "<div class='notmychat'>" + username + ": " + message + "</div>";
  };
  document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
});
