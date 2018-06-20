var socket = io.connect("http://141.126.155.58:7777");

socket.emit('Joined',null);

var loginPage = document.getElementById("Login"),
    gamePage = document.getElementById("Game"),
    myplayer;

function start () {
 var name = document.getElementById("name").value;
 socket.emit('Starting',name);
}

socket.on("You'reIn", function(player){
  loginPage.style.display = "none";
  gamePage.style.display = "inline-block";

  myplayer = player;

});

socket.on('Rip', function(cid){
  for(var i in players) {
    if(players[i].cid = cid) {
      players.splice(i, 1);
    }
  }
});
