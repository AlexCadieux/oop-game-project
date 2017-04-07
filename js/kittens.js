// This sectin contains some game constants. It is not super interesting
var audio = new Audio("/images/Nightcore- Let the bodies hit the floor - from YouTube.mp3");
audio.play();
var GAME_WIDTH = 1050;
var GAME_HEIGHT = 650;

var ENEMY_WIDTH = 75;
var ENEMY_HEIGHT = 156;
var MAX_ENEMIES = 10;

var PLAYER_WIDTH = 75;
var PLAYER_HEIGHT = 54;

var BULLET_WIDTH = 75;
var BULLET_HEIGHT = 50;


// These two constants keep us from using "magic numbers" in our code
var LEFT_ARROW_CODE = 37;
var RIGHT_ARROW_CODE = 39;
var R_KEY_CODE = 82;
var SPACE_KEY_CODE = 32;

// These two constants allow us to DRY
var MOVE_LEFT = 'left';
var MOVE_RIGHT = 'right';
var RESTART = 'r';
var SHOOT = ' ';

// Preload game images
var images = {};
['enemy.png', 'stars.png', 'player.png', 'arrow.png'].forEach(imgName => {
    var img = document.createElement('img');
    img.src = 'images/' + imgName;
    images[imgName] = img;
});



class Entity {
    render(ctx) {
        ctx.drawImage(this.sprite, this.x, this.y);
    }
}

// This section is where you will be doing most of your coding
class Bullet extends Entity {
    
    constructor(xPos) {
        super();
        this.x = xPos
        this.y = GAME_HEIGHT - BULLET_HEIGHT - 10;
        this.sprite = images['arrow.png'];
        
        this.speed = 1
        
    }
    
    update(timeDiff) {
        this.y = this.y - timeDiff * this.speed;
    }
}

class Enemy extends Entity {
    
    constructor(xPos) {
        super();
        this.x = xPos;
        this.y = -ENEMY_HEIGHT;
        this.sprite = images['enemy.png'];

        // Each enemy should have a different speed
        this.speed = Math.random() / 2 + 0.25 /*+ (math.Floor(this.s))*/;
    }

    update(timeDiff) {
        this.y = this.y + timeDiff * this.speed;
    }

}

class Player extends Entity {
    
    constructor() {
        super();
        this.x = 2 * PLAYER_WIDTH;
        this.y = GAME_HEIGHT - PLAYER_HEIGHT - 10;
        this.sprite = images['player.png'];
    }

    // This method is called by the game engine when left/right arrows are pressed
    move(direction) {
        if (direction === MOVE_LEFT && this.x > 0) {
            this.x = this.x - PLAYER_WIDTH;
        }
        else if (direction === MOVE_RIGHT && this.x < GAME_WIDTH - PLAYER_WIDTH) {
            this.x = this.x + PLAYER_WIDTH;
        }
    }
}

/*
This section is a tiny game engine.
This engine will use your Enemy and Player classes to create the behavior of the game.
The engine will try to draw your game at 60 frames per second using the requestAnimationFrame function
*/
class Engine {
    constructor(element) {
        // Setup the player
        this.player = new Player();
        this.bulletsClip = [];

        // Setup enemies, making sure there are always three
        this.setupEnemies();

        // Setup the <canvas> element where we will be drawing
        var canvas = document.createElement('canvas');
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;
        element.appendChild(canvas);

        this.ctx = canvas.getContext('2d');

        // Since gameLoop will be called out of context, bind it once here.
        this.gameLoop = this.gameLoop.bind(this);
    }

    /*
     The game allows for 5 horizontal slots where an enemy can be present.
     At any point in time there can be at most MAX_ENEMIES enemies otherwise the game would be impossible
     */
    setupEnemies() {
        if (!this.enemies) {
            this.enemies = [];
        }

        while (this.enemies.filter(e => !!e).length < MAX_ENEMIES) {
            this.addEnemy();
        }
    }

    // This method finds a random spot where there is no enemy, and puts one in there
    addEnemy() {
        var enemySpots = GAME_WIDTH / ENEMY_WIDTH;

        var enemySpot;
        // Keep looping until we find a free enemy spot at random
        while (/*!enemySpot ||*/ this.enemies[enemySpot]) {
            enemySpot = Math.floor(Math.random() * enemySpots);
        }

        this.enemies[enemySpot] = new Enemy(enemySpot * ENEMY_WIDTH);
    }
    
    addBullet(playerSpot) {
        var bulletSpot = playerSpot + (PLAYER_WIDTH-BULLET_WIDTH)/2;
        this.bulletsClip.push(new Bullet(bulletSpot));
    }

    // This method kicks off the game
    start() {
        this.score = 0;
        this.lastFrame = Date.now();
        // Listen for keyboard left/right and update the player
        document.addEventListener('keydown', e => {
            if (e.keyCode === LEFT_ARROW_CODE) {
                this.player.move(MOVE_LEFT);
            }
            else if (e.keyCode === RIGHT_ARROW_CODE) {
                this.player.move(MOVE_RIGHT);
            }
            
            else if (e.keyCode === SPACE_KEY_CODE) {
                var temp = this.player.x
                this.addBullet(temp);
            }
        });

        this.gameLoop();
    }

    /*
    This is the core of the game engine. The `gameLoop` function gets called ~60 times per second
    During each execution of the function, we will update the positions of all game entities
    It's also at this point that we will check for any collisions between the game entities
    Collisions will often indicate either a player death or an enemy kill

    In order to allow the game objects to self-determine their behaviors, gameLoop will call the `update` method of each entity
    To account for the fact that we don't always have 60 frames per second, gameLoop will send a time delta argument to `update`
    You should use this parameter to scale your update appropriately
     */
    gameLoop() {
        // Check how long it's been since last frame
        var currentFrame = Date.now();
        var timeDiff = currentFrame - this.lastFrame;

        // Increase the score!
        this.score += timeDiff;

        // Call update on all enemies
        this.enemies.forEach(enemy => enemy.update(timeDiff));
        this.bulletsClip.forEach(bullet => bullet.update(timeDiff));

        // Draw everything!
        this.ctx.drawImage(images['stars.png'], 0, 0); // draw the star bg
        this.enemies.forEach(enemy => enemy.render(this.ctx)); // draw the enemies
        this.player.render(this.ctx); // draw the player
        this.bulletsClip.forEach(bullet => bullet.render(this.ctx));

        // Check if any enemies should die
        this.enemies.forEach((enemy, enemyIdx) => {
            var enemyShot = false
            for(var i = 0; i < this.bulletsClip.length; i++) { 
                    if (this.enemies[enemyIdx] && this.enemies[enemyIdx].x > this.bulletsClip[i].x - ENEMY_WIDTH && this.enemies[enemyIdx].x < this.bulletsClip[i].x + BULLET_WIDTH) {
                        if (this.enemies[enemyIdx].y > this.bulletsClip[i].y - ENEMY_HEIGHT && this.enemies[enemyIdx].y < this.bulletsClip[i].y + PLAYER_HEIGHT) { 
                            enemyShot = true;
                        }
                    }
                }
                
            if (enemy.y > GAME_HEIGHT || enemyShot) {
                delete this.enemies[enemyIdx];
            }
        });
        
        // Check if any bullet should die
        var tempArray =[];
        this.bulletsClip.forEach((bullet, bulletIdx) => {
            if (bullet.y < 0) {
                console.log(this.bulletsClip.length)
                console.log(this.bulletsClip)
                tempArray.push(bulletIdx);
            }
        });
        // tempArray.forEach((splice(1), indexIdx) => {
        for(var i = 0; i < tempArray.length; i++) {
                    this.bulletsClip.splice(tempArray[i],1);
        };

        this.setupEnemies();

        // Check if player is dead
        if (this.isPlayerDead()) {
            // If they are dead, then it's game over!
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score + ' GAME OVER', 5, 30);
            this.ctx.fillText('PRESS "R" TO RESTART', 5, 200);
            document.addEventListener('keydown', e => {
                if(e.keyCode === R_KEY_CODE /*&& isPlayerDead()*/){
                    this.player = new Player();
                    this.enemies = [];
                    this.setupEnemies();
                    // this.start();
                    this.score = 0;
                    this.lastFrame = Date.now();
                    this.gameLoop();
                    
                }
            });
        }
        else {
            // If player is not dead, then draw the score
            this.ctx.font = 'bold 30px Impact';
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(this.score, 5, 30);

            // Set the time marker and redraw
            this.lastFrame = Date.now();
            requestAnimationFrame(this.gameLoop);
        }
    }

    isPlayerDead() {
        // TODO: fix this function!
        
        for(var i = 0; i < this.enemies.length; i++) {
            var TOLERANCE = 23
            if (this.enemies[i] && this.enemies[i].x > this.player.x - ENEMY_WIDTH + TOLERANCE && this.enemies[i].x < this.player.x + PLAYER_WIDTH - TOLERANCE) {
                if (this.enemies[i].y > this.player.y - ENEMY_HEIGHT + TOLERANCE && this.enemies[i].y < this.player.y + PLAYER_HEIGHT - TOLERANCE) {
                    return true;
                }
            }
            
        }
        return false;
    }
    
    isEnemyDead() {
        // TODO: fix this function!
        
        for(var i = 0; i < this.enemies.length; i++) {
            var TOLERANCE = 23
            if (this.enemies[i] && this.enemies[i].x > this.player.x - ENEMY_WIDTH + TOLERANCE && this.enemies[i].x < this.player.x + PLAYER_WIDTH - TOLERANCE) {
                if (this.enemies[i].y > this.player.y - ENEMY_HEIGHT + TOLERANCE && this.enemies[i].y < this.player.y + PLAYER_HEIGHT - TOLERANCE) {
                    return true;
                }
            }
            
        }
        return false;
    }
}





// This section will start the game
var gameEngine = new Engine(document.getElementById('app'));
gameEngine.start();