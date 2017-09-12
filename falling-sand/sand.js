var WIDTH = 200,
    HEIGHT = 160,
    ZOOM = 4;

var GRAVITY_NONE = 0,
    GRAVITY_SOLID = 1,
    GRAVITY_POWDER = 2,
    GRAVITY_LIQUID = 3;

var PROPERTIES = [
        {
          name: "air",
          colour: "#fff",
          gravity: GRAVITY_LIQUID,
          density: 0.05,
        }, {
          name: "water",
          colour: "#aaf",
          gravity: GRAVITY_LIQUID,
          density: 0.5,
          heat: function(tile, x, y) {
            game.set(x, y, I.steam);
          },
          reaction: function(tile0, x0, y0, tile1, x1, y1) {
            if (!game.dirtyGrid[y1*WIDTH + x1]) {
              PROPERTIES[tile1].cool(tile1, x1, y1);
            }
          },
          reagents: ["cool"],
        }, {
          name: "oil",
          colour: "#864",
          gravity: GRAVITY_LIQUID,
          density: 0.4,
          flammable: true,
          heat: function(tile, x, y) {
            game.set(x, y, I.gas);
          },
        }, {
          name: "powder",
          colour: "#fa8",
          gravity: GRAVITY_POWDER,
          density: 1,
          flammable: true,
        }, {
          name: "stone",
          colour: "#888",
        }, {
          name: "fire",
          colour: "#f00",
          gravity: GRAVITY_LIQUID,
          density: 0,
          reaction: function(tile0, x0, y0, tile1, x1, y1) {
            if (PROPERTIES[tile1].flammable != null && !game.dirtyGrid[y1*WIDTH + x1]) {
              game.set(x1, y1, tile0);
            }
            if (PROPERTIES[tile1].heat != null && !game.dirtyGrid[y1*WIDTH + x1]) {
              PROPERTIES[tile1].heat(tile1, x1, y1);
            }
          },
          reagents: ["flammable", "heat"],
          update: function(tile, x, y) {
            if (Math.random() > 0.8) {
              game.set(x, y, 0);
            }
          },
        }, {
          name: "ember",
          colour: "#840",
          gravity: GRAVITY_POWDER,
          density: 1.9,
          update: function(tile0, x, y) {
            if (game.grid[(y-1)*WIDTH + x] === 0 && !game.dirtyGrid[(y-1)*WIDTH + x] && Math.random() > 0.5) {
              game.set(x, (y-1), I.fire);
            }
          },
          reaction: function(tile0, x0, y0, tile1, x1, y1) {
            if (PROPERTIES[tile1].flammable != null && !game.dirtyGrid[y1*WIDTH + x1]) {
              game.set(x1, y1, tile0);
            }
            if (PROPERTIES[tile1].heat != null && !game.dirtyGrid[y1*WIDTH + x1]) {
              PROPERTIES[tile1].heat(tile1, x1, y1);
            }
          },
          reagents: ["heat"],
          cool: function(tile, x, y) {
            if (Math.random() > 0.8) {
              game.set(x, y, I.stone);
            }
          },
        }, {
          name: "steam",
          colour: "#aaf",
          gravity: GRAVITY_LIQUID,
          density: 0.03,
          update: function(tile, x, y) {
            if (Math.random() > 0.97) {
              game.set(x, y, I.water);
            }
          },
        }, {
          name: "gas",
          colour: "#864",
          gravity: GRAVITY_LIQUID,
          density: 0.02,
          update: function(tile, x, y) {
            if (Math.random() > 0.99) {
              game.set(x, y, I.oil);
            }
          },
          cool: function(tile, x, y) {
            game.set(x, y, I.oil);
          },
        }, {
          name: "clone",
          colour: "#f0f",
          update: function(tile0, x, y) {
            if (y % 2 === 1) {
              game.set(x, y, 0);
            } else if (game.grid[(y-1)*WIDTH + x] !== 0 && 
                game.grid[(y-1)*WIDTH + x] !== tile0 && 
                game.grid[(y+1)*WIDTH + x] === 0 && 
                !game.dirtyGrid[(y+1)*WIDTH + x] && Math.random() > 0.5) {
              game.set(x, y+1, game.grid[(y-1)*WIDTH + x]);
            }
          },
        }, {
          name: "drain",
          colour: "#808",
          update: function(tile0, x, y) {
            if (game.grid[(y-1)*WIDTH + x] !== 0 && 
                game.grid[(y-1)*WIDTH + x] !== tile0) {
              game.set(x, y-1, 0);
            }
          },
        }, {
          name: "metal",
          colour: "#444",
          heat: function(tile, x, y) {
            if (Math.random() > 0.9) {
              game.set(x, y, I.hot_metal);
            }
          },
        }, {
          name: "hot_metal",
          colour: "#844",
          hot: true,
          update: function(tile0, x, y) {
            if (Math.random() > 0.95) {
              game.set(x, y, I.metal);
            }
          },
          reaction: function(tile0, x0, y0, tile1, x1, y1) {
            if (PROPERTIES[tile1].heat != null && !game.dirtyGrid[y1*WIDTH + x1]) {
              PROPERTIES[tile1].heat(tile1, x1, y1);
            }
          },
          reagents: ["heat"],
          cool: function(tile, x, y) {
            if (Math.random() > 0.2) {
              game.set(x, y, I.metal);
            }
          },
        },
      ];

var I = {},
    COLOUR = [],
    GRAVITY = [],
    DENSITY = [],
    REACTION = [],
    REAGENTS = [],
    UPDATE = [],
    props;
for (var i = 0; i < PROPERTIES.length; ++i) {
  props = PROPERTIES[i];

  I[props.name] = i;

  COLOUR[i] = props.colour != null ? props.colour : "#000";

  GRAVITY[i] = props.gravity != null ? props.gravity : GRAVITY_NONE;
  DENSITY[i] = props.density != null ? props.density : (props.gravity === GRAVITY_NONE ? Math.inf : 1);

  REACTION[i] = props.reaction;
  if (props.reagents != null) {
    REAGENTS[i] = [];
    for (var j = 0; j < props.reagents.length; ++j) {
      for (var k = 0; k < PROPERTIES.length; ++k) {
        if (PROPERTIES[k][props.reagents[j]] != null) {
          REAGENTS[i][k] = true;
        }
      }
    }
  }

  UPDATE[i] = props.update;
}

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

    this.canvas.setAttribute("width", WIDTH * ZOOM);
    this.canvas.setAttribute("height", HEIGHT * ZOOM + 20);

    this.context = this.canvas.getContext("2d");
    this.canvas.focus();

    this.mouseX = 0;
    this.mouseY = 0;
    this._mouseX;
    this._mouseY;
    this.mouseDown = false;
    this.selected = 1;

    // bind keys
    document.onkeydown = (function(e) {
      if (e.target.tagName !== 'input' && e.target.tagName !== 'textarea') {
        return this.keyDown(e.which);
      }
    }).bind(this);

    this.canvas.onmousedown = (function(e) {
      this.mouseX = Math.floor(e.offsetX / ZOOM);
      this.mouseY = Math.floor(e.offsetY / ZOOM);
      this.mouseDown = true;
    }).bind(this);

    this.canvas.onmouseup = (function(e) {
      this.mouseDown = false;
    }).bind(this);

    this.canvas.onmousemove = (function(e) {
      this.mouseX = Math.floor(e.offsetX / ZOOM);
      this.mouseY = Math.floor(e.offsetY / ZOOM);
    }).bind(this);

    this.start();

    // game loop
    window.onEachFrame((function() {
      var loops = 0;
      var nextGameTick = Date.now();
      var startTime = Date.now();
      var pausedTime;

      var skipTicks = 1000/30, maxFrameSkip = 10;
      return (function() {
        loops = 0;
        if (!this.paused) {
          this.poll();
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
          this.render();
        } else if (pausedTime == null) {
          pausedTime = Date.now();
        }
      });
    })().bind(this));


  };

  Game.prototype.start = function() {

    var grid = this.grid = [];
    var x, y;
    for (y = 0; y < HEIGHT; ++y) {
      for (x = 0; x < WIDTH; ++x) {
        grid.push(0);
      }
    }

    this.dirtyX = [];
    this.dirtyY = [];
    this.dirtyId = [];
    this.dirtyGrid = [];
  };

  Game.prototype.poll = function() {
      if (this.mouseDown) {
        if (this.mouseY > HEIGHT) {
          this.selected = Math.floor(this.mouseX / 40 * ZOOM);
        } else {
          var selected = this.selected,
              _x = this._mouseX, 
              _y = this._mouseY,
              x = this.mouseX, 
              y = this.mouseY,
              dx, dy, m, i;
          if (_x == null) {
            _x = x;
            _y = y;
          }
          dx = x - _x;
          dy = y - _y;
          this.set(x, y, selected);
          if (dy === 0) {
            dx = dx > 0 ? 1 : -1;
            while (_x !== x) {
              _x += dx;
              this.set(_x, _y, selected);
            }
          } else {
            m = Math.abs(dy/dx);
            dx = dx > 0 ? 1 : -1;
            dy = dy > 0 ? 1 : -1;
            i = 0;
            while (_y !== y) {
              _y += dy;
              this.set(_x, _y, selected);
  
              ++i;
              while (i > m) {
                _x += dx;
                this.set(_x, _y, selected);
                i -= m;
              }
            }
          }
        }
      }
      this._mouseX = x;
      this._mouseY = y;
  }

  Game.prototype.update = function(t) {
    var dt = t - this.t;
    this.t = t;

    if (!isNaN(dt)) {

      var grid = this.grid,
          dirtyGrid = this.dirtyGrid,
          tile0, tile1, x, y;

      // react

      for (i = 0; i < grid.length; ++i) {
        tile0 = grid[i];
        if (tile0 !== 0 && REAGENTS[tile0] != null && !dirtyGrid[i]) {

          x = i % WIDTH;
          y = Math.floor(i / WIDTH);

          var set = this.set.bind(this);
          function tryReact(dx, dy) {
            var i = (y+dy)*WIDTH + x+dx,
                tile1 = grid[i];
            if (!dirtyGrid[i] && 
                REAGENTS[tile0][tile1] != null) {
              REACTION[tile0](tile0, x, y, tile1, x+dx, y+dy);
              return true;
            }
            return false;
          }

          tryReact(-1, 0);
          tryReact(1, 0);
          tryReact(0, -1);
          tryReact(0, 1);
        }
      }

      // update

      for (i = 0; i < grid.length; ++i) {
        tile0 = grid[i];
        if (tile0 !== 0 && UPDATE[tile0] != null && !dirtyGrid[i]) {

          x = i % WIDTH;
          y = Math.floor(i / WIDTH);

          UPDATE[tile0](tile0, x, y);
        }
      }

      // gravity

      for (i = 0; i < grid.length; ++i) {
        tile0 = grid[i];
        if (tile0 !== 0 && !dirtyGrid[i]) {
          var gravity = GRAVITY[tile0],
              density = DENSITY[tile0];

          if (gravity == GRAVITY_NONE) {
            continue;
          }

          x = i % WIDTH;
          y = Math.floor(i / WIDTH);

          var set = this.set.bind(this);
          function tryGravity(dx, dy) {
            var i = (y+dy)*WIDTH + x+dx,
                tile1 = grid[i];

            if (!dirtyGrid[i] && 
                gravity <= GRAVITY[tile1] && 
                (density > 0.05 ? density > DENSITY[tile1] : density < DENSITY[tile1]) &&
                Math.random() > (density > 0.05 ? DENSITY[tile1]/density : density/DENSITY[tile1])) {
              set(x, y, tile1);
              set(x+dx, y+dy, tile0);
              return true;
            }
            return false;
          }

          if (y < HEIGHT-1) {
  
            var dy = density > 0.05 ? 1 : -1

            if (gravity >= GRAVITY_SOLID) {
              if (y === 0 && dy < 0) {
                set(x, y, 0);
                continue;
              } else if (tryGravity(0, dy)) {
                continue;
              }
            }

            if (gravity >= GRAVITY_POWDER) {
              var direction = Math.random() < 0.5 ? -1 : 1;
              if (tryGravity(direction, dy) || tryGravity(-direction, dy)) {
                continue;
              }
            }

            if (gravity >= GRAVITY_LIQUID) {
              var direction = Math.random() < 0.5 ? -1 : 1;
              if (tryGravity(direction, 0) || tryGravity(-direction, 0)) {
                continue;
              }
            }
          }
        }
      }
    }
    
  };

  Game.prototype.render = function() {
    // render dirty tiles
    var context = this.context,
        grid = this.grid;

    var i, 
        x = this.dirtyX, 
        y = this.dirtyY, 
        id = this.dirtyId;

    for (i = 0; i < id.length; ++i) {
      context.fillStyle = COLOUR[id[i]];
      context.fillRect(x[i] * ZOOM, y[i] * ZOOM, ZOOM, ZOOM);
    }

    // flip buffer
    for (i = 0; i < id.length; ++i) {
      grid[y[i]*WIDTH + x[i]] = id[i];
    }
    this.dirtyX = [];
    this.dirtyY = [];
    this.dirtyId = [];
    this.dirtyGrid = [];

    // render toolbar
    var context = this.context;
    context.textAlign = "center";
    for (i = 0; i < COLOUR.length; ++i) {
      context.fillStyle = COLOUR[i];
      context.fillRect(i * 40, HEIGHT * ZOOM, 400, 20);
      context.fillStyle = "#000";
      context.fillText(PROPERTIES[i].name, i * 40 + 20, HEIGHT * ZOOM + 13);
      if (this.selected === i) {
        context.strokeStyle = "#000";
        context.strokeRect(i * 40 + 1, HEIGHT * ZOOM + 1, 40 - 2, 20 - 2);
      }
    }
  };

  Game.prototype.set = function(x, y, id) {
    if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) {
      return;
    }
    if (this.grid[y*WIDTH + x] !== id) {
      this.dirtyX.push(x);
      this.dirtyY.push(y);
      this.dirtyId.push(id);
      this.dirtyGrid[y*WIDTH + x] = true;
    }
  };

  Game.prototype.pause = function() {
  };

  Game.prototype.keyDown = function(key) {
    if (key > 48 && key < 58) {
      this.selected = key-48;
    } else if (key === 48) {
      this.selected = 0;
    }

    return true;
  };

  Game.prototype.keyUp = function(key) {
  };

  return Game;
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