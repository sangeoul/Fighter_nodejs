const MAIN_WIDTH = 800;
const MAIN_HEIGHT = 540;
const VELOCITY_DEFAULT = 140;
const ACCEL_DEFAULT = 100;
const TURNING_ADDITIONAL_RATE = 0.02;
const STOPPING_TIME = 1;
const GUN_COOLDOWN = 300;
const BULLET_VELOCITY_RATE = 2.4;
const REVIVE_TIME = 5;
const CANVAS_BACKGROUNDCOLOR = "#000000";
const MOUSE_CURSOR_RADIUS_DEFAULT = 8;
const BULLET_COLOR_DEFAULT = "#FF6060";
var mainCanvas;
var mainCtx;
var players = new Array();
var bullets = new Array();
var me, mPointer, rally;
function initCanvas() {
    mainCanvas = document.createElement("canvas");
    mainCanvas.width = MAIN_WIDTH;
    mainCanvas.height = MAIN_HEIGHT;
    mainCtx = mainCanvas.getContext("2d");
    document.body.appendChild(mainCanvas);
    mPointer = new MouseCursor(MOUSE_CURSOR_RADIUS_DEFAULT);
    rally = new RallyPoint();
    let div_explanation = document.createElement("div");
    div_explanation.innerHTML = "이동 : 마우스 오른클릭.<br>공격 : 마우스 왼클릭";
    div_explanation.style.fontSize = "26px";
    document.body.appendChild(div_explanation);
}
function initialize() {
    initCanvas();
    clearCanvas();
    players = new Array();
    bullets = new Array();
}
function loadInitGameData() {
}
function clearCanvas() {
    mainCtx.fillStyle = CANVAS_BACKGROUNDCOLOR;
    mainCtx.fillRect(0, 0, mainCanvas.width, mainCanvas.height);
}
class Vector {
    constructor(x_, y_) {
        if (x_ === undefined) {
            x_ = 0;
        }
        if (y_ === undefined) {
            y_ = 0;
        }
        this.x = x_;
        this.y = y_;
    }
    size() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
    resize(size_) {
        let s = this.size();
        if (s == 0) {
            this.y = size_;
            this.x = 0;
        }
        else {
            this.x = this.x * size_ / s;
            this.y = this.y * size_ / s;
        }
    }
    direction() {
        if (this.size() == 0) {
            return Math.PI * 3 / 2;
        }
        let dir = Math.acos(this.x / this.size());
        if (this.y < 0) {
            dir = 2 * Math.PI - dir;
        }
        return dir;
    }
    turn(addAngle) {
        let s = this.size();
        let dir = this.direction();
        dir += addAngle;
        this.x = s * Math.cos(dir);
        this.y = s * Math.sin(dir);
    }
}
class MyInfo {
}
class FieldObject {
    constructor(x_, y_, v_) {
        if (x_ === undefined) {
            x_ = MAIN_WIDTH / 2;
        }
        if (y_ === undefined) {
            y_ = MAIN_HEIGHT / 2;
        }
        if (v_ === undefined) {
            v_ = VELOCITY_DEFAULT;
        }
        this.p = new Vector(x_, y_);
        this.d = new Vector(0, 0);
        this.v = new Vector(0, 0);
    }
}
class MouseCursor extends FieldObject {
    constructor(radius_) {
        super();
        if (radius_ === undefined) {
            radius_ = MOUSE_CURSOR_RADIUS_DEFAULT;
        }
        this.radius = radius_;
    }
    draw() {
        mainCtx.save();
        mainCtx.beginPath();
        mainCtx.strokeStyle = "rgb(255,0,0)";
        mainCtx.arc(this.p.x, this.p.y, this.radius, 0, Math.PI * 2);
        mainCtx.moveTo(this.p.x - this.radius, this.p.y);
        mainCtx.lineTo(this.p.x + this.radius, this.p.y);
        mainCtx.moveTo(this.p.x, this.p.y - this.radius);
        mainCtx.lineTo(this.p.x, this.p.y + this.radius);
        mainCtx.stroke();
        //mainCtx.translate(-this.x-(this.image.width/2),-this.y-(this.image.height/2));
        //mainCtx.drawImage(this.image,this.x-(this.image.width/2),this.y-(this.image.height/2));
        mainCtx.restore();
    }
}
class RallyPoint extends FieldObject {
    constructor(x_, y_) {
        super(x_, y_);
        this.image = new Image();
        this.image.src = "https://lindows.kr/nodejs/images/rallypoint.png";
        this.type = 0;
    }
    draw() {
        if (this.type == 1) {
            mainCtx.save();
            mainCtx.drawImage(this.image, this.p.x - this.image.width / 2, this.p.y - this.image.height / 2);
            //mainCtx.translate(-this.x-(this.image.width/2),-this.y-(this.image.height/2));
            //mainCtx.drawImage(this.image,this.x-(this.image.width/2),this.y-(this.image.height/2));
            mainCtx.restore();
        }
    }
}
class Player extends FieldObject {
    constructor(x, y, color_) {
        super(x, y);
        this.v.y = -1;
        this.type = 1;
        this.connected = 0;
        this.image = new Image();
        this.image.src = "https://lindows.kr/nodejs/images/player.png";
        if (color_ == undefined) {
            color_ = "#000000"; //debug
            //color_="rgb("+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+","+Math.floor(Math.random()*256)+")";
        }
        this.color = color_;
    }
    draw() {
        mainCtx.save();
        mainCtx.translate(this.p.x, this.p.y);
        mainCtx.rotate(this.v.direction());
        mainCtx.fillStyle = this.color;
        mainCtx.beginPath();
        mainCtx.arc(0, 0, 7, 0, Math.PI * 2);
        mainCtx.fill();
        mainCtx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
        //mainCtx.translate(-this.x-(this.image.width/2),-this.y-(this.image.height/2));
        //mainCtx.drawImage(this.image,this.x-(this.image.width/2),this.y-(this.image.height/2));
        mainCtx.restore();
    }
}
class Bullet extends FieldObject {
    constructor(x, y) {
        super();
    }
    draw() {
        mainCtx.save();
        mainCtx.fillStyle = BULLET_COLOR_DEFAULT;
        mainCtx.beginPath();
        mainCtx.arc(this.p.x, this.p.y, 2, 0, Math.PI * 2);
        mainCtx.fill();
        mainCtx.restore();
    }
}
function initializePlayers(data) {
    let userNumber = parseInt(data.split(":")[0]);
    let status = data.split(":")[1];
    let colors = data.split(":")[2].split("#");
    for (let i = 0; i < userNumber; i++) {
        if (players[i] === undefined) {
            players[i] = new Player(MAIN_WIDTH / 2, MAIN_HEIGHT / 2, "#" + colors[i + 1]);
        }
        players[i].connected = parseInt(status.charAt(i));
    }
}
function movePlayer(data) {
    let userNumber = parseInt(data.split(":")[0]);
    let moveinfo = data.split(":")[1].split(",");
    if (players[userNumber] !== undefined) {
        players[userNumber].p.x = parseFloat(moveinfo[0]);
        players[userNumber].p.y = parseFloat(moveinfo[1]);
        players[userNumber].v.turn(parseFloat(moveinfo[2]) - players[userNumber].v.direction());
    }
}
function setBullets(data_) {
    var bulletdatas = data_.split(":");
    let i = 0;
    for (; i < bulletdatas.length - 1; i++) {
        if (bulletdatas[i] !== "") {
            if (bullets[i] === undefined) {
                bullets[i] = new Bullet();
            }
            bullets[i].p.x = parseFloat(bulletdatas[i].split(",")[0]);
            bullets[i].p.y = parseFloat(bulletdatas[i].split(",")[1]);
            bullets[i].type = 1;
        }
    }
    for (; i < bullets.length; i++) {
        bullets[i].type = 0;
    }
}
function drawScreen() {
    clearCanvas();
    for (let i = 0; i < players.length; i++) {
        if (players[i].connected > 0 && players[i].type > 0) {
            players[i].draw();
        }
    }
    for (let i = 0; i < bullets.length; i++) {
        if (bullets[i].type > 0) {
            bullets[i].draw();
            //console.log("debug : "+bullets[i].p.x+","+bullets[i].p.y+":" +i+"/"+bullets.length);   
        }
    }
    mPointer.draw();
    rally.draw();
}
