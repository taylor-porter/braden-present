const canvas = document.getElementById("game_canvas");
const ctx = canvas.getContext("2d");
let sprites = [];
let key = "";
let upWasPressed = false;
let bulletCount = 0;

//game controls
let maxSpeed = 10;
let acceleration = 1.3;
let friction = 1;
let jumpForce = 25;
let gravity = 1.7;
let cameraSpeed = 0.3;
let fallHeight = 700;
let bulletSpeed = 20;
ctx.imageSmoothingEnabled = false;

let camera = {
    x: 0,
    y: 0,
    width: canvas.width,
    height: canvas.height, 
    smoothness : 0.1
};



function lerp(start, end, t){
    return start + (end - start) * t;
}


function createSprite(posX, posY, width, height){
    return {
        "x" : posX,
        "y" : posY,
        "width" : width, 
        "height" : height,
        "animation" : new Image(),
        "velocityX" : 0, 
        "velocityY" : 0,
        "keyWasPressed" : {}, 
        "jumpCount" : 2,
        "facing": "right", 
        "deleted": false,
        "spriteSheet" : {
            "used" : false,
            "x" : 0, 
            "y" : 0,
            "width" : 0,
            "height" : 0,
            "margin" : 0,
            "currentFrame" : 0,
            "frameRate" : 0,
        },
        "bullet" : {
            "firedFrom" : ""
        },
    };
}
let sky = createSprite(0,0, canvas.width, canvas.height)
sky.animation.src = "images/sky.jpg"
sprites.push(sky);

let player = createSprite(200, 100, 70, 70);
sprites.push(player);
player.animation.src = "images/mario-sprite-sheet-2.png";

player.spriteSheet.used = true;
player.spriteSheet.x = 7;
player.spriteSheet.y = 2;
player.spriteSheet.width = (405 / 14);
player.spriteSheet.height = (188 / 6);
player.spriteSheet.margin = -5;
player.spriteSheet.frameRate = 3;


function animateSprite(sprite, startFrame, endFrame){
    if(sprite.spriteSheet.currentFrame < sprite.spriteSheet.frameRate){
        sprite.spriteSheet.currentFrame ++
    }
    else {
        sprite.spriteSheet.currentFrame = 0
        if(sprite.spriteSheet.x < startFrame || sprite.spriteSheet.x > endFrame){
            sprite.spriteSheet.x = startFrame;
        }
        else{
            sprite.spriteSheet.x ++;
        }
    }
}




let sonic = createSprite(500, 100, 70, 70);
sonic.animation.src = "images/sonic.png";
sprites.push(sonic);
let grounds = [];

for(i=0; i<5; i++){
    grounds[i] = createSprite(i * 300, 250, 300, 150);
}

grounds.push(createSprite(350, 80, 100, 75));
grounds.push(createSprite(50, 50, 100, 75));

let bullets = [];




for(i=0; i < grounds.length; i++){
    sprites.push(grounds[i])
    grounds[i].animation.src = "images/ground.png";

}



let loadedImages = 0;

function checkImagesLoaded() {
    loadedImages++;
    if (loadedImages === 2) {
        gameLoop();
    }
}

player.animation.onload = checkImagesLoaded;
grounds[0].animation.onload = checkImagesLoaded;

let keys = {};

//to check if key down and/or key went down
window.addEventListener("keydown", (event) => {
    if(event.key === "ArrowUp" && !player.keyWasPressed.ArrowUp){
        console.log(player.jumpCount);
        player.keyWasPressed.ArrowUp = true;
        if(player.jumpCount < 2){
            player.y -= 2;
            player.velocityY = -1 * jumpForce;
            player.jumpCount++;
        }
    }
    if(event.key === "w" && !sonic.keyWasPressed.w){
        sonic.keyWasPressed.w = true;
        if(sonic.jumpCount < 2){
            sonic.y -= 2;
            sonic.velocityY = -1 * jumpForce;
            sonic.jumpCount++;
        }
    }
    if(event.key === "ArrowDown" && !player.keyWasPressed.ArrowDown){
        shootBullet(player);
    }
    if(event.key === "s" && !sonic.keyWasPressed.s){
        shootBullet(sonic);
    }

    keys[event.key] = true;

});
window.addEventListener("keyup", function(event){
    if(event.key === "ArrowUp"){
        player.keyWasPressed.ArrowUp = false;
    }
    if(event.key === "w"){
        sonic.keyWasPressed.w = false;
    }
    keys[event.key] = false;
})

function gameLoop(){
    // Move the camera to follow the player
    let targetX = player.x - camera.width / 2;  // Center the camera on the player (horizontal)
    let targetY = player.y - camera.height / 2 ; // Center the camera on the player (vertical)
    
    camera.x = lerp(camera.x, targetX, cameraSpeed);
    camera.y = lerp(camera.y, targetY, cameraSpeed);

    sky.x = camera.x;
    sky.y = camera.y;

    giveMovement(player, "ArrowLeft", "ArrowRight", "ArrowDown"); 
    giveMovement(sonic, "a", "d", "s");


    //change sprite animations when moving and/or facing left
    if (player.facing === "left"){
        if(Math.abs(player.velocityX) > 1){
            animateSprite(player, 3, 4);
        }
        else{
            player.spriteSheet.x = 6;
        }
    }
    else{
        if(Math.abs(player.velocityX) > 1){
            animateSprite(player, 8, 9);
        }
        else{
            player.spriteSheet.x = 7;
        }
    }

    if (sonic.facing === "left"){
        sonic.animation.src = "images/sonic-left.png"
    }
    else{
        sonic.animation.src = "images/sonic.png"
    }
    
    //delete deleted sprites
    sprites = sprites.filter(sprite => !sprite.deleted);
    bullets = bullets.filter(bullet => !bullet.deleted)

    //if a sprite is touching a bullet, delete the bullet and the sprite
    for(let i=0; i<bullets.length; i++){
        if(isTouching(bullets[i], sonic)){
            if(bullets[i].bullet.firedFrom !== "sonic"){
                sonic.deleted = true;
                bullets[i].deleted = true;
            }  
        }
        if(isTouching(bullets[i], player)){
            if(bullets[i].bullet.firedFrom !== "player"){
                player.deleted = true;
                bullets[i].deleted = true;

            }
        }
        if(bullets[i].x < camera.x || bullets[i].x > camera.x + camera.width){
            bullets[i].deleted = true;
            console.log("bullet deleted")
        }
    }
    
    //gravity
    giveGravity(player);
    giveGravity(sonic);
    collide(sonic, player);
    collide(player, sonic);

    createVelocity();
    drawSprites();
    requestAnimationFrame(gameLoop);

    //if the player falls off the map
    if(player.y > fallHeight){
        player.x = 200;
        player.y = 100;
    }
}


function createVelocity(){
    for(let i=0; i < sprites.length; i++){
        sprites[i].x += sprites[i].velocityX;
        sprites[i].y += sprites[i].velocityY;
    }
}

function isTouching(sprite1, sprite2) {
     if (
        sprite1.x < sprite2.x + sprite2.width &&
        sprite1.x + sprite1.width > sprite2.x &&
        sprite1.y < sprite2.y + sprite2.height &&
        sprite1.y + sprite1.height > sprite2.y
    ) {return true;}
    else {return false;}
}

function drawSprites() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for(let i=0; i < sprites.length; i++){
        if(!sprites[i].spriteSheet.used){
            ctx.drawImage(
                sprites[i].animation, 
                sprites[i].x - camera.x,
                sprites[i].y - camera.y, 
                sprites[i].width, 
                sprites[i].height
            );
        }
        else{
            ctx.drawImage(
                sprites[i].animation,
                sprites[i].spriteSheet.x * (sprites[i].spriteSheet.width), 
                sprites[i].spriteSheet.y * (sprites[i].spriteSheet.height + sprites[i].spriteSheet.margin), 
                sprites[i].spriteSheet.width, 
                sprites[i].spriteSheet.height,
                sprites[i].x - camera.x,
                sprites[i].y - camera.y, 
                sprites[i].width, 
                sprites[i].height
            );
        }
    }
    
    // ctx.drawImage(player.animation, player.x, player.y, player.width, player.height);

}
function isTouchingGround(){
    for(i=0; i<grounds.length; i++){
        if(isTouching(player, grounds[i])){
            return [true, i];
        }
    }
    return [false, -1];
}

function collide(sprite1, sprite2){
    if(isTouching(sprite1, sprite2)){

        overlapX = Math.min(
            sprite1.x + sprite1.width - sprite2.x, // right of sprite1 colliding w/ left of sprite2
            sprite2.x + sprite2.width - sprite1.x // left of sprite 1 overlap with sprite2
        )
        overlapY = Math.min(
            sprite1.y + sprite1.height - sprite2.y, // bottom of sprite1 on top of sprite2
            sprite2.y + sprite2.height - sprite1.y // top of sprite1 on bottom of sprite2
        )

        if(overlapX < overlapY){ // horizontal collision
            if(sprite1.x < sprite2.x){ // if colliding from right
                sprite1.x = sprite2.x - sprite1.width;
            }
            else if(sprite1.x > sprite2.x){ // if coming from left
                sprite1.x = sprite2.x + sprite2.width;
            }
        } else{
            if(sprite1.y < sprite2.y){ // if colliding from the top
                sprite1.velocityY = 0;
                sprite1.y = sprite2.y - sprite1.height;
                sprite1.jumpCount = 0;
            }
            else if(sprite1.y > sprite2.y){ // if colliding from the bottom
                sprite1.y = sprite2.y + sprite2.height;
                sprite1.velocityY = 0;
            }
        }
    }
}

function giveGravity(sprite){
    for(i=0; i < grounds.length; i++){
        collide(sprite, grounds[i]);
  }
  if(isTouchingGround()[0]){
    sprite.jumpCount = 0;
  }
  else{
      sprite.velocityY += gravity;


  }
}

function giveMovement(sprite, left, right, down){
    if(keys[left] && sprite.velocityX > -1 * maxSpeed){
        sprite.velocityX -= acceleration;
        sprite.facing = "left";
    }
    else if(sprite.velocityX < 0){
        sprite.velocityX += friction;
    }

    if(keys[right] && sprite.velocityX < maxSpeed){
        sprite.velocityX += acceleration;
        sprite.facing = "right";
    }
    else if(sprite.velocityX > 0){
        sprite.velocityX -= friction;
    }
    if (Math.abs(sprite.velocityX) < 1){
        sprite.velocityX = 0;
      }
}
function shootBullet(sprite){
    bullets[bulletCount] = (createSprite(sprite.x, sprite.y + sprite.width / 3, 10, 10))
    bullets[bulletCount].animation.src = "images/bullet.png";
    if(sprite.facing === "right"){
        bullets[bulletCount].velocityX = bulletSpeed;
    }
    else{
        bullets[bulletCount].velocityX = -1 * bulletSpeed;
    }
    if(sprite === player){
        bullets[bulletCount].bullet.firedFrom = "player"
    }
    else if(sprite === sonic){
        bullets[bulletCount].bullet.firedFrom = "sonic"
    }
    sprites.push(bullets[bulletCount])
    bulletCount++;
}