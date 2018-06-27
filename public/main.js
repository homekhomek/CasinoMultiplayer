var socket = io.connect("http://141.126.155.58:7777");

socket.emit('Joined',null);

var loginPage = document.getElementById("Login"),
    gamePage = document.getElementById("slidecontent"),
    navBar = document.getElementById("files"),
    players = [],
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