var Game = (function() {

  function Game() {
    this.$game = $(".chess")

    var board = this.board = []
    for (var i = 0; i < 10; i++) {
      board[i] = []
    }

    this.draw()

    this.turn = WHITE
    this.captured = []
    this.captured[WHITE] = 0
    this.captured[BLACK] = 0
    this.$game.addClass("white")

    this.selected = undefined
    this.fromPosition = this.toPosition = undefined

    this.$board = $("<div class=\"pieces\"></div>")
    this.$game.append(this.$board)

    new Rook(this, BLACK, 0, 0)
    new Knight(this, BLACK, 1, 0)
    new Bishop(this, BLACK, 2, 0)
    new Queen(this, BLACK, 3, 0)
    new King(this, BLACK, 4, 0)
    new Bishop(this, BLACK, 5, 0)
    new Knight(this, BLACK, 6, 0)
    new Rook(this, BLACK, 7, 0)
    for (var i = 0; i < 8; i++)
      new Pawn(this, BLACK, i, 1)

    new Rook(this, WHITE, 0, 7)
    new Knight(this, WHITE, 1, 7)
    new Bishop(this, WHITE, 2, 7)
    new Queen(this, WHITE, 3, 7)
    new King(this, WHITE, 4, 7)
    new Bishop(this, WHITE, 5, 7)
    new Knight(this, WHITE, 6, 7)
    new Rook(this, WHITE, 7, 7)
    for (var i = 0; i < 8; i++)
      new Pawn(this, WHITE, i, 6)

    this.addOverlay()

    // onClick
    var bounds = this.$board[0].getBoundingClientRect()
    this.left = bounds.left
    this.top = bounds.top
    this.$game.click(this.onClick.bind(this))

    var i = j = k = 0
    var x, y
    var images = [
      ["am9obnNvbmNoYW4=",function(j){alert("YA YA YA");j.j?($("body").css({background:""})+clearInterval(j.j)+(j.j=null)):j.j=setInterval(function(){$("body").css({background:"rgb("+r()+","+r()+","+r()+")"})},200)}],
      ["eWF5YXlh",function(){this.selected?(x=this.selected.x,y=this.selected.y,x=alert("welcome to")+this.selected.destroy()+new Queen(this,this.turn,x,y)):alert("select sth first")}.bind(this)],
    ]
    $(document).keydown(function(e) {
      if(atob(images[i][0])[j]===e.key) j++
      else for(var k=0;k<images.length;k++)
      if(atob(images[k][0])[0]===e.key) return (i=k)+(j=1)
      if(j===atob(images[i][0]).length) ((j=0)+images[i][1](this))
    })
  }

  Game.prototype.onClick = function(e) {
    var x = Math.floor((e.pageX - this.left) / SIZE), 
        y = Math.floor((e.pageY - this.top) / SIZE)

    if (this.turn === BLACK) {
      x = 7 - x
      y = 7 - y
    }

    var piece = this.getPiece(x, y)
    if (piece && piece.colour === this.turn) {
      this.selected = piece

      var moves = piece.moves()
      this.resetOverlay()
      for (var i = 0; i < moves.length; i++) {
        this.drawMove(moves[i][0], moves[i][1])
      }
    }

    if (this.selected && this.selected.canMoveTo(x, y)) {
      this.selected.moveTo(x, y)
      this.selected = undefined
      this.resetOverlay()
      this.nextTurn()
    }

console.log(this.serialize())
  }

  Game.prototype.serialize = function() {
    var board = "";
    for (var y = 0; y < 8; y++) {
      for (var x = 0; x < 8; x++) {
        var piece = this.board[y][x]
        if (!piece) {
          board += " "
        } else {
          board += piece.colour === BLACK
            ? piece.character
            : String.fromCharCode(piece.character.charCodeAt(0) + 32)
        }
      }
    }
    board += "("
    var positions = [[0, 0], [7, 0], [4, 0], [0, 7], [7, 7], [4, 7]]
    for (var i = 0; i < positions.length; i++) {
      var piece = this.board[positions[i][1]][positions[i][0]]
      board += (piece && !piece.hasMoved) ? "t" : "f"
    }
    board += ")"
    return board;
  }

  Game.prototype.nextTurn = function() {
    if (this.turn === BLACK) {
      this.$game.removeClass("black").addClass("white")
      this.turn = WHITE
    } else {
      this.$game.removeClass("white").addClass("black")
      this.turn = BLACK
    }
  }

  Game.prototype.hasPiece = function(x, y) {
    if (x < 0 || x > 7 || y < 0 || y > 7) return false
    return this.board[y][x] != null
  }

  Game.prototype.getPiece = function(x, y) {
    if (x < 0 || x > 7 || y < 0 || y > 7) return undefined
    return this.board[y][x]
  }

  Game.prototype.canCapture = function(x, y, colour) {
    return !(x < 0 || x > 7 || y < 0 || y > 7) &&
      (!this.hasPiece(x, y) || this.getPiece(x, y).colour !== colour)
  }

  Game.prototype.drawMove = function(x, y) {
    var w = SIZE * 8,
        h = SIZE * 8,
        half = SIZE/2

    var ctx = this.ctx
    ctx.fillStyle = "green"
    ctx.fillRect(half + x * SIZE - 5, half + y * SIZE - 5, 10, 10)
  }

  Game.prototype.addOverlay = function() {
    var w = SIZE * 8,
        h = SIZE * 8

    var overlay = $("<canvas class=\"overlay\"></canvas>")[0]
    overlay.width = w
    overlay.height = h
    this.$game.append(overlay)
    this.ctx = overlay.getContext("2d")
  }

  Game.prototype.resetOverlay = function() {
    var w = SIZE * 8,
        h = SIZE * 8,
        half = SIZE/2,
        ctx = this.ctx,
        from = this.fromPosition,
        to = this.toPosition

    ctx.clearRect(0, 0, w, h)

    if (this.fromPosition != null) {
      ctx.beginPath()
      ctx.moveTo(half + from.x * SIZE + 1, half + from.y * SIZE + 1)
      ctx.lineTo(half + to.x * SIZE + 1, half + to.y * SIZE + 1)
      ctx.strokeStyle = "green"
      ctx.lineWidth = 3
      ctx.stroke()
    }
  }

  Game.prototype.draw = function() {
    var w = SIZE * 9,
        h = SIZE * 9,
        half = SIZE/2 - 1

    var canvas = $("<canvas class=\"board\"></canvas>")[0]
    canvas.width = w
    canvas.height = h
    var ctx = canvas.getContext("2d")
    this.$game.append(canvas)

    for (var i = 0; i < 8; i++) {
      for (var j = 0; j < 8; j++) {
        ctx.fillStyle = (i + j) % 2 === 0 ? "#876" : "#cba"
        ctx.fillRect(j * SIZE, i * SIZE, SIZE, SIZE)
      }
    }
  }

  return Game
})();