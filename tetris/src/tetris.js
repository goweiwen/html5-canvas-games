var MODE = "GARBAGE", 
    MODES = ["UNLIMITED", "SPRINT", "ULTRA", "SURVIVAL", "20G", "GARBAGE", "PHANTOM"]
    LEVEL = 1,
    WIDTH = 10,
    HEIGHT = 22,
    HIDDENROWS = 2,
    SHAPE = {I: 0, J: 1, L: 2, O: 3, S: 4, Z: 5, T: 6, 'G': 7},
    SHAPEID = ["I", "J", "L", "O", "S", "Z", "T", "G"],
    DIR = {UP: 0, RIGHT: 1, DOWN: 2, LEFT: 3},
    keyboardMap = ["","","","CANCEL","","","HELP","","BACK_SPACE","TAB","","","CLEAR","ENTER","RETURN","","SHIFT","CONTROL","ALT","PAUSE","CAPS_LOCK","KANA","EISU","JUNJA","FINAL","HANJA","","ESCAPE","CONVERT","NONCONVERT","ACCEPT","MODECHANGE","SPACE","PAGE_UP","PAGE_DOWN","END","HOME","LEFT","UP","RIGHT","DOWN","SELECT","PRINT","EXECUTE","PRINTSCREEN","INSERT","DELETE","","0","1","2","3","4","5","6","7","8","9","COLON","SEMICOLON","LESS_THAN","EQUALS","GREATER_THAN","QUESTION_MARK","AT","A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","WIN","","CONTEXT_MENU","","SLEEP","NUMPAD0","NUMPAD1","NUMPAD2","NUMPAD3","NUMPAD4","NUMPAD5","NUMPAD6","NUMPAD7","NUMPAD8","NUMPAD9","MULTIPLY","ADD","SEPARATOR","SUBTRACT","DECIMAL","DIVIDE","F1","F2","F3","F4","F5","F6","F7","F8","F9","F10","F11","F12","F13","F14","F15","F16","F17","F18","F19","F20","F21","F22","F23","F24","","","","","","","","","NUM_LOCK","SCROLL_LOCK","WIN_OEM_FJ_JISHO","WIN_OEM_FJ_MASSHOU","WIN_OEM_FJ_TOUROKU","WIN_OEM_FJ_LOYA","WIN_OEM_FJ_ROYA","","","","","","","","","","CIRCUMFLEX","EXCLAMATION","DOUBLE_QUOTE","HASH","DOLLAR","PERCENT","AMPERSAND","UNDERSCORE","OPEN_PAREN","CLOSE_PAREN","ASTERISK","PLUS","PIPE","HYPHEN_MINUS","OPEN_CURLY_BRACKET","CLOSE_CURLY_BRACKET","TILDE","","","","","VOLUME_MUTE","VOLUME_DOWN","VOLUME_UP","","","","","COMMA","","PERIOD","SLASH","BACK_QUOTE","","","","","","","","","","","","","","","","","","","","","","","","","","","OPEN_BRACKET","BACK_SLASH","CLOSE_BRACKET","QUOTE","","META","ALTGR","","WIN_ICO_HELP","WIN_ICO_00","","WIN_ICO_CLEAR","","","WIN_OEM_RESET","WIN_OEM_JUMP","WIN_OEM_PA1","WIN_OEM_PA2","WIN_OEM_PA3","WIN_OEM_WSCTRL","WIN_OEM_CUSEL","WIN_OEM_ATTN","WIN_OEM_FINISH","WIN_OEM_COPY","WIN_OEM_AUTO","WIN_OEM_ENLW","WIN_OEM_BACKTAB","ATTN","CRSEL","EXSEL","EREOF","PLAY","ZOOM","","PA1","WIN_OEM_CLEAR",""],
    KEYS = {
        hard: [87, 38],
        soft: [83, 40],
        left: [65, 37],
        right: [68, 39],
        r_ccw: [70, 90],
        r_cw: [71, 88],
        hold: [72, 67],
        pause: [27]
      };

var Game = (function() {

  function Game($game) {

    this.delay = {
      ARE: 0,
      DAS: 120,
      ARR: 0,
      lock: 2000,
      lineClear: 0,
      gravity: 2000,
      softDrop: 0,
      garbage: 5000
    }
    this.when = {
      gravity: null
    }

    // stats
    this.stats = {
      tetrimino: 0,

      lineClear: 0,
      single: 0,
      double: 0,
      triple: 0,
      tetris: 0,
      tspin: 0,
      tspinmini: 0,
      tspinsingle: 0,
      tspindouble: 0,
      tspintriple: 0,

      action: 0,
      hold: 0,
      rotate: 0,

      attack: 0,
      score: 0,
      combo: 0,
      b2b: 0,

      garbage: 0
    }

    // initialise grid
    this.grid = [];
    for (y=0; y<HEIGHT; ++y) {
      var row = [];
      for (x=0; x<WIDTH; ++x) {
        row.push(null);
      }
      this.grid.push(row);
    }

    // boooring rendering
    this.$game = $game;
    this.$game.prepend('<table cellspacing="0" class="grid"><tbody tabindex="1"></tbody></table>');
    this.$grid = this.$game.children('.grid').children('tbody');
    this.$grid.append(
      ('<tr>' + 
        '<td></td>'.repeat(WIDTH) + 
      '</tr>').repeat(HEIGHT - HIDDENROWS)
    );

    this.$grid.parent().before('<table cellspacing="0" class="hold"><tbody></tbody></table>');
    this.$hold = this.$game.children('.hold').children('tbody');
    this.$hold.append(
      ('<tr>' + 
        '<td></td>'.repeat(4) + 
      '</tr>').repeat(3)
    );

    this.$grid.parent().after('<table cellspacing="0" class="nextPieceQueue"><tbody></tbody></table>');
    this.$nextPieceQueue = this.$game.children('.nextPieceQueue').children('tbody');
    this.$nextPieceQueue.append(
      ('<tr>' + 
        '<td></td>'.repeat(4) + 
      '</tr>') +
      ('<tr>' + 
        '<td></td>'.repeat(4) + 
      '</tr>').repeat(3).repeat(5)
    );

    this.$nextPieceQueue.parent().after(
      '<div class="stats"> \
         Mode: <span class="mode">'+MODE+'</span><br/>\
         Level: <span class="level">'+LEVEL+'</span><br/>\
         Time: <span class="time"></span>s<br/>\
         Line Clear: <span class="lineClear"></span><br/>\
         Score: <span class="score"></span><br/>\
         T-spin Triple: <span class="tspintriple"></span><br/>\
         T-spin Double: <span class="tspindouble"></span><br/>\
         T-spin Single: <span class="tspinsingle"></span><br/>\
         T-spin: <span class="tspin"></span><br/>\
         Tetris: <span class="tetris"></span><br/>\
         Triple: <span class="triple"></span><br/>\
         Double: <span class="double"></span><br/>\
         Single: <span class="single"></span><br/>\
         Max Combo: <span class="combo"></span><br/>\
         Back-to-Back: <span class="b2b"></span><br/>\
       </div>'
    );
    this.$stats = this.$game.children('.stats');

    // rotation system
    this.rotationSystem = new SRS();

    // nextPiece Generator
    while (true) {
      this.randomGenerator = new BagGenerator();
      var nextPieceQueue = [];
      for (var i=0; i<5; ++i) {
        nextPieceQueue.push(this.randomGenerator.next());
      }
      nextPieceQueue = nextPieceQueue.reverse();
      if (nextPieceQueue[nextPieceQueue.length-1] !== SHAPE.S
          && nextPieceQueue[nextPieceQueue.length-1] !== SHAPE.Z) {
        this.nextPieceQueue = nextPieceQueue;
        break;
      }
    }
    
    this.canHold = true;
    this.combo = 0;
    this.newPiece(this.nextPiece());
    
    // setting keys
    this.updateKeys(KEYS);
    this.isDown = {};
    this.isPhysicallyDown = {};

    // bind keys
    $game.keydown((function(e) {
      if (e.target.tagName !== 'input' && e.target.tagName !== 'textarea') {
        return this.keyDown(e.which);
      }
    }).bind(this));
    $game.keyup((function(e) {
      if (e.target.tagName !== 'input' && e.target.tagName !== 'textarea') {
        return this.keyUp(e.which);
      }
    }).bind(this));
    this.$grid.focus();

    if (MODE === "GARBAGE") {
      this.delay.garbage = 5000;
      this.garbageLine();
    } else if (MODE === "20G") {
      this.delay.gravity = 0;
    }

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

    this.pause();

  };

  Game.prototype.update = function(t) {

    this.t = t; 

    this.ARE(t);
    this.gravity(t);
    this.tryLock(t);

    if (MODE === "GARBAGE") {
      this.garbage(t);
    }

    this.readKeys(t);

    if (!this.paused) {
      this.getStats(t);
    }
  };

  Game.prototype.readKeys = function(t) {
    if (this.shape == null) {
      return;
    }

    var down = this.isDown;
        physical = this.isPhysicallyDown
        stats = this.stats;
    
    // hold
    if (down.hold) {

      this.holdPiece();

      down.hold = undefined;
      ++stats.action;
      ++stats.hold;

    }

    // hard drop
    if (down.hard) {

      this.hardDrop(t);

      down.hard = undefined;
      ++stats.action;

    }

    // soft drop
    if (physical.soft) {

      this.softDrop(t);

      if (down.softDrop) {
        down.softDrop = undefined;
        ++stats.action;
      }

    } else {

      this.when.softDrop = undefined;

    }

    if (this.DAS != null) {

      if (this.DAS === DIR.LEFT && !physical.left || this.DAS === DIR.RIGHT && !physical.right) {

        this.DAS = undefined;

      } else if (this.when.DAS != null) {

        if (this.when.DAS < t) {
          this.when.DAS = undefined;
          this.when.ARR = t;
        }

      } else {

        var offset;
        if (this.DAS === DIR.LEFT) {
          offset = new V(-1, 0);
        } else {
          offset = new V(1, 0);
        }

        while (this.when.ARR < t) {

          this.when.ARR += this.delay.ARR;

          pos = this.pos.add(offset);
          if (!this.move(pos)) {
            break;
          }
        }
      }
    }

    if (down.left) {

      pos = this.pos.add(new V(-1, 0));
      this.move(pos);

      if (this.DAS == null || this.DAS !== DIR.LEFT) {
        this.when.DAS = t + this.delay.DAS;
        this.when.ARR = undefined;
        this.DAS = DIR.LEFT;
      }

      down.left = undefined;
      ++stats.action;

    } else if (down.right) {

      pos = this.pos.add(new V(1, 0));
      this.move(pos);

      if (this.DAS == null || this.DAS !== DIR.RIGHT) {
        this.when.DAS = t + this.delay.DAS;
        this.when.ARR = undefined;
        this.DAS = DIR.RIGHT;
      }

      down.right = undefined;
      ++stats.action;

    } else if (down.r_ccw) {

      this.rotate((this.rot+3) % 4)

      down.r_ccw = undefined;
      ++stats.action;
      ++stats.rotate;

    } else if (down.r_cw) {

      this.rotate((this.rot+1) % 4)

      down.r_cw = undefined;
      ++stats.action;
      ++stats.rotate;

    }

  };

  Game.prototype.gravity = function(t) {

    if (this.shape == null) {
      return true;
    }

    var when = this.when,
        gravity = this.delay.gravity;

    if (when.gravity == null) {
      when.gravity = t + gravity;
    }

    while (when.gravity < t) {

      when.gravity += gravity;

      if (!this.drop(t)) {
        break;
      }

    }

  };

  Game.prototype.drop = function(t) {
    var pos = this.pos.add(new V(0, 1));

    if (!this.move(pos)) {
      this.startLock(t);
      return false;
    }

    return true;
  };

  Game.prototype.startLock = function(t) {
    var when = this.when;

    if (when.lock == null) {
      when.lock = t + this.delay.lock;
    }

    return true;
  };

  Game.prototype.tryLock = function(t) {

    if (this.shape == null) {
      return;
    }

    if (this.when.lock != null && this.when.lock < t) {
      this.lock(t);
    }

    return true;
  };

  Game.prototype.lock = function(t) {

    this.when.lock = null;

    var shape = this.shape,
        positions = this.rotationSystem.positions(this.pos, this.shape, this.rot);

    for (var i=0; i<positions.length; ++i) {
      var pos = positions[i];

      this.setTile(pos, shape);

      // var alreadyinside = false;
      // for (var j=0; j<rows.length; ++j) {
      //   if (rows[j] === pos.y) {
      //     alreadyinside = true;
      //     break;
      //   }
      // }
      // 
      // if (!alreadyinside) {
      //   rows.push(pos.y);
      // }
    }
    this.clearLines();
    this.shape = null;

    this.DAS = undefined;
    ++this.stats.tetrimino;


    if (MODE === "GARBAGE") {
      var when = this.when,
          garbage = this.delay.garbage;
      while (when.garbage < t) {
        when.garbage += garbage;
        
        this.garbageLine(Math.floor(1 + Math.random() * Math.pow(1.01, LEVEL)), true);
      }
      this.delay.garbage = 5000 / (Math.pow(1.001, LEVEL));
    } else if (MODE === "SURVIVAL") {
      LEVEL = Math.floor(this.stats.lineClear/4);
      if (LEVEL >= 50) {
        this.delay.gravity = 0;
      } else {
        this.delay.gravity = 2000 / (Math.pow(1.1, LEVEL));
      }
    }

    return true;
  };

  Game.prototype.move = function(pos) {

    if (this.shape == null) {
      return false;
    }

    if (!this.canMove(pos)) {
      return false;
    }

    this.pos = pos;
    this.spin = false;

    this.render();

    return true;
  };

  Game.prototype.rotate = function(rot) {

    if (this.shape == null) {
      return;
    }

    var offset = this.rotateOffset(rot);
    if (!offset) {
      return;
    }

    this.rot = rot;
    this.move(this.pos.sub(offset));
    this.spin = true;
    this.when.lock = null;

    this.render();

    return true;
  };

  Game.prototype.hardDrop = function(t) {

    for (var i=0; i<HEIGHT; ++i) {
      if (!this.drop(t)) {
        break;
      }
      this.addScore(2);
    }

    this.lock(t);

  };

  Game.prototype.softDrop = function(t) {

    var when = this.when,
        delay = this.delay;

    if (when.softDrop == null) {
      when.softDrop = t;
    }

    while (when.softDrop < t) {

      when.gravity = t + delay.gravity;
      when.softDrop = when.softDrop + delay.softDrop;
      
      if (!this.drop(t)) {
        return;
      }
      this.addScore(1);

    }

  };

  Game.prototype.holdPiece = function() {

    if (!this.canHold) {
      return;
    }
    this.canHold = false;

    var _pos = this.pos,
        _rot = this.rot,
        _shape = this.shape;

    this._shape = _shape;

    if (this.hold != null) {
      this.newPiece(this.hold);
    } else {
      this.newPiece(this.nextPiece());
    }

    this._pos = _pos;
    this._rot = _rot;

    this.hold = _shape;

    this.renderHold();
    this.render();

  };

  Game.prototype.canMove = function(pos) {

    if (this.shape == null) {
      return false;
    }

    return this.canPlace(pos, this.rot);
  };

  Game.prototype.rotateOffset = function(rot) {

    if (this.shape == null) {
      return false;
    }

    var offsets = this.rotationSystem.rotateOffsets(this.shape, this.rot, rot);
    for (i=0; i<offsets.length; ++i) {
      var offset = offsets[i];
      if (this.canPlace(this.pos.sub(offset), rot)) {
        return offset;
      }
    }
    
    return false;
  };

  Game.prototype.canPlace = function(pos, rot) {
    var positions = this.rotationSystem.positions(pos, this.shape, rot);

    for (var i=0; i<positions.length; ++i) {
      if (this.getTile(positions[i]) != null) {
        return false;
      }
    }

    return true;
  };

  Game.prototype.getTile = function(pos) {
    var x = pos.x,
        y = pos.y;

    if ((0 <= y && y < HEIGHT) && (0 <= x && x < WIDTH)) {
      return this.grid[y][x];
    } else {
      return SHAPE.O;
    }
  };

  Game.prototype.setTile = function(pos, shape) {
    var x = pos.x,
        y = pos.y;

    if ((0 <= y && y < HEIGHT) && (0 <= x && x < WIDTH)) {
      this.grid[y][x] = shape;
    } else {
      return false;
    }
    
    this.draw(pos, shape, "locked");
    return true;
  };

  Game.prototype.clearLines = function() {

    var isTspin = this.isTspin();

    var linesCleared = 0;
    for (var i=0; i<HEIGHT; ++i) {
      if (this.clearLine(i)) {
        ++linesCleared;
      }
    }

    ++this.combo;
    if (isTspin) {
      ++this.stats.tspin;
      switch (linesCleared) {
        case 0:
          this.combo = 0;
          break;
        case 1:
          this.addScore(800 * LEVEL  +  50 * this.combo * LEVEL);
          this.sendLines(2);
          ++this.stats.tspinsingle;
          //++this.stats.single;
          break;
        case 2:
          if (this.b2b) {
            this.addScore(1.5 * 1200 * LEVEL  +  50 * this.combo * LEVEL);
            this.sendLines(6);
            ++this.stats.b2b;
          } else {
            this.addScore(1200 * LEVEL);
            this.sendLines(4);
          }
          ++this.stats.tspindouble;
          //++this.stats.double;
          this.b2b = true;
          break;
        case 3:
          if (this.b2b) {
            this.addScore(1.5 * 1600 * LEVEL  +  50 * this.combo * LEVEL);
            this.sendLines(9);
            ++this.stats.b2b;
          } else {
            this.addScore(1600 * LEVEL);
            this.sendLines(6);
          }
          ++this.stats.tspintriple;
          //++this.stats.triple;
          this.b2b = true;
          break;
      }
    } else {
      switch (linesCleared) {
        case 0:
          this.combo = 0;
          break;
        case 1:
          this.addScore(100 * LEVEL  +  50 * this.combo * LEVEL);
          this.b2b = false;
          ++this.stats.single;
          break;
        case 2:
          this.addScore(200 * LEVEL  +  50 * this.combo * LEVEL);
          this.b2b = false;
          this.sendLines(1);
          ++this.stats.double;
          break;
        case 3:
          this.addScore(500 * LEVEL  +  50 * this.combo * LEVEL);
          this.b2b = false;
          this.sendLines(2);
          ++this.stats.triple;
          break;
        case 4:
          this.addScore(800 * LEVEL  +  50 * this.combo * LEVEL);
          if (this.b2b) {
            this.sendLines(6);
            ++this.stats.b2b;
          } else {
            this.sendLines(4);
          }
          ++this.stats.tetris;
          this.b2b = true;
          break;
      }
    }
    if (linesCleared > 0) {
      this.stats.lineClear += linesCleared;
      if (this.combo > this.stats.combo) {
        this.stats.combo = this.combo;
      }
      this.when.lineClear = this.t + this.delay.lineClear;
    }
  };

  Game.prototype.clearLine = function(row) {
    var grid = this.grid;

    for (var x=0; x<WIDTH; ++x) {
      if (this.getTile(new V(x, row)) == null) {
        return false;
      }
    }

    grid.splice(row, 1);
    var blankRow = [];
    for (var i=0; i<WIDTH; ++i) {
      blankRow.push(null);
    }
    grid.splice(0, 0, blankRow);

    for (var y=0; y<HEIGHT; ++y) {
      for (var x=0; x<WIDTH; ++x) {
        var pos = new V(x, y);
        this.draw(pos, this.getTile(pos), "locked");
      } 
    }
    if (MODE === "GARBAGE" && row === 21) {
      this.when.garbage = this.t-1;
    }

    return true;
  };

  Game.prototype.garbage = function(t) {

    var when = this.when,
        garbage = this.delay.garbage;

    if (when.garbage == null) {
      when.garbage = t + garbage;
    }

  };

  Game.prototype.garbageLine = function(holes, together) {
    var grid = this.grid;

    if (holes == null) {
      holes = 1;
    }

    var holeColumns = [];
    if (holes > 1 && together) {
      holeColumns.push(Math.floor(Math.random() * (10-holes)));
      for (var i=1; i<holes; ++i) {
        holeColumns.push(holeColumns[i-1]+1);
      }
    } else {
      for (var i=0; i<holes; ++i) {
        var column = Math.floor(Math.random() * (10-i));
        if (i !== 0 && column === holeColumns[i-1]) {
          ++column;
        }
        holeColumns.push(column);
      }
    }

    grid.splice(0, 1);
    var garbageRow = [];
    for (var i=0; i<WIDTH; ++i) {
      var isHole = false;
      for (var j=0; j<holeColumns.length; ++j) {
        if (i === holeColumns[j]) {
          garbageRow.push(null);
          isHole = true;
          break;
        }
      }
      if (!isHole) {
        garbageRow.push(7);
      }
    }
    grid.push(garbageRow);

    for (var y=0; y<HEIGHT; ++y) {
      for (var x=0; x<WIDTH; ++x) {
        var pos = new V(x, y);
        this.draw(pos, this.getTile(pos), "locked");
      } 
    }

    ++this.stats.garbage;
    ++LEVEL;

    return true;
  };

  Game.prototype.isTspin = function() {
    if (!this.spin || this.shape !== SHAPE.T) {
      return false;
    }

    var corners = 0;
    var pos = this.pos;
    if (this.getTile(pos.add(new V(0, 0))) != null) {
      ++corners;
    }
    if (this.getTile(pos.add(new V(2, 0))) != null) {
      ++corners;
    }
    if (this.getTile(pos.add(new V(0, 2))) != null) {
      ++corners;
    }
    if (this.getTile(pos.add(new V(2, 2))) != null) {
      ++corners;
    }
    if (corners >= 3) {
      return true;
    }
  }


  Game.prototype.draw = function(pos, shape, classes) {

    if (pos.y < HIDDENROWS) {
      return;
    }

    var $cell = this.$grid
      .children().eq(pos.y - HIDDENROWS)
      .children().eq(pos.x)
      .removeClass();

    if (shape != null) {
      $cell.addClass(SHAPEID[shape]);
      $cell.addClass(classes);

      if (MODE === "PHANTOM" && classes === "locked") {
        $cell.addClass("invisible");
      }
    }

    return true;
  };

  Game.prototype.drawHold = function(pos, shape) {

    var $cell = this.$hold
      .children().eq(pos.y)
      .children().eq(pos.x)
      .removeClass();

    if (shape != null) {
      $cell.addClass(SHAPEID[shape]);
    }

    return true;
  };

  Game.prototype.drawNextPieceQueue = function(n, pos, shape) {

    var $cell = this.$nextPieceQueue
      .children().eq(pos.y + (this.nextPieceQueue.length-n-1)*3)
      .children().eq(pos.x)
      .removeClass();

    if (shape != null) {
      $cell.addClass(SHAPEID[shape]);
    }

    return true;
  };

  Game.prototype.render = function() {

    this.renderGhost();

    var tiles = this.rotationSystem.positions(this._pos, this.shape, this._rot);
    for (var i=0; i<tiles.length; ++i) {
      this.draw(tiles[i]);
    }

    tiles = this.rotationSystem.positions(this.pos, this.shape, this.rot);
    for (var i=0; i<tiles.length; ++i) {
      this.draw(tiles[i], this.shape);
    }

    this._pos = this.pos;
    this._rot = this.rot;
    this._shape = this.shape;
  };

  Game.prototype.renderGhost = function() {

    var tiles;

    if (this._pos === this.pos && this._rot === this.rot && this._shape === this.shape) {
      return;
    }

    if (this.ghostpos != null && this.ghostrot != null) {

      tiles = this.rotationSystem.positions(this.ghostpos, this._shape, this.ghostrot);
      for (var i=0; i<tiles.length; ++i) {
        this.draw(tiles[i], this.getTile(tiles[i]), "locked");
      }

    }

    var pos = new V(0, 1);
    while (this.canMove(this.pos.add(pos))) {
      pos.y += 1;
    }
    pos.y -= 1;

    this.ghostpos = this.pos.add(pos);
    this.ghostrot = this.rot;

    tiles = this.rotationSystem.positions(this.ghostpos, this.shape, this.rot);
    for (var i=0; i<tiles.length; ++i) {
      this.draw(tiles[i], this.shape, "ghost");
    }

  }

  Game.prototype.renderHold = function() {

    if (this.hold == null) {
      return false;
    }

    var tiles = this.rotationSystem.positions(this._pos, this.hold, this._rot);
    for (var i=0; i<tiles.length; ++i) {
      this.draw(tiles[i]);
    }

    tiles = this.rotationSystem.positions(new V(0, 0), this.shape, 0);
    for (var i=0; i<tiles.length; ++i) {
      this.drawHold(tiles[i]);
    }

    tiles = this.rotationSystem.positions(new V(0, 0), this.hold, 0);
    for (var i=0; i<tiles.length; ++i) {
      this.drawHold(tiles[i], this.hold);
    }

    this._pos = this.pos;
    this._rot = this.rot;

  };

  Game.prototype.renderNextPieceQueue = function() {

    var nextPieceQueue = this.nextPieceQueue;

    var oldTiles = this.rotationSystem.positions(new V(0, 0), this.shape, 0);
    for (var j=0; j<oldTiles.length; ++j) {
      this.drawNextPieceQueue(nextPieceQueue.length-1, oldTiles[j]);
    }

    for (var i=nextPieceQueue.length-1; i>=0; --i) {
      var tiles = this.rotationSystem.positions(new V(0, 0), nextPieceQueue[i], 0);
      if (i === nextPieceQueue.length) {
        for (var j=0; j<tiles.length; ++j) {
          this.drawNextPieceQueue(i, tiles[j], nextPieceQueue[i]);
        }
      } else if (i !== 0) {
        for (var j=0; j<tiles.length; ++j) {
          this.drawNextPieceQueue(i, tiles[j], nextPieceQueue[i]);
          this.drawNextPieceQueue(i-1, tiles[j]);
        }
      } else {
        for (var j=0; j<tiles.length; ++j) {
          this.drawNextPieceQueue(i, tiles[j], nextPieceQueue[i]);
        }
      }
    }

  };

  Game.prototype.keyDown = function(key) {
    
    key = this.KEYSID[key];

    var down = this.isDown,
        physical = this.isPhysicallyDown;

    if (!physical[key]) {
      down[key] = true;
    }
    physical[key] = true;

    if (down.pause) {
      this.pause(true);
    }

    if (!this.finished
        && (down.hold
        || down.hard
        || down.soft
        || down.left
        || down.right
        || down.r_ccw
        || down.r_cw)) {
      this.pause(false);
    }

    return true;
  };

  Game.prototype.keyUp = function(key) {
    key = this.KEYSID[key];

    this.isDown[key] = undefined;
    this.isPhysicallyDown[key] = undefined;

    return true;
  };

  Game.prototype.updateKeys = function(keys) {

    this.KEYS = keys;

    var keyList;
    this.KEYSID = {};
    for (i in this.KEYS) {
      for (j in this.KEYS[i]) {
        this.KEYSID[this.KEYS[i][j]] = i;
      }
    }

  };

  Game.prototype.ARE = function(t) {

    if (this.shape != null) {
      return;
    }

    var when = this.when,
        delay = this.delay;

    if (when.ARE == null) {
      if (when.lineClear != null) {
        when.ARE = when.lineClear + delay.ARE;
        when.lineClear = undefined;
      } else {
        when.ARE = t + delay.ARE;
      }
    }

    if (when.ARE < t) {
      when.ARE = null;
      this.canHold = true;
      this.newPiece(this.nextPiece());
    }

  };

  Game.prototype.newPiece = function(shape) {
    this.shape = shape;
    this.pos = this.rotationSystem.startingState(shape);
    this.rot = 0;
    this._pos = this.pos;
    this._rot = this.rot;

    this.when.gravity = this.when.lock = null;
    this.render();
    this.renderNextPieceQueue();

    if (!this.canMove(this.pos)) {
      this.gameOver();
      return false;
    } else {
      return true;
    }
  };

  Game.prototype.nextPiece = function() {
    this.nextPieceQueue.splice(0, 0, this.randomGenerator.next());
    return this.nextPieceQueue.pop();
  };

  Game.prototype.updateStat = function(stat, val) {
    if (val == null) {
      val = this.stats[stat];
    }
    if (this.stats["_"+stat] == null || this.stats["_"+stat] !== val) {
      this.$stats.children("span."+stat).html(val);
      this.stats._stat = val;
    }
  };

  Game.prototype.getStats = function(t) {
    var stats = this.stats,
        time = t/1000;

    stats.time = time;

    /* for (i in stats) {
      if (stats.hasOwnProperty(i)) {
        console.log(i, ": ", stats[i]);
      }
    } */

    updateStat = this.updateStat.bind(this);

    updateStat("level", LEVEL);
    updateStat("tspintriple");
    updateStat("tspindouble");
    updateStat("tspinsingle");
    updateStat("tspin");
    updateStat("tetris");
    updateStat("triple");
    updateStat("double");
    updateStat("single");
    updateStat("b2b");
    updateStat("combo");
    updateStat("time", stats.time.toFixed(2));
    updateStat("score");
    updateStat("lineClear");

    if (this.finished) {
      stats.tpm = stats.tetrimino/time*60;
      stats.apt = stats.action/stats.tetrimino;
      stats.tspinPercent = stats.tspin/Math.floor(stats.tetrimino/7);
      stats.apm = stats.action/time*60;
      updateStat("attack");
      updateStat("tspinPercent", stats.tspinPercent.toFixed(2));
      updateStat("tetrimino");
      updateStat("tpm");
      updateStat("apm");
      updateStat("apt");
    }

    if (MODE === "ULTRA" && time >= 120) {
      this.finished = true;
      this.pause();
      alert(score);
    } else if (MODE === "SPRINT" && stats.lineClear >= 40) {
      this.finished = true;
      this.pause();
      alert(time);
    } else if (MODE === "UNLIMITED") {

    }

    return stats;
  };

  Game.prototype.addScore = function(score) {
    this.stats.score += score;
  };

  Game.prototype.sendLines = function(lines) {
    this.stats.attack += lines;
  };

  Game.prototype.pause = function(paused) {

    if (paused == null) {
      this.paused = true;
    } else if (this.paused == paused) {
      return;
    } else if (this.finished) {
      this.paused = true;
    } else {
      this.paused = paused;
    }

    if (this.paused === true) {
      this.$game.addClass('paused');
    } else {
      this.$game.removeClass('paused');
    }

  };

  Game.prototype.gameOver = function() {
    this.pause(true);
    this.finished = true;
  };

  return Game;
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

  return V;
})();

var BagGenerator = (function() {

  function BagGenerator(bag) {

    this.defaultBag = bag != null ? bag : [SHAPE.I, SHAPE.J, SHAPE.L, SHAPE.O, SHAPE.S, SHAPE.Z, SHAPE.T];
    this.bag = [];

  }

  BagGenerator.prototype.next = function() {

    if (this.bag.length === 0) {
      this.bag = this.defaultBag.slice(0);
      this.shuffle();
    }

    return this.bag.pop();
  };

  BagGenerator.prototype.shuffle = function() {

    var bag = this.bag,
  i, j, _t;

    for (i=bag.length-1; i>0; --i) {
      j = Math.floor(Math.random() * (i+1));
      _t = bag[i];
      bag[i] = bag[j];
      bag[j] = _t;
    }

    return bag;
  };

  return BagGenerator;

})();

var SRS = (function() {

  function SRS() {
    this.rotations = {};
    this.rotations[SHAPE.I] = [[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]];
    this.rotations[SHAPE.J] = [[1, 0, 0, 1, 1, 1, 0, 0, 0], [0, 1, 1, 0, 1, 0, 0, 1, 0], [0, 0, 0, 1, 1, 1, 0, 0, 1], [0, 1, 0, 0, 1, 0, 1, 1, 0]];
    this.rotations[SHAPE.L] = [[0, 0, 1, 1, 1, 1, 0, 0, 0], [0, 1, 0, 0, 1, 0, 0, 1, 1], [0, 0, 0, 1, 1, 1, 1, 0, 0], [1, 1, 0, 0, 1, 0, 0, 1, 0]];
    this.rotations[SHAPE.O] = [[0, 1, 1, 0, 1, 1, 0, 0, 0], [0, 0, 0, 0, 1, 1, 0, 1, 1], [0, 0, 0, 1, 1, 0, 1, 1, 0], [1, 1, 0, 1, 1, 0, 0, 0, 0]];
    this.rotations[SHAPE.S] = [[0, 1, 1, 1, 1, 0, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 0, 1], [0, 0, 0, 0, 1, 1, 1, 1, 0], [1, 0, 0, 1, 1, 0, 0, 1, 0]];
    this.rotations[SHAPE.Z] = [[1, 1, 0, 0, 1, 1, 0, 0, 0], [0, 0, 1, 0, 1, 1, 0, 1, 0], [0, 0, 0, 1, 1, 0, 0, 1, 1], [0, 1, 0, 1, 1, 0, 1, 0, 0]];
    this.rotations[SHAPE.T] = [[0, 1, 0, 1, 1, 1, 0, 0, 0], [0, 1, 0, 0, 1, 1, 0, 1, 0], [0, 0, 0, 1, 1, 1, 0, 1, 0], [0, 1, 0, 1, 1, 0, 0, 1, 0]];
    this.offsets = {};
    this.offsets[SHAPE.T] = [[new V(0, 0), new V(0, 0), new V(0, 0), new V(0, 0), new V(0, 0)], [new V(0, 0), new V(1, 0), new V(1, 1), new V(0, -2), new V(1, -2)], [new V(0, 0), new V(0, 0), new V(0, 0), new V(0, 0), new V(0, 0)], [new V(0, 0), new V(-1, 0), new V(-1, 1), new V(0, -2), new V(-1, -2)]];
    this.offsets[SHAPE.I] = [[new V(0, 0), new V(-1, 0), new V(2, 0), new V(-1, 0), new V(2, 0)], [new V(-1, 0), new V(0, 0), new V(0, 0), new V(0, -1), new V(0, 2)], [new V(-1, -1), new V(1, -1), new V(-2, -1), new V(1, 0), new V(-2, 0)], [new V(0, -1), new V(0, -1), new V(0, 1), new V(0, 2), new V(0, 2)]];
    this.offsets[SHAPE.O] = [[new V(0, 0)], [new V(0, 1)], [new V(-1, 1)], [new V(-1, 0)]];
    this.offsets[SHAPE.J] = this.offsets[SHAPE.L] = this.offsets[SHAPE.S] = this.offsets[SHAPE.Z] = this.offsets[SHAPE.T];
  }

  SRS.prototype.startingState = function(shape) {
    return new V(3, 2);
  };

  SRS.prototype.positions = function(pos, shape, rot) {
    var tiles = this.rotations[shape][rot],
        x = pos.x, y = pos.y,
        ret = [];

    if (shape === SHAPE.I) {
      for (var i=0; i<tiles.length; ++i) {
        tile = tiles[i];
        if (tile === 1) {
          ret.push(new V(x + (i%5) - 1, y + Math.floor(i / 5) - 1));
        }
      }
    } else {
      for (var i=0; i<tiles.length; ++i) {
        tile = tiles[i];
        if (tile === 1) {
          ret.push(new V(x + (i%3), y + Math.floor(i / 3)));
        }
      }
    }

    return ret;
  };

  SRS.prototype.rotateOffsets = function(shape, rotFrom, rotTo) {
    var offsets = this.offsets[shape],
        offsetsFrom = offsets[rotFrom],
        offsetsTo = offsets[rotTo],
        ret = [];

    for (var i=0; i<offsetsFrom.length; ++i) {
      var offset = offsetsFrom[i];
      ret.push(offsetsTo[i].sub(offset));
    }

    return ret;
  };

  return SRS;
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