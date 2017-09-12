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

  function Game() {
    this.canvas = document.getElementById("game");

    var pocketRadius = Ball.radius * 1.5,
        height = this.height = Math.floor(Ball.radius * 2 * (2.7 / 0.0615)),
        width = this.width = Math.floor(Ball.radius * 2 * (1.4 / 0.0615)),
        top = -2*pocketRadius,
        left = -2*pocketRadius,
        bottom = height + 2*pocketRadius,
        right = width + 2*pocketRadius;

    this.canvas.setAttribute("width", this.width + 4*pocketRadius);
    this.canvas.setAttribute("height", this.height + 4*pocketRadius + this.width/2);

    this.pockets = [
            new V(-pocketRadius, -pocketRadius),
            new V(-pocketRadius, this.height/2),
            new V(-pocketRadius, bottom - pocketRadius),
            new V(right-pocketRadius, -pocketRadius),
            new V(right-pocketRadius, this.height/2),
            new V(right-pocketRadius, bottom - pocketRadius),
          ];

    this.context = this.canvas.getContext("2d");
    this.canvas.focus();

    // bind keys
    this.mouse = new V(0, 0);
    this.mouseDown;

    this.canvas.onmousedown = (function(e) {
      this.mouse.x = Math.floor(e.offsetX - Ball.radius * 3);
      this.mouse.y = Math.floor(e.offsetY - Ball.radius * 3);
      return this.onMouseDown(e.button, e.offsetX, e.offsetY);
    }).bind(this);

    this.canvas.onmouseup = (function(e) {
      return this.onMouseUp(e.button);
    }).bind(this);

    this.canvas.onmousemove = (function(e) {
      this.mouse.x = Math.floor(e.offsetX - Ball.radius * 3);
      this.mouse.y = Math.floor(e.offsetY - Ball.radius * 3);
    }).bind(this);

    this.start();

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

  Game.prototype.onMouseDown = function(button, x, y) {
    if (y > this.height + 6*Ball.radius) {
      
    } else {
      if (button === 0) {
        this.mouseDown = new V(this.mouse.x, this.mouse.y);
      } else if (button === 1) {
        this.fastforward = true;
      }
    }
    return false;
  };

  Game.prototype.onMouseUp = function(button) {
    if (button === 0 && !this.rolling) {
      var white = this.white.pos,
          mouse = this.mouse.sub(white),
          mouseDown = this.mouseDown.sub(white);

      var offset = mouse.sub(mouseDown).project(mouseDown);
      this.white.vel = offset.mult(-10);
    }
    this.mouseDown = undefined;
  };

  Game.prototype.start = function() {

    var white = this.white = new Ball(this.width/2, this.height/2, "#fff"),
        balls = this.balls = [white],
        diameter = 2*Ball.radius;

    var i, j;
    for (i = 0; i < 5; ++i) {
      for (j = 0; j < i+1; ++j) {
        balls.push(new Ball(this.width/2 - (j-i/2)*diameter, this.height/4 - i*diameter*0.85));
      }
    }
  };

  Game.prototype.update = function(t) {
    var dt = (t - this.t)/1000;
    this.t = t;

    if (isNaN(dt)) {
      return;
    }

    var i, j;
    this.rolling = false;
    for (i=this.balls.length-1; i >= 0; --i) {
      this.balls[i].update(dt);
      if (this.balls[i].rolling) {
        this.rolling = true;
      }
    }

    var a, b, diameter = 2*Ball.radius;

    function resolveCollision(a, b) {
      var displacement = a.pos.sub(b.pos),
          ratio = a.vel.magnitude() / (a.vel.magnitude() + b.vel.magnitude()),
          push = displacement.normalise(diameter - displacement.magnitude());
      ratio = isNaN(ratio) ? 0.5 : ratio;
      a.pos = a.pos.add(push.mult(ratio));
      b.pos = b.pos.sub(push.mult(1-ratio));

      var result = a.vel.sub(b.vel).project(displacement);
      a.vel = a.vel.sub(result);
      b.vel = b.vel.add(result);
    }

    for (i=this.balls.length-1; i >= 0; --i) {
      a = this.balls[i];
      for (j=i-1; j >= 0; --j) {
        b = this.balls[j];
        if (a.pos.sub(b.pos).magnitude() < diameter) {
          resolveCollision(a, b);
        }
      }
    }
    
    this.render(t);
  };

  Game.prototype.render = function(t) {
    var context = this.context;

    var radius = Ball.radius * 1.5,
        diameter = 2*radius,
        height = this.height,
        width = this.width,
        top = -diameter,
        left = -diameter,
        bottom = height + diameter,
        right = width + diameter;

    context.save();
    context.translate(diameter, diameter);

    // felt
    context.fillStyle = "#484";
    context.fillRect(left, top, right-left, bottom-top);

    // pockets
    var pockets = this.pockets;
    for (var i=0; i<pockets.length; ++i) {
      context.fillStyle = "#000";
      context.beginPath();
      context.arc(pockets[i].x, pockets[i].y, radius, 0, Math.PI*2);
      context.fill();
      context.closePath();
    }

    // balls

    var balls = this.balls, ball;
    radius = Ball.radius;

    context.strokeStyle = "#000";
    for (i=0; i < balls.length; ++i) {
      ball = balls[i];
      context.fillStyle = ball.colour;
      context.beginPath();
      context.arc(ball.pos.x, ball.pos.y, radius, 0, Math.PI*2);
      context.fill();
      context.stroke();
      context.closePath();
    }

    // borders
    radius = Ball.radius * 1.5;
    diameter = 2*radius;

    context.fillStyle = "#242";

    context.beginPath();
    context.moveTo(left, top + diameter * 0.85);
    context.lineTo(0, top + diameter * 1.85);
    context.lineTo(0, this.height/2 - radius);
    context.lineTo(left, this.height/2 - radius);
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(left, bottom - diameter*0.85);
    context.lineTo(0, bottom - (diameter * 1.85));
    context.lineTo(0, this.height/2 + radius);
    context.lineTo(left, this.height/2 + radius);
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(right, top + diameter * 0.85);
    context.lineTo(right - diameter, top + diameter * 1.85);
    context.lineTo(right - diameter, this.height/2 - radius);
    context.lineTo(right, this.height/2 - radius);
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(right, bottom - diameter * 0.85);
    context.lineTo(right - diameter, bottom - (diameter * 1.85));
    context.lineTo(right - diameter, this.height/2 + radius);
    context.lineTo(right, this.height/2 + radius);
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(left + diameter*0.85, top);
    context.lineTo(left + diameter * 1.85, 0);
    context.lineTo(right - diameter * 1.85, 0);
    context.lineTo(right - diameter * 0.85, top);
    context.fill();
    context.closePath();

    context.beginPath();
    context.moveTo(left + diameter*0.85, bottom);
    context.lineTo(left + diameter * 1.85, bottom - diameter);
    context.lineTo(right - diameter * 1.85, bottom - diameter);
    context.lineTo(right - diameter * 0.85, bottom);
    context.fill();
    context.closePath();

    // border wood

    context.fillStyle = "#fa4";
    context.fillRect(left, top, radius, bottom-top);
    context.fillRect(right - radius, top, radius, bottom-top);
    context.fillRect(left, top, right-left, radius);
    context.fillRect(left, bottom-radius, right-left, radius);

    // cue

    radius = Ball.radius;
    if (!this.rolling) {
      context.fillStyle = "#000";
      var white = this.white.pos,
          mouse = this.mouse.sub(white),
          mouseDown = this.mouseDown ? this.mouseDown.sub(white) : null,
          length = 100;

      if (mouseDown != null) {
        var magnitude = mouse.sub(mouseDown).scalarProject(mouseDown);
        tip = white.add(mouseDown.normalise(magnitude + radius));
        end = white.add(mouseDown.normalise(magnitude + radius + length));
      } else {
        tip = white.add(mouse.normalise(radius)),
        end = white.add(mouse.normalise(radius + length));
      }

      context.beginPath();
      context.moveTo(tip.x, tip.y);
      context.lineTo(end.x, end.y);
      context.stroke();
      context.closePath();
    }

    // UI

    // ball
    context.beginPath();
    context.arc(left + this.width * 0.25, bottom + this.width * 0.25, this.width * 0.2, 0, Math.PI*2);
    context.strokeStyle = "#000";
    context.lineWidth = 3;
    context.stroke();
    context.fillStyle = "#fff";
    context.fill();
    context.closePath();

    context.beginPath();
    context.arc(left + this.width * 0.25, bottom + this.width * 0.25, 3, 0, Math.PI*2);
    context.fillStyle = "#000";
    context.fill();
    context.closePath();

    context.restore();
  };

  return Game;
})();

var Ball = (function() {

  function Ball(x, y, colour) {
    this.pos = new V(x, y);
    this.colour = colour != null ? colour : Ball.colours[Math.floor(Math.random()*Ball.colours.length)];

    this.vel = new V(0, 0);
    this.rolling = false;
  }

  Ball.colours = ["#f00", "#ff0", "#f0f", "#0f0", "#0ff", "#00f"];
  Ball.radius = 6;

  Ball.prototype.update = function(dt) {

    var vel = this.vel, pos = this.pos,
        radius = Ball.radius,
        width = game.width,
        height = game.height;

    pos = this.pos = pos.add(vel.mult(dt));

    // drop into pocket?
    var pockets = game.pockets,
        pocketRadius = radius * 1.5;
    for (var i=0; i<pockets.length; ++i) {
      if (pockets[i].sub(pos).magnitude() < pocketRadius &&
          vel.magnitude() < 100) {
        this.destroy();
        return;
      }
    }

    // apply friction
    if (vel.magnitude() > 1000) {
      vel = vel.mult(0.9);
      if (vel < 1000*0.98) {
        vel = 1000*0.98;
      }
      this.vel = vel;
    } else {
      vel = this.vel = vel.mult(0.98);
    }

    // stop if velocity is negligible
    if (this.vel.magnitude() < 5) {
      this.vel = new V(0, 0);
      this.rolling = false;
    } else {
      this.rolling = true;
    }

    // wall collisions
    if (pos.y - radius < height/2-pocketRadius || pos.y + radius > height/2+pocketRadius) {
      if (pos.x < radius) {
        vel.x = -vel.x;
        this.vel = vel.mult(0.5);
        pos.x = radius;
      } else if (pos.x > width - radius) {
        vel.x = -vel.x;
        this.vel = vel.mult(0.5);
        pos.x = width - radius;
      }
    }

    if (pos.y < radius) {
      vel.y = -vel.y;
      this.vel = vel.mult(0.5);
      pos.y = radius;
    } else if (pos.y > height - radius) {
      vel.y = -vel.y;
      this.vel = vel.mult(0.5);
      pos.y = height - radius;
    }
  }

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
  }

  return Ball;
})();

var V = (function() {

  function V(x, y) {
    this.x = x != null ? x : 0;
    this.y = y != null ? y : 0;
  }

  V.prototype.unpack = function() {
    return [this.x, this.y];
  };

  V.prototype.eq = function(v) {
    return this.x === v.x && this.y === v.y;
  };

  V.prototype.add = function(v) {
    return new V(this.x + v.x, this.y + v.y);
  };

  V.prototype.sub = function(v) {
    return new V(this.x - v.x, this.y - v.y);
  };

  V.prototype.mult = function(k) {
    return new V(k*this.x, k*this.y);
  };

  V.prototype.normalise = function(magnitude) {
    if (this.x === 0 || this.y === 0) {
      return this.sign().mult(magnitude);
    }
    var factor = magnitude / Math.sqrt(this.x*this.x + this.y*this.y);
    return new V(this.x * factor, this.y * factor);
  };

  V.prototype.sign = function() {
    return new V(this.x > 0 ? 1 : this.x < 0 ? -1 : 0, this.y > 0 ? 1 : this.y < 0 ? -1 : 0);
  };

  V.prototype.magnitude = function() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  };

  V.prototype.magnitude2 = function() {
    return this.x * this.x + this.y * this.y;
  };

  V.prototype.dot = function(v) {
    return this.x * v.x + this.y * v.y;
  };

  V.prototype.scalarProject = function(v) {
    return this.dot(v)/v.magnitude();
  };

  V.prototype.project = function(v) {
    return v.mult(this.dot(v)/v.magnitude2());
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