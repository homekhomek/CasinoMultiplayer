var debug = true;

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

var orders = [];

setInterval(function() {
    lastSpin = Date.now();
    spin();
}, 30000);

server.listen(7777, function() {
    console.log('Server listening at port %d', port);
});
// Routing
app.use(express.static(__dirname + '/public'));


io.on('connection', function(socket) {

    console.log('User Connected');
    // when the client emits 'add user', this listens and executes

    socket.on('Starting', function(name) {
        var player = newPlayer(socket.id, name);
        players.push(player);
        socket.emit("You'reIn", player, Date.now() - lastSpin);
        sendOut("casino");
        sendOut("drugs");
    });

    socket.on('SendControls', function(data) {
        for (var i in players) {
            if (players[i].id == socket.id) {
                players[i].move = data;
            }
        }
    });

    socket.on('Color', function(data) {
        var player = getPlayerByID(socket.id);
        if (player) {
            player.color = data;
        }

    });

    socket.on('DeleteOrder', function(data) {
        var player = getPlayerByID(socket.id);

        if (player.hasOrder) {
            for (var i = 0; i < orders.length; i++) {
                if (orders[i].ordererId == player.id) {
                    orders.splice(i, 1);
                    player.hasOrder = false;
                    sendOut("drugs");
                }
            }
        }

    });

    socket.on('CreateOrder', function(data) {

        var player = getPlayerByID(socket.id);

        if (!player.hasOrder && player.money >= priceToRun(data.drugType)) {
            player.money -= priceToRun(data.drugType);
            var drugAmount = Math.floor(data.drugAmount);

            var payout = priceFromDrug(data.drugType).cost;
            var risk = priceFromDrug(data.drugType).risk;

            payout *= drugAmount;
            risk *= drugAmount;

            payout *= multiplierFromCountry(data.drugPlace).cost;
            risk *= multiplierFromCountry(data.drugPlace).risk;

            var runnerPayout = Math.floor((payout / 100) * .75) * 100;
            var orderPayout = Math.floor((payout / 100) * .25) * 100;

            var order = {
                id: genKey(),
                runnerPayout: runnerPayout,
                orderPayout: orderPayout,
                risk: risk.toFixed(2),
                ordererId: socket.id,
                beingRan: false
            };
            player.hasOrder = true;


            orders.push(order);
            sendOut("drugs");
        }

    });

    socket.on('Chat', function(msg) {
        var player = getPlayerByID(socket.id);
        console.log(msg);

        sendOutMsg(player.username, msg);
    });

    socket.on('Run', function(id) {
        var player = getPlayerByID(socket.id);
        var order = null;
        for (var i = 0; i < orders.length; i++) {
            if (orders[i].id == id) {
                order = orders[i];
            }
        }
        var godfather = getPlayerByID(order.ordererId);

        if (order != null && !order.beingRan && !player.running) {
            player.running = true;
            order.beingRan = true;
            sendOut("drugs");
            setTimeout(function() {
                var theRoll = getRandomInt(0, 10000);
                if (theRoll <= order.risk * 100) {
                    player.money = Math.min(player.money, 1000);
                    player.running = false;
                    godfather.hasOrder = false;
                    sendByID(player.id, "Caught", "get shit on");
                    sendByID(godfather.id, "Caught", "get shit on");
                    for (var i = 0; i < orders.length; i++) {
                        if (orders[i].id == id) {
                            orders.splice(i, 1);
                        }
                    }
                    sendOut("drugs");
                    sendOut("players");
                } else {
                    player.money += order.runnerPayout;
                    godfather.money += order.orderPayout;
                    player.running = false;
                    godfather.hasOrder = false;
                    for (var i = 0; i < orders.length; i++) {
                        if (orders[i].id == id) {
                            orders.splice(i, 1);
                        }
                    }
                    sendOut("drugs");
                    sendOut("players");
                }
            }, 10000);
        }
    });

    socket.on('BetMore', function(bet) {
        if (!spinning) {
            var player = getPlayerByID(socket.id);
            if (player) {
                if (!pot[player.username]) {
                    pot[player.username] = 0;
                }

                if (player.money >= 100) {
                    player.money -= 100;
                    pot[player.username] += 100;
                    potTotal += 100;
                    sendOut("casino");
                }
            }
        }
    });

    socket.on('BetLess', function(bet) {
        if (!spinning) {
            var player = getPlayerByID(socket.id);
            if (pot[player.username] >= 100) {
                player.money += 100;
                pot[player.username] -= 100;
                potTotal -= 100;
                sendOut("casino");
            }
        }
    });

    socket.on('disconnect', function() {
        for (var i = 0; i < players.length; i++) {
            if (players[i].id == socket.id) {
                if (pot[players[i].username])
                    potTotal -= pot[players[i].username];
                for (var u = 0; i < orders.length; u++) {
                    if (orders[u].ordererId == socket.id) {
                        orders.splice(u, 1);
                    }
                }

                pot[players[i].username] = 0;
                io.emit("Rip", players[i].id);
                console.log(players);
                players.splice(i, 1);
                console.log(players);
                sendOut("casino");
                sendOut("drugs");
                sendOut("players");
            }
        }

    });
});

function spin() {
    spinning = true;
    var possibleArray = [];
    for (var property in pot) {
        if (pot.hasOwnProperty(property)) {
            var amount = property;
            for (var o = 0; o < pot[property] / 100; o++) {
                possibleArray.push(amount);
            }
        }
    }
    var spinList = [];
    for (var i = 0; i < 120; i++) {
        var randomGuy = possibleArray[getRandomInt(0, possibleArray.length - 1)];
        spinList.push({
            username: randomGuy,
            color: getColorByUsername(randomGuy)
        });
    }

    var winner = spinList[99].username;

    console.log(winner);

    for (var i = 0; i < players.length; i++) {
        sendByID(players[i].id, "Spin", spinList);
    }

    setTimeout(function() {
        spinning = false;
        for (var i in players) {
            if (players[i].username == winner) {
                players[i].money += potTotal;
                pot = {};
                potTotal = 0;
                sendOut("casino");

            }
        }
    }, 11000);

}


function newPlayer(id, name) {
    return {
        id: id,
        username: name,
        type: "player",
        money: 1000,
        color: "#ddd",
        hasOrder: false,
        running: false
    };
}

function sendOut(type) {
    if (type == "casino") {
        for (var i = 0; i < players.length; i++) {
            if (io.sockets.connected[players[i].id]) {
                sendByID(players[i].id, "CurrentCasino", {
                    myPlayer: players[i],
                    pot: pot,
                    total: potTotal,
                    players: players
                });
            }
        }
    } else if (type == "drugs") {
        for (var i = 0; i < players.length; i++) {
            if (io.sockets.connected[players[i].id]) {
                sendByID(players[i].id, "CurrentDrugs", {
                    myPlayer: players[i],
                    orders: orders,
                    players: players
                });
            }

        }
    }
    for (var i = 0; i < players.length; i++) {
        if (io.sockets.connected[players[i].id]) {
            sendByID(players[i].id, "Current", {
                myPlayer: players[i],
                players: players
            });
        }
    }
}

function sendOutMsg(name, msg) {
    for (var i = 0; i < players.length; i++) {
        io.sockets.connected[players[i].id].emit('NewChat', name, msg);
    }
}

function sendByID(id, name, data) {
    io.sockets.connected[id].emit(name, data);
}

function sendUpdates(myplayer) {
    var currentLoc = getLoc(myplayer);

    updatePlayer(myplayer, currentLoc);

    io.sockets.connected[myplayer.id].emit('ViewUpdate', myplayer, currentLoc);

    myplayer.actionMSG = "";
}

function getLoc(player) {
    return world[player.loc];
}

function compact(player) {
    return {
        x: player.x,
        y: player.y,
        health: player.health,
        maxhealth: player.maxhealth,
        slash: player.slash,
        move: player.move,
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
    for (var i in players) {
        if (players[i].cid == cid)
            return players[i];
    }
}

function getPlayerByID(id) {
    for (var i in players) {
        if (players[i].id == id)
            return players[i];
    }
}

function getColorByUsername(username) {
    for (var i in players) {
        if (players[i].username == username)
            return players[i].color;
    }
}

function genKey() {
    var key = "";
    for (var o = 0; o < 40; o++) {
        key += String(getRandomInt(0, 9));

    }
    return key;
}

function priceFromDrug(drug) {
    if (drug == "weed") {
        return {
            cost: 100,
            risk: .4
        };
    } else if (drug == "coke") {
        return {
            cost: 300,
            risk: 1.1
        };
    } else if (drug == "heroin") {
        return {
            cost: 600,
            risk: 2
        };
    } else if (drug == "meth") {
        return {
            cost: 1000,
            risk: 3.8
        };
    }
}

function priceToRun(drug) {
    if (drug == "weed") {
        return 100;
    } else if (drug == "coke") {
        return 200;
    } else if (drug == "heroin") {
        return 400;
    } else if (drug == "meth") {
        return 600;
    }
}

function multiplierFromCountry(country) {
    if (country == "america") {
        return {
            cost: 1,
            risk: 3
        };
    } else if (country == "canada") {
        return {
            cost: 2,
            risk: 6
        };
    } else if (country == "mexico") {
        return {
            cost: 3,
            risk: 9
        };
    } else if (country == "china") {
        return {
            cost: 8,
            risk: 24
        };
    }
}