// Setup basic express server
var debug = false;

var port = debug ? 7777 : 27016;

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var players = [];

var pot = {

}

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
    socket.emit("You'reIn",player);
  });

  socket.on('SendControls', function (data) {
    for(var i in players) {
      if(players[i].id == socket.id) {
        players[i].move = data;
      }
    }
  });

  socket.on('DoTask', function (taskName) {
    console.log(taskName);
    var player = getPlayerByID(socket.id);
    player.action = taskName;
  });

  socket.on('disconnect', function () {
    for(var i = 0; i < players.length;i++) {
      if(players[i].id == socket.id) {
        io.emit("Rip", players[i].cid);
        players.splice(i,1);
      }
    }
    
  });
});

function newPlayer (id, name) {
  return {
    id: id,
    type: "player",
    money: 1000,
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