
var app= require('express')();
var http= require("http").createServer(app);
var io= require('socket.io')(http);
var fs=require('fs');
var gameControler=require('./gameControlServer.js');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');

const MAX_CHAT_HISTORY=160;
const FRAME_INTERVAL=15;

const KEYINPUT=['w','a','s','d'];

let chathistory=new LinkedList();

var lastFrameTime=0;

app.get('/', (req,res) =>{ res.sendFile(__dirname+ "/fighter_index.html");});

http.listen(13531, () => { console.log('listening on *:13531');});

var gamerun=setInterval(runFrame,FRAME_INTERVAL);

io.sockets.on('connection', function (socket) {
    let socketId = socket.id;
    let clientIp = socket.request.connection.remoteAddress;

  
    let newman=addNewUser(socketId,clientIp);  
    if(newman.connected==false){
        console.log('new player'+socketId+' connected : '+clientIp);
        newman.connected=true;
        newman.type=1;
    }
        //sendUserlist();
});


io.on('connection',(socket)=>{
    let socketId = socket.id;
    let clientIp = socket.request.connection.remoteAddress;
    let player=findUserByClientIp(clientIp);
    socket.on('disconnect',()=>{
        if(player.connected==true){
            console.log('user disconnected : '+player.clientIp);
            //processMessage("유저 " + player.nickname+" (이)가 나갔습니다.");
            player.connected=false;
            player.type=0;
            //sendUserlist();
            sendUserInitData();
        }
 
    });  

});

io.on('connection', (socket) => {
    let socketId = socket.id;
    let clientIp = socket.request.connection.remoteAddress;
    let player=findUserByClientIp(clientIp);
    socket.on('keydown', (keyvalue) => {
        if(KEYINPUT.includes(keyvalue) && player!==undefined){
                player.pressedKey.set(keyvalue,1);
            
        }
    });
});

io.on('connection', (socket) => {
    let socketId = socket.id;
    let clientIp = socket.request.connection.remoteAddress;
    let player=findUserByClientIp(clientIp);
    socket.on('keyup', (keyvalue) => {
        if(KEYINPUT.includes(keyvalue) && player!==undefined){
            player.pressedKey.set(keyvalue,0);
        }
    });
});

//게임 준비 신호
io.on('connection', (socket) => {
    let socketId = socket.id;
    let clientIp = socket.request.connection.remoteAddress;
    let player=findUserByClientIp(clientIp);
    socket.on('gameReady', (msg) => {
        player.connected=true;
        player.type=1;
        console.log('user Ready : '+player.clientIp);
        sendUserInitData();
    });
});


//랠리 포인트(목적지) 지정
io.on('connection', (socket) => {
    let socketId = socket.id;
    let clientIp = socket.request.connection.remoteAddress;
    let player=findUserByClientIp(clientIp);
    socket.on('rl', (coord) => {
        player.setDestination(coord);
    });
});

//총 발사
io.on('connection', (socket) => {
    let socketId = socket.id;
    let clientIp = socket.request.connection.remoteAddress;
    let player=findUserByClientIp(clientIp);
    socket.on("bs", (data) => {
        if(player.type>0){
            player.shootBullet(data);
        }
        
    });
});
/*
function sendUserlist(){

    let ustring="";
    
    for(var i=0;i<gameControler.players.length;i++){
        if(gameControler.players[i].connected){
            ustring+=gameControler.players[i].nickname+";";
        }
    }
    io.emit('renew userlist',ustring);
}

*/


function sendUserInitData(){
    let playerConnectionStatus="";
    for(let i=0;i<gameControler.players.length;i++){
        if(gameControler.players[i].connected){
            playerConnectionStatus+="1";
        }
        else{
            playerConnectionStatus+="0";
        }
    }
    console.log('Send Init Data:'+playerConnectionStatus);
    io.emit('initializeData',gameControler.players.length+":"+playerConnectionStatus);    
}
function runFrame(){
    let frametime=new Date().getTime()-lastFrameTime;
    lastFrameTime=new Date().getTime();

    for(let i=0;i<gameControler.players.length;i++){
        if(gameControler.players[i].connected){
            gameControler.players[i].run(frametime);
        }
        
    }
    for(let i=0;i<gameControler.players.length;i++){
        if(gameControler.players[i].connected&& gameControler.players[i].type>0){
            io.emit('p',i+":"+gameControler.players[i].p.x+","+gameControler.players[i].p.y+","+gameControler.players[i].v.direction());
        }
    }

    for(let i=0;i<gameControler.bullets.length;i++){
        if(gameControler.bullets[i].type>0){
            
            gameControler.bullets[i].run(frametime);
            
        }
    }
    let bulletinfostring="";
    for(let i=0;i<gameControler.bullets.length;i++){
        if(gameControler.bullets[i].type>0){
            bulletinfostring+=Math.round(gameControler.bullets[i].p.x)+","+Math.round(gameControler.bullets[i].p.y)+":"
        }
    }

    let hit=gameControler.hitBullet();
    io.emit('b',bulletinfostring);

}
function processMessage(msg){
    io.emit('chat message',msg);
    chathistory.append(msg);
    if(chathistory.length>MAX_CHAT_HISTORY){
        chathistory.removeHead();
    }
    console.log(msg + " Recorded log number : "+ chathistory.length);
}

function addNewUser(socketId,clientIp){

    for(var i=0;i<gameControler.players.length;i++){
        if(gameControler.players[i].clientIp==clientIp){
            return gameControler.players[i];
        }
    }
    let px=Math.floor(Math.random()*gameControler.MAIN_WIDTH);
    let py=Math.floor(Math.random()*gameControler.MAIN_HEIGHT);
    gameControler.players[gameControler.players.length]=new gameControler.Player(px,py,socketId,clientIp);
    console.log("create New Player : ["+px+"/"+py+"]");
    return gameControler.players[(gameControler.players.length-1)];
}
function findUserBySocketId(socketId){
    for(var i=0;i<gameControler.players.length;i++){
        if(gameControler.players[i].socketId==socketId){
            return gameControler.players[i];
        }
    } 

    return false;
}
function findUserByClientIp(clientIp){
    for(var i=0;i<gameControler.players.length;i++){
        if(gameControler.players[i].clientIp==clientIp){
            return gameControler.players[i];
        }
    } 

    return false;
}






function LinkedListNode(data){

    this.data=data;
    this.curr=null;

}

function LinkedList(){
    this.length=0;
    this.head=null;
    this.tail=null;

    var proto= LinkedList.prototype;

    LinkedList.prototype.append=function(data,position){
        if(position=="head" || position=="front" || position=="start"){
            position=0;
        }
        if(position=="tail" || position=="back" || position=="end" || position===undefined){
            position=this.length;
        }

        if(position>this.length){
            position=this.length;
        }

        if(this.length==0){
            this.head=new LinkedListNode(data);
            this.tail=this.head;
            this.length++;
            return this.length;
        }
        else if(position==0){
            var newnode=new LinkedListNode(data);
            newnode.curr=this.head;
            this.head=newnode;
            this.length++;
            return this.length;
        }
        else if(position==this.length){
            var newnode=new LinkedListNode(data);
            this.tail.curr=newnode;
            this.tail=this.tail.curr;
            this.length++;
            return this.length;
        }
        else{
            var newnode=new LinkedListNode(data);
            let cnode=this.head;
            for(var i=0;i<(position-1);i++){
                if(cnode.curr!==null){
                    cnode=cnode.curr;
                }
            }
            let a=cnode.curr;
            cnode.curr=newnode;
            newnode.curr=a;
            this.length++;
            return this.length;
        }
    }
   
    LinkedList.prototype.removeHead=function(){
        if(this.length>1){
            this.head=this.head.curr;
            this.length--;
            return this.length;
        }
        else{
            this.head=null;
            this.tail=null;
            this.length=0;
            return this.length;
        }

    } 
}
