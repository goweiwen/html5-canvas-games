var Piece = (function() {

  function Piece(game, colour, x, y, piece) {
    this.game = game
    this.$ = $("<div class=\"piece " + (colour === BLACK ? "black" : "white") +
        " " + piece + "\"></div>")
    game.$board.append(this.$)

    this.colour = colour
    this.x = x
    this.y = y
    this.moveTo(x, y)

    this.$.click(this.onClick.bind(this))
  }

  Piece.prototype.character = "."

  Piece.prototype.onClick = function(e) {

  }

  Piece.prototype.moveTo = function(x, y) {
    var other = this.game.board[y][x]
    if (other != null && other != this) {
      other.destroy()
    }

    this.game.board[this.y][this.x] = undefined
    this.game.board[y][x] = this
    this.game.fromPosition = { x: this.x, y: this.y }
    this.game.toPosition = { x: x, y: y }

    this.x = x
    this.y = y

    this.$.css({ left: (OFFSET + x * SIZE) + "px", top: (OFFSET + y * SIZE) + "px" })
  }

  Piece.prototype.destroy = function() {
    var w = SIZE * 8,
        h = SIZE * 8
    this.game.board[this.y][this.x] = undefined
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

  return Piece
})()

var King = (function() {

  function King(game, colour, x, y, hasMoved) {
    Piece.call(this, game, colour, x, y, "king")
    this.hasMoved = hasMoved || false
  }
  King.prototype = Object.create(Piece.prototype)
  King.prototype.constructor = King

  King.prototype.character = "K"

  var _moves = [
    [-1, -1], [ 0, -1], [ 1, -1],
    [-1,  0], [ 0,  0], [ 1,  0],
    [-1,  1], [ 0,  1], [ 1,  1],
  ]
  King.prototype.moves = function() {
    var ret = [], x = this.x, y = this.y
    for (var i = 0; i < _moves.length; i++) {
      var move = _moves[i]
      if (this.canMoveTo(x + move[0], y + move[1])) {
        ret.push([x + move[0], y + move[1]])
      }
    }

    if (!this.hasMoved) {
      if (this.canMoveTo(2, y)) {
        ret.push([2, y])
      }
      if (this.canMoveTo(6, y)) {
        ret.push([6, y])
      }
    }

    return ret
  }

  King.prototype.canMoveTo = function(x, y) {
    if (!this.hasMoved && y === this.y) {
      var queenRook = this.game.getPiece(0, y),
          kingRook = this.game.getPiece(7, y)
      if (x === 2 && Rook.prototype.isPrototypeOf(queenRook) && !queenRook.hasMoved) {
// TODO: CHECK THREAT
        return !this.game.hasPiece(1, y) && !this.game.hasPiece(2, y) && !this.game.hasPiece(3, y)
      } else if (x === 6 && Rook.prototype.isPrototypeOf(kingRook) && !kingRook.hasMoved) {
// TODO: CHECK THREAT
        return !this.game.hasPiece(5, y) && !this.game.hasPiece(6, y)
      }
    }
    return Math.abs(this.x - x) <= 1 && Math.abs(this.y - y) <= 1 &&
      this.game.canCapture(x, y, this.colour)
  }

  King.prototype.moveTo = function(x, y) {
    if (!this.hasMoved && y === this.y) {
      var queenRook = this.game.getPiece(0, y),
          kingRook = this.game.getPiece(7, y)
      if (x === 2 && Rook.prototype.isPrototypeOf(queenRook) && !queenRook.hasMoved) {
        queenRook.moveTo(3, y)
      } else if (x === 6 && Rook.prototype.isPrototypeOf(kingRook) && !kingRook.hasMoved) {
        kingRook.moveTo(5, y)
      }
    }
    this.hasMoved = true
    return Piece.prototype.moveTo.call(this, x, y)
  }

  return King
})()

var Queen = (function() {

  function Queen(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "queen")
  }
  Queen.prototype = Object.create(Piece.prototype)
  Queen.prototype.constructor = Queen

  Queen.prototype.character = "Q"

  Queen.prototype.moves = function() {
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
    for (var i = -8; i < 8; i++) {
      if (i !== 0 && this.canMoveTo(x + i, y + i)) {
        ret.push([x + i, y + i])
      }
      if (i !== 0 && this.canMoveTo(x + i, y - i)) {
        ret.push([x + i, y - i])
      }
    }
    return ret
  }

  Queen.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y, d = Math.abs(dx) + Math.abs(dy)
        sx = sign(dx), sy = sign(dy)

    if (sx === 0 && sy === 0) return false

    if (sx === 0 || sy === 0) {
      // No pieces inbetween
      for (var i = 1; i < d; i++) {
        if (this.game.hasPiece(this.x + sx * i, this.y + sy * i)) {
          return false
        }
      }
    } else if (Math.abs(dx) === Math.abs(dy)) {
      // No pieces inbetween
      for (var i = 1; i < Math.abs(dx); i++) {
        if (this.game.hasPiece(this.x + sx * i, this.y + sy * i)) {
          return false
        }
      }
    } else {
      return false
    }

    return this.game.canCapture(x, y, this.colour)
  }

  return Queen
})();

var Rook = (function() {

  function Rook(game, colour, x, y, hasMoved) {
    Piece.call(this, game, colour, x, y, "rook")
    this.hasMoved = hasMoved || false
  }
  Rook.prototype = Object.create(Piece.prototype)
  Rook.prototype.constructor = Rook

  Rook.prototype.character = "R"

  Rook.prototype.moves = function() {
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

  Rook.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y, d = Math.abs(dx) + Math.abs(dy)
        sx = sign(dx), sy = sign(dy)

    if (sx !== 0 && sy !== 0 || sx === sy) return false

    // No pieces inbetween
    for (var i = 1; i < d; i++) {
      if (this.game.hasPiece(this.x + sx * i, this.y + sy * i)) {
        return false
      }
    }

    return this.game.canCapture(x, y, this.colour)
  }

  Rook.prototype.moveTo = function(x, y) {
    this.hasMoved = true
    return Piece.prototype.moveTo.call(this, x, y)
  }

  return Rook
})();

var Bishop = (function() {

  function Bishop(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "bishop")
  }
  Bishop.prototype = Object.create(Piece.prototype)
  Bishop.prototype.constructor = Bishop

  Bishop.prototype.character = "B"

  Bishop.prototype.moves = function() {
    var ret = [], x = this.x, y = this.y
    for (var i = -8; i < 8; i++) {
      if (i !== 0 && this.canMoveTo(x + i, y + i)) {
        ret.push([x + i, y + i])
      }
      if (i !== 0 && this.canMoveTo(x + i, y - i)) {
        ret.push([x + i, y - i])
      }
    }
    return ret
  }

  Bishop.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y
        sx = sign(dx), sy = sign(dy)

    if (dx === 0 || dy === 0 || Math.abs(dx) !== Math.abs(dy)) return false

    // No pieces inbetween
    for (var i = 1; i < Math.abs(dx); i++) {
      if (this.game.hasPiece(this.x + sx * i, this.y + sy * i)) {
        return false
      }
    }

    return this.game.canCapture(x, y, this.colour)
  }

  return Bishop
})()

var Knight = (function() {

  function Knight(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "knight")
  }
  Knight.prototype = Object.create(Piece.prototype)
  Knight.prototype.constructor = Knight

  Knight.prototype.character = "N"

  var _moves = [
    [-1, -2], [ 1, -2],
    [ 2,  1], [ 2, -1],
    [ 1,  2], [-1,  2],
    [-2,  1], [-2, -1],
  ]
  Knight.prototype.moves = function() {
    var ret = [], x = this.x, y = this.y
    for (var i = 0; i < _moves.length; i++) {
      var move = _moves[i]
      if (this.canMoveTo(x + move[0], y + move[1])) {
        ret.push([x + move[0], y + move[1]])
      }
    }
    return ret
  }

  Knight.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y,
        sx = Math.abs(dx) === 2 ? sign(dx) : 0
        sy = Math.abs(dy) === 2 ? sign(dy) : 0

    if ((Math.abs(dx) + Math.abs(dy) !== 3) || 
      Math.abs(dx) > 2 || Math.abs(dy) > 2) return false

    return this.game.canCapture(x, y, this.colour)
  }

  return Knight
})();

var Pawn = (function() {

  function Pawn(game, colour, x, y) {
    Piece.call(this, game, colour, x, y, "pawn")
    this.hasMoved = this.colour === BLACK ? y !== 1 : y !== 6
  }
  Pawn.prototype = Object.create(Piece.prototype)
  Pawn.prototype.constructor = Pawn

  Pawn.prototype.character = "P"

  var _dir = []
  _dir[BLACK] = 1
  _dir[WHITE] = -1
  Pawn.prototype.moves = function() {
    var dy = _dir[this.colour]
    var ret = [], x = this.x, y = this.y

    if (this.canMoveTo(x, y + dy)) {
      ret.push([x, y + dy])
      if (!this.hasMoved && this.canMoveTo(x, y + dy + dy)) {
        ret.push([x, y + dy + dy])
      }
    }

    if (this.game.hasPiece(x - 1, y + dy) && this.game.getPiece(x - 1, y + dy).colour !== this.colour) {
      ret.push([x - 1, y + dy])
    }
    if (this.game.hasPiece(x + 1, y + dy) && this.game.getPiece(x + 1, y + dy).colour !== this.colour) {
      ret.push([x + 1, y + dy])
    }

// TODO: EN PASSANT

// TODO: PROMOTION

    return ret
  }

  Pawn.prototype.canMoveTo = function(x, y) {
    var dx = x - this.x, dy = y - this.y, dir = _dir[this.colour]
    if (dx !== 0) {
      return dy === dir && Math.abs(dx) === 1 &&
        this.game.canCapture(x, y, this.colour)
    }
    if (!this.hasMoved && dy === dir + dir) {
      return !this.game.hasPiece(x, y - dir) &&
        !this.game.hasPiece(x, y)
    }
    return dy === dir && !this.game.hasPiece(x, y)
  }

  Pawn.prototype.moveTo = function(x, y) {
    this.hasMoved = true
    return Piece.prototype.moveTo.call(this, x, y)
  }

  return Pawn
})();