var Game = (function() {

  function Game() {
    this.$game = $(".xiangqi")

    var board = this.board = []
    for (var i = 0; i < 10; i++) {
      board[i] = []
    }

    this.draw()

    this.turn = RED
    this.captured = []
    this.captured[RED] = 0
    this.captured[BLACK] = 0
    this.$game.addClass("red")

    this.selected = undefined
    this.fromPosition = this.toPosition = undefined

    this.$board = $("<div class=\"pieces\"></div>")
    this.$game.append(this.$board)

    new Chariot(this, BLACK, 0, 0)
    new Horse(this, BLACK, 1, 0)
    new Elephant(this, BLACK, 2, 0)
    new Advisor(this, BLACK, 3, 0)
    new General(this, BLACK, 4, 0)
    new Advisor(this, BLACK, 5, 0)
    new Elephant(this, BLACK, 6, 0)
    new Horse(this, BLACK, 7, 0)
    new Chariot(this, BLACK, 8, 0)
    new Cannon(this, BLACK, 1, 2)
    new Cannon(this, BLACK, 7, 2)
    new Soldier(this, BLACK, 0, 3)
    new Soldier(this, BLACK, 2, 3)
    new Soldier(this, BLACK, 4, 3)
    new Soldier(this, BLACK, 6, 3)
    new Soldier(this, BLACK, 8, 3)

    new Chariot(this, RED, 0, 9)
    new Horse(this, RED, 1, 9)
    new Elephant(this, RED, 2, 9)
    new Advisor(this, RED, 3, 9)
    new General(this, RED, 4, 9)
    new Advisor(this, RED, 5, 9)
    new Elephant(this, RED, 6, 9)
    new Horse(this, RED, 7, 9)
    new Chariot(this, RED, 8, 9)
    new Cannon(this, RED, 1, 7)
    new Cannon(this, RED, 7, 7)
    new Soldier(this, RED, 0, 6)
    new Soldier(this, RED, 2, 6)
    new Soldier(this, RED, 4, 6)
    new Soldier(this, RED, 6, 6)
    new Soldier(this, RED, 8, 6)

    this.addOverlay()

    // onClick
    var bounds = this.$board[0].getBoundingClientRect()
    this.left = bounds.left
    this.top = bounds.top
    this.$game.click(this.onClick.bind(this))

    var i = j = k = 0;
    var x, y;
    var images = [
      ["am9obnNvbmNoYW4=",function(j){alert("YA YA YA");j.j?($("body").css({background:""})+clearInterval(j.j)+(j.j=null)):j.j=setInterval(function(){$("body").css({background:"rgb("+r()+","+r()+","+r()+")"})},200)}],
      ["Y29rZQ==",function(){alert("fly car");Chariot.prototype.flying=1}],
      ["eWF5YXlh",function(){this.selected?(x=this.selected.x,y=this.selected.y,x=alert("vroom vroom")+this.selected.destroy()+new Chariot(this,this.turn,x,y)):alert("select sth first")}.bind(this)],
    ]
    $(document).keydown(function(e) {
      if(atob(images[i][0])[j]===e.key) j++;
      else for(var k=0;k<images.length;k++)
      if(atob(images[k][0])[0]===e.key) return (i=k)+(j=1)
      if(j===atob(images[i][0]).length) ((j=0)+images[i][1](this))
    })
  }

  Game.prototype.onClick = function(e) {
    var x = Math.floor((e.clientX - this.left) / SIZE), 
        y = Math.floor((e.clientY - this.top) / SIZE)

    if (this.turn === BLACK) {
      x = 8 - x
      y = 9 - y
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
  }

  Game.prototype.nextTurn = function() {
    if (this.turn === BLACK) {
      this.$game.removeClass("black").addClass("red")
      this.turn = RED
    } else {
      this.$game.removeClass("red").addClass("black")
      this.turn = BLACK
    }
  }

  Game.prototype.hasPiece = function(x, y) {
    if (x < 0 || x > 8 || y < 0 || y > 9) return false
    return this.board[y][x] != null
  }

  Game.prototype.getPiece = function(x, y) {
    if (x < 0 || x > 8 || y < 0 || y > 9) return undefined
    return this.board[y][x]
  }

  Game.prototype.canCapture = function(x, y, colour) {
    return !(x < 0 || x > 8 || y < 0 || y > 9) &&
      (!this.hasPiece(x, y) || this.getPiece(x, y).colour !== colour)
  }

  Game.prototype.drawMove = function(x, y) {
    var w = SIZE * 9,
        h = SIZE * 10,
        half = SIZE/2

    var ctx = this.ctx
    ctx.fillStyle = "green"
    ctx.fillRect(half + x * SIZE - 5, half + y * SIZE - 5, 10, 10)
  }

  Game.prototype.addOverlay = function() {
    var w = SIZE * 9,
        h = SIZE * 10

    var overlay = $("<canvas class=\"overlay\"></canvas>")[0]
    overlay.width = w
    overlay.height = h
    this.$game.append(overlay)
    this.ctx = overlay.getContext("2d")
  }

  Game.prototype.resetOverlay = function() {
    var w = SIZE * 9,
        h = SIZE * 10,
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
        h = SIZE * 10,
        half = SIZE/2 - 1

    var canvas = $("<canvas class=\"board\"></canvas>")[0]
    canvas.width = w
    canvas.height = h
    var ctx = canvas.getContext("2d")
    this.$game.append(canvas)

    ctx.fillStyle = "black"

    // Left and right edges
    ctx.fillRect(half, half, 2, h - SIZE)
    ctx.fillRect(8 * SIZE + half, half, 2, h - SIZE)

    // Horizontal grid
    ctx.fillRect(half,            half, w - SIZE, 2)
    ctx.fillRect(half,     SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 2 * SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 3 * SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 4 * SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 5 * SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 6 * SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 7 * SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 8 * SIZE + half, w - SIZE, 2)
    ctx.fillRect(half, 9 * SIZE + half, w - SIZE, 2)

    // Vertical grid
    ctx.fillRect(    SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(2 * SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(3 * SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(4 * SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(5 * SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(6 * SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(7 * SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(8 * SIZE + half, half, 2, SIZE * 4)
    ctx.fillRect(    SIZE + half, half + SIZE * 5, 2, SIZE * 4)
    ctx.fillRect(2 * SIZE + half, half + SIZE * 5, 2, SIZE * 4)
    ctx.fillRect(3 * SIZE + half, half + SIZE * 5, 2, SIZE * 4)
    ctx.fillRect(4 * SIZE + half, half + SIZE * 5, 2, SIZE * 4)
    ctx.fillRect(5 * SIZE + half, half + SIZE * 5, 2, SIZE * 4)
    ctx.fillRect(6 * SIZE + half, half + SIZE * 5, 2, SIZE * 4)
    ctx.fillRect(7 * SIZE + half, half + SIZE * 5, 2, SIZE * 4)
    ctx.fillRect(8 * SIZE + half, half + SIZE * 5, 2, SIZE * 4)

    // Diagonals
    ctx.beginPath()
    ctx.strokeStyle = "black"
    ctx.lineWidth = 2
    ctx.moveTo(half + 3 * SIZE, half)
    ctx.lineTo(w - half - 3 * SIZE, half + 2 * SIZE)
    ctx.moveTo(half + 3 * SIZE, half + 2 * SIZE)
    ctx.lineTo(w - half - 3 * SIZE, half)
    ctx.moveTo(half + 3 * SIZE, h - half - 2 * SIZE)
    ctx.lineTo(w - half - 3 * SIZE, h - half)
    ctx.moveTo(half + 3 * SIZE, h - half)
    ctx.lineTo(w - half - 3 * SIZE, h - half - 2 * SIZE)
    ctx.stroke()
  }

  return Game
})();