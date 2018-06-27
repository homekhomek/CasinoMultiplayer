// Setup basic express server
var debug = false;

var port = debug ? 7777 : 27016;

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var players = [];

var lastSpin = Date.now();
var spinning = false;

var potTotal = 0;

var pot = {

};

setInterval( function() {
  lastSpin = Date.now();
  spin();
},30000);

server.listen(7777, function () {
  console.log('Server listening at port %d', port);
});
// Routing
app.use(express.static(__dirname + '/public'));


io.on('connection', function (socket) {
  
console.log('User Connected');
  // when the client emits 'add user', this listens and executes
  
  socket.on('Starting', function (name) {
    var player = newPlayer(socket.id, name);
    players.push(player);
    socket.emit("You'reIn",player, Date.now() - lastSpin);
    sendOut("casino");
  });

  socket.on('SendControls', function (data) {
    for(var i in players) {
      if(players[i].id == socket.id) {
        players[i].move = data;
      }
    }
  });

  socket.on('Color', function (data) {
    var player = getPlayerByID(socket.id);
    if(player) {
      player.color = data;
    }

  });

  socket.on('BetMore', function (bet) {
    if(!spinning) {
      var player = getPlayerByID(socket.id);
      if(player) {
        if(!pot[player.username]) {
          pot[player.username] = 0;
        }

        if(player.money >= 100) {
          player.money -= 100;
          pot[player.username] += 100;
          potTotal += 100;
          sendOut("casino");
        }
      }
    }
  });

  socket.on('BetLess', function (bet) {
    if(!spinning) {
      var player = getPlayerByID(socket.id);
      if(pot[player.username] >= 100) {
        player.money += 100;
        pot[player.username] -= 100;
        potTotal -= 100;
        sendOut("casino");
      }
    }
  });

  socket.on('disconnect', function () {
    for(var i = 0; i < players.length;i++) {
      if(players[i].id == socket.id) {
        if(pot[players[i].username])
          potTotal -= pot[players[i].username];

        pot[players[i].username] = 0;
        io.emit("Rip", players[i].id);
        players.splice(i,1);
        sendOut("casino");
      }
    }
    
  });
});

function spin() {
  spinning=true;
  var possibleArray = [];
  for(var property in pot) {
    if (pot.hasOwnProperty(property) ) {
      var amount = property;
      for(var o = 0; o < pot[property]/100;o++) {
        possibleArray.push(amount);
      }
    }
  }



  var spinList = [];
  for(var i = 0; i < 120; i++) {
    var randomGuy = possibleArray[getRandomInt(0,possibleArray.length-1)];
    spinList.push({username: randomGuy, color: getColorByUsername(randomGuy)});
  }

  var winner = spinList[99].username;

  console.log(winner);

  for(var i = 0; i < players.length;i++) {
    sendByID(players[i].id,"Spin",spinList);
  }

  setTimeout(function () {
    spinning= false;
    for(var i in players) {
      if(players[i].username == winner)
      {
        players[i].money += potTotal;
        pot = {};
        potTotal = 0;
        sendOut();
        
      }
    }
  }, 11000);
 
}


function newPlayer (id, name) {
  return {
    id: id,
    username: name,
    type: "player",
    money: 1000,
    color: "#ddd"
  };
}

function sendOut(type) {
  if(type == "casino") {
    for(var i = 0; i < players.length;i++) {
      sendByID(players[i].id,"CurrentCasino",{myPlayer: players[i], pot: pot, total: potTotal, players: players});
    }
  }
  else if (type == "drugs") {
    for(var i = 0; i < players.length;i++) {
      sendByID(players[i].id,"CurrentCasino",{myPlayer: players[i], pot: pot, total: potTotal, players: players});
    }
  }
  else if (type == "players") {
    sendByID(players[i].id,"CurrentCasino",{players: players});
  }
}

function updatePlayer(player, loc) {
  switch(player.action) {
    case "tree":
      var treeTask = getTaskByName(loc,"tree");
      console.log("GotTask");
      if(treeTask != undefined) {
        if(player.treeStuff.turnsChopping == 5) {
          player.action = "";
          player.treeStuff.turnsChopping = 0;
          player.actionMSG = "Done chopping!";

          console.log(TREE.getItemByTree(treeTask.type));

        }
        else {
          player.treeStuff.turnsChopping += 1;
          player.actionMSG = "Chopping...";
          console.log("Chopping...");
        }
      }
      else
      {
        player.action = "";
        player.treeStuff.turnsChopping = 0;
      }


    break
  }
}

function sendByID(id, name,  data) {
  io.sockets.connected[id].emit(name,data);
}

function sendUpdates (myplayer){
  var currentLoc = getLoc(myplayer);

  updatePlayer(myplayer,currentLoc);

  io.sockets.connected[myplayer.id].emit('ViewUpdate',myplayer, currentLoc);

  myplayer.actionMSG = "";
}

function getLoc(player) {
  return world[player.loc];
}

//io.sockets.connected[myplayer.id].emit('ViewUpdate', myplayer,bundle,buildingbundle);

function compact(player) {
  return {
    x: player.x,
    y: player.y,
    health: player.health,
    maxhealth: player.maxhealth,
    slash: player.slash,
    move:  player.move,
    cid: player.cid
  };
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hasWhiteSpace(str) {
  return str.indexOf(' ') >= 0;
}

function getPlayerByCID(cid) {
  for(var i in players) {
    if(players[i].cid == cid)
      return players[i];
  }
}

function getPlayerByID(id) {
  for(var i in players) {
    if(players[i].id == id)
      return players[i];
  }
}

function getColorByUsername(username) {
  for(var i in players) {
    if(players[i].username == username)
      return players[i].color;
  }
}

function genKey() {
  var key = "";
  for(var o = 0 ; o< 40; o++) {
    key += String(getRandomInt(0,9));
    
  }
  return key;
}

function getTaskByName(loc, name) {
  for(var i in loc.tasks) {
    if(loc.tasks[i].name == name)
      return loc.tasks[i];
  }
}

function buildWorld () {
  var currentLoc;
  for(var i = 0; i < loc.length; i++) {
    currentLoc = loc[i];
    currentLoc.drops = [];

    world[i] = currentLoc;
  }
  console.log("Built World");
}