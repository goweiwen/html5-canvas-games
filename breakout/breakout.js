var KEYS = {
        left: 65,
        right: 68,
        pause: 27
      },
    KEYSID = {};
for (value in KEYS) {
  KEYSID[KEYS[value]] = value;
}

var Game = (function() {

  function Game(width, height) {
    this.canvas = document.getElementById("game");

    this.width = width;
    this.height = height;
    this.canvas.setAttribute("width", width);
    this.canvas.setAttribute("height", height);

    this.context = this.canvas.getContext("2d");
    this.canvas.focus();

    // bind keys
    document.onkeydown = (function(e) {
      if (e.target.tagName !== 'input' && e.target.tagName !== 'textarea') {
        return this.keyDown(e.which);
      }
    }).bind(this);
    document.onkeyup = (function(e) {
      if (e.target.tagName !== 'input' && e.target.tagName !== 'textarea') {
        return this.keyUp(e.which);
      }
    }).bind(this);
    
    // setting keys
    this.isDown = {};
    this.isPhysicallyDown = {};

    this.start();
    this.pause();

    // game loop
    window.onEachFrame((function() {
      var loops = 0;
      var nextGameTick = Date.now();
      var startTime = Date.now();
      var pausedTime;

      var skipTicks = 1000/60, maxFrameSkip = 10;
      return (function() {
        loops = 0;
        if (!this.paused) {
          if (pausedTime != null) {
            startTime += Date.now() - pausedTime;
            pausedTime = undefined;
            nextGameTick = Date.now();
          }
          while (Date.now() > nextGameTick && loops < maxFrameSkip) {
            this.update(nextGameTick - startTime);
            nextGameTick += skipTicks;
            loops++;
          }
        } else if (pausedTime == null) {
          pausedTime = Date.now();
        }
      });
    })().bind(this));


  };

  Game.prototype.start = function() {
    this.paddle = new Paddle(this.width/2, 50);

    this.balls = [];

    this.blocks = [];
    var x, y;
    for (i = 2; i <= this.width/20-3; ++i) {
      this.blocks.push(new Block(i * 20, 95, 20, 15, 1));
      this.blocks.push(new Block(i * 20, 65, 20, 15, i%3 == 0 ? 1 : 3));
      this.blocks.push(new Block(i * 20, 35, 20, 15, i%5 == 0 ? 1 : 5));
    }
    for (i = 2; i <= this.width/20-4; ++i) {
      this.blocks.push(new Block(i * 20 + 10, 110, 20, 15, 1));
      this.blocks.push(new Block(i * 20 + 10, 80, 20, 15, i%2 == 0 ? 1 : 2));
      this.blocks.push(new Block(i * 20 + 10, 50, 20, 15, i%4 == 0 ? 1 : 4));
      this.blocks.push(new Block(i * 20 + 10, 20, 20, 15, i%6 == 0 ? 1 : 6));
    }

    this.powerups = [
          new Powerup(this.width/2, 110, 0),
        ];
  };

  Game.prototype.update = function(t) {
    var dt = t - this.t;
    this.t = t;

    if (!isNaN(dt)) {
      this.paddle.update(dt);

      for (var i=this.balls.length-1; i >= 0; --i) {
        this.balls[i].update(dt);
      }

      for (var i=this.powerups.length-1; i >= 0; --i) {
        this.powerups[i].update(dt);
      }
    }
    
    this.render(t);
  };

  Game.prototype.render = function(t) {
    var context = this.context;

    context.clearRect(0, 0, this.width, this.height);

    context.fillRect(this.paddle.x - this.paddle.width/2, this.height - 10, this.paddle.width, 10);

    var i;
    for (i=0; i < this.blocks.length; ++i) {
      context.fillStyle = Block.COLOURS[this.blocks[i].health];
      context.fillRect(this.blocks[i].x0, this.blocks[i].y0, this.blocks[i].width-1, this.blocks[i].height-1);
    }

    for (i=0; i < this.balls.length; ++i) {
      context.fillStyle = this.balls[i].colour;
      context.fillRect(this.balls[i].x - 2, this.balls[i].y - 2, 4, 4);
    }

    for (i=0; i < this.powerups.length; ++i) {
      if (this.powerups[i].owner == null) {
        context.fillStyle = Powerup.COLOURS[this.powerups[i].type];
        context.fillRect(this.powerups[i].x - 2, this.powerups[i].y - 2, 8, 8);
      }
    }
    context.fillStyle = "#000";
  };

  Game.prototype.pause = function() {
  };

  Game.prototype.keyDown = function(key) {
    key = KEYSID[key];

    var down = this.isDown,
        physical = this.isPhysicallyDown;

    if (!physical[key]) {
      down[key] = true;
    }
    physical[key] = true;

    if (down.pause) {
      this.pause(true);
    }

    return true;
  };

  Game.prototype.keyUp = function(key) {
    key = KEYSID[key];

    this.isDown[key] = undefined;
    this.isPhysicallyDown[key] = undefined;

    return true;
  };

  return Game;
})();

var Paddle = (function() {

  function Paddle(x, width) {
    this.x = x;
    this.width = width;
    this.speed = 0.2;
  };

  Paddle.prototype.update = function(dt) {
    var down = game.isDown;
    if (down.left) {
      this.x -= this.speed * dt;
      if (this.x < this.width/2) {
        this.x = this.width/2;
      }
    } else if (down.right) {
      this.x += this.speed * dt;
      if (this.x > game.width - this.width/2) {
        this.x = game.width - this.width/2;
      }
    }
  };

  Paddle.onHit;

  return Paddle;
})();

var Ball = (function() {

  function Ball(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.speed = 0.2;
    this.velocity = (new V(vx != null ? vx : Math.random()-0.5, vy != null ? vy : -1)).normalize(this.speed);
    this.colour = "#000";
  };

  Ball.prototype.update = function(dt) {
    this.x += this.velocity.x * dt;
    this.y += this.velocity.y * dt;

    if (this.x > game.width || this.x < 0) {
      this.velocity.x = -this.velocity.x;
      this.x = (2 * game.width - this.x) % game.width;

    } else if (this.y < 0) {
      this.velocity.y = -this.velocity.y;
      this.y = (2 * game.height - this.y) % game.height;

    } else if (this.y > game.height-10) {
      var paddle = game.paddle;
      if (this.x > paddle.x - paddle.width/2 && this.x < paddle.x + paddle.width/2) {
        this.velocity.y = -0.5;
        this.velocity.x = (this.x - paddle.x)/(paddle.width/2);
        this.velocity = this.velocity.normalize(this.speed);
        this.y += this.velocity.y * dt;

        if (paddle.onHit != null) {
          paddle.onHit(this);
        }

      } else if (this.y > game.height) {
        this.destroy();
      }

    } else {

      var i;
      for (i=0; i < game.blocks.length; ++i) {
        var block = game.blocks[i];
        if (this.x > block.x0 && this.x < block.x1 && this.y > block.y0 && this.y < block.y1) {
          this.x -= this.velocity.x * dt;
          this.y -= this.velocity.y * dt;
          if (this.y < block.y0 || this.y > block.y1) {
            this.velocity.y = -this.velocity.y;
          } else if (this.x < block.x0 || this.x > block.x1) {
            this.velocity.x = -this.velocity.x;
          }
          this.x += this.velocity.x * dt;
          this.y += this.velocity.y * dt;
          block.hit();

          if (this.onHit != null) {
            this.onHit(block);
          }
        }
      }

    }

  };

  Ball.prototype.onHit;

  Ball.prototype.destroy = function() {
    if (game.balls.length === 1 || game.balls[game.balls.length-1] === this) {
      game.balls.pop();
      return;
    }
    for (var i=0; i < game.balls.length-1; ++i) {
      if (game.balls[i] === this) {
        game.balls[i] = game.balls.pop();
        return;
      }
    }
  };

  return Ball;
})();

var Block = (function() {

  function Block(x0, y0, width, height, health) {
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x0 + width;
    this.y1 = y0 + height;
    this.width = width;
    this.height = height;
    this.health = health ? health : 1;
  }

  Block.COLOURS = [
      "#000",
      "#800",
      "#880",
      "#080",
      "#088",
      "#008",
      "#808",
    ];

  Block.prototype.hit = function() {
    if(--this.health <= 0) {
      this.destroy();
    }
  }

  Block.prototype.destroy = function() {
    if (Math.random() > game.powerups.length/3) {
      game.powerups.push(new Powerup(this.x0 + this.width/2, this.y0 + this.height/2));
    }

    if (game.blocks.length === 1 || game.blocks[game.blocks.length-1] === this) {
      game.blocks.pop();
      return;
    }
    for (var i=0; i < game.blocks.length-1; ++i) {
      if (game.blocks[i] === this) {
        game.blocks[i] = game.blocks.pop();
        return;
      }
    }
  }

  return Block;
})();

var Powerup = (function() {

  function Powerup(x, y, type) {
    this.x = x;
    this.y = y;
    this.speed = 0.1;
    this.owner;
    this.duration = 0;
    this.type = type != null ? type : Math.floor(Math.random() * 4);
  }

  Powerup.prototype.update = function(dt) {

    if (this.owner != null) {
      this.duration -= dt;
      if (this.duration < 0) {
        this.deactivate();
      }
    } else {
      this.y += this.speed * dt;

      if (this.y > game.height-10) {
        var paddle = game.paddle;
        if (this.x > paddle.x - paddle.width/2 && this.x < paddle.x + paddle.width/2) {
          this.activate();
        } else if (this.y > game.height) {
          this.destroy();
        }
      }
    }
  }

  Powerup.COLOURS = [
      "#f00",
      "#ff0",
      "#0f0",
      "#00f",
    ];

  Powerup.prototype.activate = function() {
    switch(this.type) {
      case 0:
        for (var i=0; i<2; ++i) {
          var ball = new Ball(this.x, this.y, i-0.5);
          game.balls.push(ball);
        }
        this.destroy();
        break;
      case 1:
        this.owner = game.paddle;
        this.duration = 30000;
        this.owner.width += 10;
        break;
      case 2:
        var ball = new Ball(this.x, this.y);
        game.balls.push(ball);
        ball.colour = "#0f0";
        ball.onHit = function(block) {
          block.hit();
        }
        this.destroy();
        break;
      case 3:
        for (var i=0; i<5; ++i) {
          var ball = new Ball(this.x, this.y, (2.5-i)/5);
          game.balls.push(ball);
          ball.colour = "#00f";
          ball.speed = ball.speed * 3;
          ball.velocity = ball.velocity.normalize(ball.speed);
          ball.onHit = function() {
            this.destroy();
          }
        }
        this.destroy();
        break;
    }
  }

  Powerup.prototype.deactivate = function() {
    switch(this.type) {
      case 0:
        break;
      case 1:
        this.owner.width -= 10;
        this.destroy();
        break;
      case 2:
        this.owner.speed -= 0.15;
        this.destroy();
        break;
      case 3:
        if (self.owner !== true) {
          this.owner.speed -= 0.15;
        }
        this.destroy();
        break;
    }
  }

  Powerup.prototype.destroy = function() {
    if (game.powerups.length === 1 || game.powerups[game.powerups.length-1] === this) {
      game.powerups.pop();
      return;
    }
    for (var i=0; i < game.powerups.length-1; ++i) {
      if (game.powerups[i] === this) {
        game.powerups[i] = game.powerups.pop();
        return;
      }
    }
  }

  return Powerup;
})();

var V = (function() {

  function V(x, y) {
    this.x = x != null ? x : 0;
    this.y = y != null ? y : 0;
  }

  V.prototype.unpack = function() {
    return [this.x, this.y];
  };

  V.prototype.add = function(v) {
    return new V(this.x + v.x, this.y + v.y);
  };

  V.prototype.sub = function(v) {
    return new V(this.x - v.x, this.y - v.y);
  };

  V.prototype.normalize = function(magnitude) {
    var currentMagnitude = Math.sqrt(this.x*this.x + this.y*this.y);
    return new V(this.x * magnitude / currentMagnitude, this.y * magnitude / currentMagnitude);
  };

  return V;
})();


(function() {
  var onEachFrame;
  if (window.webkitRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() {
        cb();
        webkitRequestAnimationFrame(_cb);
      };
      _cb();
    };
  } else if (window.mozRequestAnimationFrame) {
    onEachFrame = function(cb) {
      var _cb = function() {
        cb();
        mozRequestAnimationFrame(_cb);
      };
      _cb();
    };
  } else {
    onEachFrame = function(cb) {
      setInterval(cb, 1000/60);
    };
  }

  window.onEachFrame = onEachFrame;

  String.prototype.repeat = String.prototype.repeat != null ? String.prototype.repeat : function(count) {
    var ret = "";
    for (var i=0; i<count; ++i) {
      ret = ret + this;
    }
    return ret;
  }

  Function.prototype.bind = Function.prototype.bind != null ? Function.prototype.bind : function(ctx) {
    var fn = this;
    return function() {
      return fn.apply(ctx, arguments);
    };
  }

})();