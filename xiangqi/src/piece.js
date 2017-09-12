var Piece = (function() {

  function Piece(game, colour, x, y, piece) {
    this.game = game
    this.$ = $("<div class=\"piece " + (colour === BLACK ? "black" : "red") +
        " " + piece + "\"></div>")
    game.$board.append(this.$)

    this.colour = colour
    this.x = x
    this.y = y
    this.moveTo(x, y)

    this.$.click(this.onClick.bind(this))
  }

  Piece.prototype.onClick = function(e) {

  }

  Piece.prototype.moveTo = function(x, y) {
    var other = this.game.board[y][x]
    if (other != null && other != this) {
      other.destroy()
    }

    this.game.board[this.y][this.x] = undefined;
    this.game.board[y][x] = this
    this.game.fromPosition = { x: this.x, y: this.y }
    this.game.toPosition = { x: x, y: y }

    this.x = x
    this.y = y

    this.$.css({ left: (OFFSET + x * SIZE) + "px", top: (OFFSET + y * SIZE) + "px" })
  }

  Piece.prototype.destroy = function() {
    var w = SIZE * 9,
        h = SIZE * 10
    this.game.board[this.y][this.x] = undefined;
    if (this.colour === BLACK) {
      this.$.css({
        left: (OFFSET + (this.game.captured[this.colour]++) * (SIZE / 2)) + "px", 
        top: (-SIZE + OFFSET) + "px",
      })
    } else {
      this.$.css({
        left: (w + OFFSET - SIZE - (this.game.captured[this.colour]++) * (SIZE / 2)) + "px", 
        top: (h + OFFSET) + "px",
      })
    }
    
    this.$.addClass("dead")
  }

  Piece.prototype.hasCrossedRiver = function() {
    return this.colour === BLACK ? this.y > 4 : this.y < 4
  }

  return Piece
})()

var General = (function() {

  function General(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "general")
  }
  General.prototype = Object.create(Piece.prototype)
  General.prototype.constructor = General

  var _moves = []
  _moves[BLACK] = [
      [3, 0], [4, 0], [5, 0],
      [3, 1], [4, 1], [5, 1],
      [3, 2], [4, 2], [5, 2],
    ]
  _moves[RED] = [
      [3, 9], [4, 9], [5, 9],
      [3, 8], [4, 8], [5, 8],
      [3, 7], [4, 7], [5, 7],
    ]
  General.prototype.moves = function() {
    var moves = _moves[this.colour]
    var ret = [], x = this.x, y = this.y
    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      if (this.canMoveTo(move[0], move[1])) {
        ret.push(move)
      }
    }
    return ret
  }

  General.prototype.canMoveTo = function(x, y) {
    return (Math.abs(this.x - x) + Math.abs(this.y - y) === 1) &&
      this.game.canCapture(x, y, this.colour)
  }

  return General
})()

var Advisor = (function() {

  function Advisor(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "advisor")
  }
  Advisor.prototype = Object.create(Piece.prototype)
  Advisor.prototype.constructor = Advisor

  var _moves = []
  _moves[BLACK] = [[3, 0], [5, 0], [4, 1], [3, 0], [5, 2]]
  _moves[RED] = [[3, 9], [5, 9], [4, 8], [3, 7], [5, 7]]
  Advisor.prototype.moves = function() {
    var moves = _moves[this.colour]
    var ret = [], x = this.x, y = this.y
    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      if (this.canMoveTo(move[0], move[1])) {
        ret.push(move)
      }
    }
    return ret
  }

  Advisor.prototype.canMoveTo = function(x, y) {
    return (Math.abs(this.x - x) === 1 && Math.abs(this.y - y) === 1) &&
      this.game.canCapture(x, y, this.colour)
  }

  return Advisor
})()

var Elephant = (function() {

  function Elephant(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "elephant")
  }
  Elephant.prototype = Object.create(Piece.prototype)
  Elephant.prototype.constructor = Elephant

  var _moves = []
  _moves[BLACK] = [[2, 0], [6, 0], [0, 2], [4, 2], [8, 2], [2, 4], [6, 4]]
  _moves[RED] = [[2, 9], [6, 9], [0, 7], [4, 7], [8, 7], [2, 9], [6, 5]]
  Elephant.prototype.moves = function() {
    var moves = _moves[this.colour]
    var ret = [], x = this.x, y = this.y
    for (var i = 0; i < moves.length; i++) {
      var move = moves[i];
      if (this.canMoveTo(move[0], move[1])) {
        ret.push(move)
      }
    }
    return ret
  }

  Elephant.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y
    return (Math.abs(dx) === 2 && Math.abs(dy) === 2) &&
      this.game.canCapture(x, y, this.colour) &&
      !this.game.hasPiece(x - dx/2, y - dy/2)
  }

  return Elephant
})();

var Horse = (function() {

  function Horse(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "horse")
  }
  Horse.prototype = Object.create(Piece.prototype)
  Horse.prototype.constructor = Horse

  var _moves = [
    [-1, -2], [ 1, -2],
    [ 2,  1], [ 2, -1],
    [ 1,  2], [-1,  2],
    [-2,  1], [-2, -1],
  ]
  Horse.prototype.moves = function() {
    var ret = [], x = this.x, y = this.y
    for (var i = 0; i < _moves.length; i++) {
      var move = _moves[i];
      if (this.canMoveTo(x + move[0], y + move[1])) {
        ret.push([x + move[0], y + move[1]])
      }
    }
    return ret
  }

  Horse.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y,
        sx = Math.abs(dx) === 2 ? sign(dx) : 0
        sy = Math.abs(dy) === 2 ? sign(dy) : 0

    if ((Math.abs(dx) + Math.abs(dy) !== 3) || 
      Math.abs(dx) > 2 || Math.abs(dy) > 2) return false

    return this.game.canCapture(x, y, this.colour) &&
      !this.game.hasPiece(this.x + sx, this.y + sy)
  }

  return Horse
})();

var Chariot = (function() {

  function Chariot(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "chariot")
  }
  Chariot.prototype = Object.create(Piece.prototype)
  Chariot.prototype.constructor = Chariot

  Chariot.prototype.moves = function() {
    var ret = [], x = this.x, y = this.y
    for (var dx = -10; dx < 10; dx++) {
      if (dx !== 0 && this.canMoveTo(x + dx, y)) {
        ret.push([x + dx, y])
      }
    }
    for (var dy = -10; dy < 10; dy++) {
      if (dy !== 0 && this.canMoveTo(x, y + dy)) {
        ret.push([x, y + dy])
      }
    }
    return ret
  }

  Chariot.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y, d = Math.abs(dx) + Math.abs(dy)
        sx = sign(dx), sy = sign(dy)

    if (sx !== 0 && sy !== 0 || sx === sy) return false

    // No pieces inbetween
    if (!this.flying) {
      for (var i = 1; i < d; i++) {
        if (this.game.hasPiece(this.x + sx * i, this.y + sy * i)) {
          return false;
        }
      }
    }

    return this.game.canCapture(x, y, this.colour)
  }

  return Chariot
})();

var Cannon = (function() {

  function Cannon(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "cannon")
  }
  Cannon.prototype = Object.create(Piece.prototype)
  Cannon.prototype.constructor = Cannon

  Cannon.prototype.moves = function() {
    var ret = [], x = this.x, y = this.y
    for (var dx = -10; dx < 10; dx++) {
      if (dx !== 0 && this.canMoveTo(x + dx, y)) {
        ret.push([x + dx, y])
      }
    }
    for (var dy = -10; dy < 10; dy++) {
      if (dy !== 0 && this.canMoveTo(x, y + dy)) {
        ret.push([x, y + dy])
      }
    }
    return ret
  }

  Cannon.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y, d = Math.abs(dx) + Math.abs(dy)
        sx = sign(dx), sy = sign(dy)

    if (sx !== 0 && sy !== 0 || sx === sy) return false

    if (this.game.hasPiece(x, y)) {

      // Capturing: one piece inbetween
      var jumped = false
      for (var i = 1; i < d; i++) {
        if (this.game.hasPiece(this.x + sx * i, this.y + sy * i)) {
          if (jumped) return false
          jumped = true
        }
      }
      if (!jumped) return false
    } else {

      // Not capturing: no pieces inbetween
      for (var i = 1; i < d; i++) {
        if (this.game.hasPiece(this.x + sx * i, this.y + sy * i)) {
          return false
        }
      }
    }

    return this.game.canCapture(x, y, this.colour)
  }

  return Cannon
})();

var Soldier = (function() {

  function Soldier(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "soldier")
  }
  Soldier.prototype = Object.create(Piece.prototype)
  Soldier.prototype.constructor = Soldier

  var _dir = []
  _dir[BLACK] = 1
  _dir[RED] = -1
  Soldier.prototype.moves = function() {
    var dy = _dir[this.colour]
    var ret = [], x = this.x, y = this.y

    if (this.canMoveTo(x, y + dy)) {
      ret.push([x, y + dy])
    }

    if (this.hasCrossedRiver()) {
p(this.canMoveTo(x - 1, y))
      if (this.canMoveTo(x - 1, y)) {
        ret.push([x - 1, y])
      }
      if (this.canMoveTo(x + 1, y)) {
        ret.push([x + 1, y])
      }
    }
    return ret
  }

  Soldier.prototype.canMoveTo = function(x, y) {
    if (!this.hasCrossedRiver()) {
      return (Math.abs(this.x - x) === 0 && Math.abs(this.y - y) === 1) &&
        this.game.canCapture(x, y, this.colour)
    } else {
      return ((Math.abs(this.x - x) === 1 && Math.abs(this.y - y) === 0) ||
          (Math.abs(this.x - x) === 0 && Math.abs(this.y - y) === 1)) &&
        this.game.canCapture(x, y, this.colour)
    }
  }

  return Soldier
})();