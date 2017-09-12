var WIDTH = 19,
    HEIGHT = 19,
    TILE_SIZE = 30;

var BLACK = 0,
    WHITE = 1;

var BACKGROUND = "rgb(240, 198, 98)";

var KOMI = 6.5;
var HANDICAP = 0;

var Game = (function() {

  function Game($canvas) {
    this.board = new Board($canvas, WIDTH, HEIGHT);
  }

  return Game;
})();

var Board = (function() {

  function Board($canvas, width, height) {
    var x, y;

    this.$canvas = $canvas;
    this.ctx = $canvas[0].getContext("2d");

    $canvas[0].width = width * TILE_SIZE;
    $canvas[0].height = height * TILE_SIZE;

    $("body")
      .css({ backgroundColor: BACKGROUND })
      .append(
"<div id='side-bar' style='position: absolute; left: " + width * TILE_SIZE + "px; top: " + TILE_SIZE + "px'>\
  <p id='colour'></p>\
  <p id='score'></p>\
  <button id='pass-button'>Pass</button>\
</div>")
    this.width = width;
    this.height = height;

    var grid = [], liberties = [], territory = [];
    this.grid = grid, this.liberties = liberties, this.territory = territory;
    liberties[BLACK] = [];
    liberties[WHITE] = [];
    for (y=0; y < height; ++y) {
      grid[y] = [];
      liberties[BLACK][y] = [];
      liberties[WHITE][y] = [];
      territory[y] = [];
    }

    this.positions = {};
    this.history = [];
    this.turn = 1;
    this.colour = BLACK;
    this.score = [0, KOMI];

    var top, left, rect = $canvas[0].getBoundingClientRect();
    top = rect.top;
    left = rect.left;
    $canvas.click(function(e) {
      var x = Math.floor((e.clientX - left) / TILE_SIZE);
      var y = Math.floor((e.clientY - top) / TILE_SIZE);
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.select(x, y);
      }
    }.bind(this));

    $("#pass-button").click(function(e) {
      this.update();
    }.bind(this));

    this.render();
  }

  Board.prototype.select = function(x, y) {
    if (this.grid[y][x] == null) {
      this.grid[y][x] = this.colour;
      this.previousMove = [x, y];
      this.update();
    }
  }

  Board.prototype.update = function() {

    // Capture enemy pieces
    this.removeCapturedPieces(this.colour === BLACK ? WHITE : BLACK);

    // Prevent repeated positions
    var s = this.toString(this.grid);
    if (this.positions[s]) {
      this.grid = this.fromString(this.history[this.history.length-1]);
      return;
    }

    // Prevent self-capture
    var preCount = this.countPieces(this.colour);
    this.removeCapturedPieces(this.colour === BLACK ? BLACK : WHITE);
    var postCount = this.countPieces(this.colour);
    if (postCount < preCount) {
      this.grid = this.fromString(this.history[this.history.length-1]);
      return;
    }

    // Append to history
    this.positions[s] = true;
    this.history.push(s);

    this.colour = this.colour === BLACK ? WHITE : BLACK;
    this.turn++;

    // Player's turn
    $("#colour").text(
          "Turn " + this.turn + ": " +
          (this.colour === BLACK ? "Black" : "White") + " to play.")

    // Update score
    var territory = this.calculateTerritory();
    if (this.turn > 1) {
      var score = this.score[0] + territory[0] - this.score[1] - territory[1];
      $("#score").text( 
          (score > 0 ? "Black" : "White") + " is winning: " + score);
    }
    this.render()
  }

  Board.prototype.render = function() {
    this.ctx.clearRect(0, 0, this.$canvas[0].width, this.$canvas[0].height);
    this.renderBoard();
    this.renderPreviousMove();
    // this.renderLiberties();
    // this.renderTerritory();
    this.renderPieces();
  }

  Board.prototype.toString = function(grid) {
    var x, y, s = "", width = this.width, height = this.height;
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        s += grid[y][x] == null ? "-" : grid[y][x];
      }
      s += "\n";
    }
    return s;
  }

  Board.prototype.fromString = function(s) {
    var x, y, i = 0, colour, grid = [], width = this.width, height = this.height;
    for (y = 0; y < height; y++) {
      grid[y] = [];
      for (x = 0; x < width; x++) {
        colour = s.charAt(i++);
        grid[y][x] = colour === "-" ? undefined : parseInt(colour);
      }
      i++;
    }
    return grid;
  }

  Board.prototype.renderBoard = function() {
    var i, ctx = this.ctx;

    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, this.$canvas[0].width, this.$canvas[0].height);

    ctx.translate(Math.floor(TILE_SIZE/2)+0.5, Math.floor(TILE_SIZE/2)+0.5);
    ctx.beginPath();

    for (i = 0; i < this.width; i++) {
      ctx.moveTo(i * TILE_SIZE, 0);
      ctx.lineTo(i * TILE_SIZE, (this.height - 1) * TILE_SIZE);
    }

    for (i = 0; i < this.height; i++) {
      ctx.moveTo(0, i * TILE_SIZE);
      ctx.lineTo((this.width - 1) * TILE_SIZE, i * TILE_SIZE);
    }

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "#000";
    ctx.stroke();

    var dots = [];
    switch (this.width) {
      case 19:
        dots = [[3, 3],  [9, 3],  [15, 3],
                [3, 9],  [9, 9],  [15, 9],
                [3, 15], [9, 15], [15, 15]];
        break;
      case 13:
        dots = [[3, 3],         [9, 3],
                        [6, 6],
                [3, 9],         [9, 9]];
        break;
      case 9:
        dots = [[2, 2], [6, 2],
                [2, 6], [6, 6]];
        break;
    }

    ctx.fillStyle = "#000";
    for (i = 0; i < dots.length; i++) {
      var x = dots[i][0], y = dots[i][1];
      ctx.beginPath();
      ctx.arc(x * TILE_SIZE, y * TILE_SIZE, 2, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  Board.prototype.renderPreviousMove = function() {
    var i, ctx = this.ctx;

    if (this.previousMove == null) {
      return;
    }

    ctx.translate(Math.floor(TILE_SIZE/2)+0.5,
                  Math.floor(TILE_SIZE/2)+0.5);

    var grid = this.grid,
        height = this.height,
        width = this.width,
        x = this.previousMove[0],
        y = this.previousMove[1];

    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.arc(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE/2 + 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  Board.prototype.renderPieces = function() {
    var i, ctx = this.ctx;

    ctx.translate(Math.floor(TILE_SIZE/2)+0.5,
                  Math.floor(TILE_SIZE/2)+0.5);

    var grid = this.grid,
        height = this.height,
        width = this.width;
    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (grid[y][x] != null) {
          ctx.beginPath();
          ctx.fillStyle = grid[y][x] === BLACK ? "black" : "white";
          ctx.strokeStyle = "black";
          ctx.arc(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE/2, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  Board.prototype.renderTerritory = function() {
    var i, ctx = this.ctx;

    this.calculateTerritory();

    ctx.translate(Math.floor(TILE_SIZE/2)+0.5,
                  Math.floor(TILE_SIZE/2)+0.5);

    var territory = this.territory,
        height = this.height,
        width = this.width,
        black, white;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        if (territory[y][x] != null) {
          ctx.beginPath();
          ctx.fillStyle = territory[y][x] === BLACK ? "black" : "white";
          ctx.arc(x * TILE_SIZE, y * TILE_SIZE, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  Board.prototype.renderLiberties = function() {
    var i, ctx = this.ctx;

    this.calculateLiberties();

    ctx.translate(Math.floor(TILE_SIZE/2)+0.5,
                  Math.floor(TILE_SIZE/2)+0.5);

    var liberties = this.liberties,
        height = this.height,
        width = this.width,
        black, white;

    for (var y = 0; y < height; y++) {
      for (var x = 0; x < width; x++) {
        black = liberties[BLACK][y][x];
        white = liberties[WHITE][y][x];

        if (black && white) {
          ctx.beginPath();
          ctx.fillStyle = "black";
          ctx.arc(x * TILE_SIZE - 4, y * TILE_SIZE - 4, 5, 0, 2 * Math.PI);
          ctx.fill();
          ctx.beginPath();
          ctx.fillStyle = "white";
          ctx.arc(x * TILE_SIZE + 4, y * TILE_SIZE + 4, 5, 0, 2 * Math.PI);
          ctx.fill();
        } else if (black || white) {
          ctx.beginPath();
          ctx.fillStyle = black ? "black" : "white";
          ctx.arc(x * TILE_SIZE, y * TILE_SIZE, 5, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  Board.prototype.removeCapturedPieces = function(colour) {
    var x, y, i, height = this.height, width = this.width, 
        grid = this.grid, liberties,
        group, visited = [];

    for (y = 0; y < height; y++) {
      visited[y] = [];
    }

    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (visited[y][x] || grid[y][x] == null || grid[y][x] !== colour) {
          continue;
        }
        group = this.findGroup(x, y, visited);
        liberties = 0;
        for (i = 0; i < group.length; i++) {
          liberties += this.countLiberties(group[i][0], group[i][1]);
        }
        if (liberties === 0) {
          this.removeGroup(group);
        }
      }
    }
  }

  Board.prototype.removeGroup = function(group) {
    var i, grid = this.grid, colour = grid[group[0][1]][group[0][0]];
    this.score[colour === BLACK ? WHITE : BLACK] += group.length;
    for (i = 0; i < group.length; i++) {
      grid[group[i][1]][group[i][0]] = undefined;
    }
  }

  Board.prototype.findGroup = function(x, y, visited) {
    if (visited[y][x]) {
      return [];
    }
    visited[y][x] = true;

    var _x, _y, i, grid = this.grid,
        width = this.width, height = this.height, 
        neighbours = [[-1, 0], [0, -1], [1, 0], [0, 1]];

    var group = [[x, y]];
    for (i = 0; i < neighbours.length; i++) {
      _x = x + neighbours[i][0];
      _y = y + neighbours[i][1];
      if (_x >= 0 && _x < width && _y >= 0 && _y < height &&
          grid[_y][_x] === grid[y][x]) {
        group = group.concat(this.findGroup(_x, _y, visited));
      }
    }
    return group;
  }

  Board.prototype.whoseTerritory = function(group) {
    var colour, black = false, white = false, i, j, grid = this.grid,
        width = this.width, height = this.height, x, y, _x, _y,
        neighbours = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    
    for (i = 0; i < group.length; i++) {
      x = group[i][0];
      y = group[i][1];
      for (j = 0; j < neighbours.length; j++) {
        if (black && white) {
          return;
        }
        _x = x + neighbours[j][0];
        _y = y + neighbours[j][1];
        if (_x >= 0 && _x < width && _y >= 0 && _y < height &&
            grid[_y][_x] != null) {
          colour = grid[_y][_x];
          if (colour === BLACK) {
            black = true;
          } else if (colour === WHITE) {
            white = true;
          }
        }
      }
    }
    if (!black && !white || black && white) {
      return;
    }
    return black ? BLACK : WHITE;
  }

  Board.prototype.countPieces = function(colour) {
    var x, y, count = 0, grid = this.grid,
        width = this.width, height = this.height;
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (grid[y][x] === colour) {
          count++;
        }
      }
    }
    return count;
  }

  Board.prototype.countLiberties = function(x, y) {
    var _x, _y, i, grid = this.grid, liberties = 0,
        width = this.width, height = this.height,
        neighbours = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    for (i = 0; i < neighbours.length; i++) {
      _x = x + neighbours[i][0];
      _y = y + neighbours[i][1];
      if (_x >= 0 && _x < width && _y >= 0 && _y < height &&
          grid[_y][_x] == null) {
        liberties++;
      }
    }
    return liberties;
  }

  Board.prototype.calculateTerritory = function() {
    var x, y, i, group, colour, black = 0, white = 0,
        width = this.width, height = this.height, visited = [],
        grid = this.grid, territory = this.territory,
        neighbours = [[-1, 0], [0, -1], [1, 0], [0, 1]];

    for (y = 0; y < height; y++) {
      visited[y] = [];
    }

    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (visited[y][x]) {
          continue;
        } else if (grid[y][x] != null) {
          territory[y][x] = grid[y][x];
          visited[y][x] = true;
        } else {
          group = this.findGroup(x, y, visited);
          colour = this.whoseTerritory(group);
          for (i = 0; i < group.length; i++) {
            territory[group[i][1]][group[i][0]] = colour;
          }
        }
      }
    }

    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (territory[y][x] === BLACK) {
          black++;
        } else if (territory[y][x] === WHITE) {
          white++;
        }
      }
    }
    return [black, white];
  }

  Board.prototype.calculateLiberties = function() {
    var x, y, _x, _y, i,
        width = this.width, height = this.height,
        grid = this.grid, liberties = this.liberties,
        neighbours = [[-1, 0], [0, -1], [1, 0], [0, 1]];
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        liberties[BLACK][y][x] = 0;
        liberties[WHITE][y][x] = 0;
      }
    }

    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (grid[y][x] != null) {
          for (i = 0; i < neighbours.length; i++) {
            _x = x + neighbours[i][0];
            _y = y + neighbours[i][1];
            if (_x >= 0 && _x < width && _y >= 0 && _y < height &&
                grid[_y][_x] == null) {
              liberties[grid[y][x]][_y][_x] = true;
            }
          }
        }
      }
    }

    var black = 0, white = 0;
    for (y = 0; y < height; y++) {
      for (x = 0; x < width; x++) {
        if (liberties[BLACK][y][x]) {
          black++;
        }
        if (liberties[WHITE][y][x]) {
          white++;
        }
      }
    }

    return [black, white];
  }

  return Board;
})();

(function() {
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

  Function.prototype.call = Function.prototype.call != null ? Function.prototype.call : function(ctx) {
    return this.apply(ctx, arguments);
  }

})();