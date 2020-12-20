export const MAIN_WIDTH = 800;
export const MAIN_HEIGHT = 540;
const VELOCITY_DEFAULT = 140;
const ACCEL_DEFAULT = 100;
const TURNING_ADDITIONAL_RATE = 0.02;
const STOPPING_TIME = 1;
const GUN_COOLDOWN = 300;
const BULLET_VELOCITY_RATE = 2.4;
const REVIVE_TIME = 5;
export var players = new Array();
export var bullets = new Array();
export class Vector {
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
        if (dir > Math.PI * 2) {
            dir -= Math.PI * 2;
        }
        else if (dir < 0) {
            dir += Math.PI * 2;
        }
        this.x = s * Math.cos(dir);
        this.y = s * Math.sin(dir);
    }
    innerProduct(v) {
        return this.x * v.x + this.y * v.y;
    }
}
export class MyInfo {
}
export class FieldObject {
    constructor(x_, y_, v_, a_) {
        if (x_ === undefined) {
            x_ = MAIN_WIDTH / 2;
        }
        if (y_ === undefined) {
            y_ = MAIN_HEIGHT / 2;
        }
        if (v_ === undefined) {
            v_ = VELOCITY_DEFAULT;
        }
        if (a_ === undefined) {
            a_ = ACCEL_DEFAULT;
        }
        this.p = new Vector(x_, y_);
        this.d = new Vector(x_, y_);
        this.v = new Vector(0, 0);
        this.a = new Vector(0, 0);
        this.v_max = VELOCITY_DEFAULT;
        this.a_max = ACCEL_DEFAULT;
    }
    /*
    moveForward(frametime_){
        this.p.x+=this.v.x;
        this.p.y+=this.v.y;
        if(this.p.x>MAIN_WIDTH){
            this.p.x=MAIN_WIDTH;
        }
        if(this.p.x<0){
            this.p.x=0;
        }
        if(this.p.y>MAIN_HEIGHT){
            this.p.y=MAIN_HEIGHT;
        }
        if(this.p.y<0){
            this.p.y=0;
        }

    }
    */
    moveTurn(frametime_) {
        let dd = new Vector(this.d.x - this.p.x, this.d.y - this.p.y); //:destination direction
        if (dd.innerProduct(this.v) / dd.size() > dd.size() * STOPPING_TIME) {
            let stop_accel = new Vector(-dd.x, -dd.y);
            this.a.turn(dd.direction() - this.a.direction());
            this.a.x += stop_accel.x;
            this.a.y += stop_accel.y;
            if (this.a.size() > this.a_max) {
                this.a.resize(this.a_max);
            }
        }
        else {
            this.a.resize(this.a_max);
            this.a.turn(dd.direction() - this.a.direction());
        }
        this.v.x += this.a.x * (frametime_ / 1000);
        this.v.y += this.a.y * (frametime_ / 1000);
        let turnAngleLimit = this.a_max * TURNING_ADDITIONAL_RATE * (frametime_ / 1000);
        if (Math.abs(dd.direction() - this.v.direction()) < turnAngleLimit) {
            this.v.turn(dd.direction() - this.v.direction());
        }
        else if (Math.sin(dd.direction() - this.v.direction()) > 0) {
            this.v.turn(turnAngleLimit);
        }
        else {
            this.v.turn(-turnAngleLimit);
        }
        if (this.v.size() > this.v_max) {
            this.v.resize(this.v_max);
        }
        this.p.x += this.v.x * (frametime_ / 1000);
        this.p.y += this.v.y * (frametime_ / 1000);
        if (this.p.x > MAIN_WIDTH) {
            this.p.x = MAIN_WIDTH;
            this.v.x = 0;
        }
        if (this.p.x < 0) {
            this.p.x = 0;
            this.v.x = 0;
        }
        if (this.p.y > MAIN_HEIGHT) {
            this.p.y = MAIN_HEIGHT;
            this.v.y = 0;
        }
        if (this.p.y < 0) {
            this.p.y = 0;
            this.v.y = 0;
        }
    }
}
export class Player extends FieldObject {
    constructor(x, y, socketid, clientIp) {
        super(x, y);
        this.socketId = socketid;
        this.clientIp = clientIp;
        this.color = getRandomColor();
        this.connected = false;
        this.pressedKey = new Map();
        this.pressedKey.set('w', 0);
        this.pressedKey.set('a', 0);
        this.pressedKey.set('s', 0);
        this.pressedKey.set('d', 0);
        this.shotTime = new Date().getTime();
    }
    run(frametime_) {
        /*
        var moveDirection=this.pressedKey.get('w')+(this.pressedKey.get('a')*2)+(this.pressedKey.get('s')*4) + (this.pressedKey.get('d')*8);
        switch(moveDirection){
            case 1:
                this.direction=Math.PI*3/2;
            break;
            case 2:
                this.direction=Math.PI;
            break;
            case 3:
                this.direction=Math.PI*5/4;

            break;
            case 4:
                this.direction=Math.PI/2;
            break;
            case 5:
                this.direction=Math.PI*3/2;
            break;
            case 6:
                this.direction=Math.PI*3/4;
            break;
            case 7:
                this.direction=Math.PI;
            break;
            case 8:
                this.direction=0;
            break;
            case 9:
                this.direction=Math.PI*7/4;
            break;
            case 10:
                this.direction=0;
            break;
            case 11:
                this.direction=Math.PI*3/2;
            break;
            case 12:
                this.direction=Math.PI/4;
            break;
            case 13:
                this.direction=0;
            break;
            case 14:
                this.direction=Math.PI/2;
            break;
            case 15:
                this.direction=0;
            break;
        }
        
        if(moveDirection>0){
            //this.moveForward(frametime_);
            
        } */
        if (this.type == 0 && this.connected == 1) {
            if (this.deadtime + (REVIVE_TIME * 1000) < new Date().getTime()) {
                this.type = 1;
                this.p.x = Math.floor(Math.random() * MAIN_WIDTH);
                this.p.y = Math.floor(Math.random() * MAIN_HEIGHT);
                console.log("REVIVE!" + this.deadtime);
            }
        }
        this.moveTurn(frametime_);
    }
    setDestination(coordinationString_) {
        let x = coordinationString_.split(",")[0];
        let y = coordinationString_.split(",")[1];
        this.d.x = parseFloat(x);
        this.d.y = parseFloat(y);
    }
    shootBullet(data_) {
        let nowtime = new Date().getTime();
        if (this.shotTime + GUN_COOLDOWN < nowtime) {
            this.shotTime = nowtime;
            addNewBullet(this.p.x, this.p.y, parseInt(data_.split(",")[0]), parseInt(data_.split(",")[1]));
        }
    }
    dead() {
        this.type = 0;
        this.deadtime = new Date().getTime();
        console.log("HIT!" + this.deadtime);
    }
}
export class Bullet extends FieldObject {
    constructor(px_, py_, dx_, dy_) {
        super(px_, py_);
        this.v.x = dx_ - px_;
        this.v.y = dy_ - py_;
        this.v.resize(14);
        this.p.x += this.v.x;
        this.p.y += this.v.y;
        this.v.resize(VELOCITY_DEFAULT * BULLET_VELOCITY_RATE);
        this.type = 1;
    }
    run(frametime_) {
        this.move(frametime_);
    }
    move(frametime_) {
        this.p.x += this.v.x * frametime_ / 1000;
        this.p.y += this.v.y * frametime_ / 1000;
        if (this.p.x > MAIN_WIDTH) {
            this.type = 0;
        }
        if (this.p.x < 0) {
            this.type = 0;
        }
        if (this.p.y > MAIN_HEIGHT) {
            this.type = 0;
        }
        if (this.p.y < 0) {
            this.type = 0;
        }
    }
}
export function addNewBullet(px_, py_, dx_, dy_) {
    for (var i = 0; i < bullets.length; i++) {
        if (bullets[i].type == 0) {
            bullets[i] = new Bullet(px_, py_, dx_, dy_);
            return bullets[i];
        }
    }
    bullets[bullets.length] = new Bullet(px_, py_, dx_, dy_);
    return bullets[bullets.length - 1];
}
export function hitBullet() {
    for (let i = 0; i < players.length; i++) {
        for (let j = 0; j < bullets.length; j++) {
            if (players[i].type > 0 && bullets[j].type > 0) {
                if (7 * 7 > (players[i].p.x - bullets[j].p.x) * (players[i].p.x - bullets[j].p.x) + (players[i].p.y - bullets[j].p.y) * (players[i].p.y - bullets[j].p.y)) {
                    players[i].dead();
                    bullets[j].type = 0;
                    return [i, j];
                }
            }
        }
    }
    return null;
}
export function getRandomColor() {
    let codes = "0123456789ABCDEF";
    let colorString = "#";
    for (var i = 0; i < 6; i++) {
        colorString += codes[Math.floor(Math.random() * 16)];
    }
    return colorString;
}
