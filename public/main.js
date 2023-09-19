var socket = io.connect("http://127.0.0.1:7777");

function daySlide(){
    document.getElementById("h1T").style.paddingTop = "3vh";
    document.getElementById("h1T").style.margin = "0 3vh";
    document.getElementById("h1T").style.fontSize = "36px";
}