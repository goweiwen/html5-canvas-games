var WIDTH = $("html").width()
var HEIGHT = 600

var Game = (function() {

  var FRAME_RATE = 30
  var SCORE_TYPE = 1
  var SCORE_DESTROY = 10
  var SCORE_INCORRECT = -1

  function Game($canvas) {
    this.$canvas = $canvas
    this.canvas = $canvas[0]
    this.canvas.width = WIDTH
    this.canvas.height = HEIGHT
    this.ctx = this.canvas.getContext('2d')

    this.width = this.canvas.width
    this.height = this.canvas.height

    $('body').css({
      margin: 0,
      padding: 0,
      overflow: 'hidden',
    })

    $('body').keypress(function(e) {
      if (e.key === 'Spacebar') return

      var entities = this.entities

      if (this.selected) {
        if (this.selected.type(e.key)) {
          this.score += SCORE_TYPE
        } else {
          this.flash()
          this.score += SCORE_INCORRECT
        }
      } else {
        for (var i = 0; i < entities.length; i++) {
          if (entities[i].type(e.key)) {
            this.selected = entities[i]
            this.score += SCORE_TYPE
            break
          }
        }
      }
    }.bind(this))

    $.get('words.txt', function(data) {
      this.words = data.split('\r\n')
      this.initialise()
    }.bind(this))
  }

  Game.prototype.initialise = function() {
    this.entities = []
    this.delay = 3
    this.score = 0
    var timers = this.timers = {}

    this.time = Date.now()
    timers.elapsed = this.delay

    setInterval(function() {
      var t = Date.now()
      if (this.paused) {
        this.time = t
        return
      }
      var dt = this.dt = (t - this.time) / 1000
      this.time = t

      if (dt !== 0) {
        this.update(dt, t)
        this.render(this.ctx)
        for (var k in timers) {
          timers[k] += dt
        }
      }

      while (timers.elapsed > this.delay) {
        timers.elapsed -= this.delay
        this.entities.push(new Word(this.words.any(), this))
        this.delay = Math.max(this.delay * 0.98, 0.8)
      }
    }.bind(this), 1 / FRAME_RATE)
  }

  Game.prototype.update = function(dt, t) {
    var entities = this.entities
    for (var i = 0; i < entities.length; i++) {
      entities[i].update(dt, t)
    }
  }

  Game.prototype.render = function(ctx) {
    ctx.fillStyle = 'white'
    if (this.timers.flash < 0) {
      ctx.fillStyle = 'red'
    }
    ctx.fillRect(0, 0, WIDTH, HEIGHT)

    ctx.fillStyle = 'red'
    ctx.fillRect(0, HEIGHT-5, WIDTH, 5)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '300px Arial'
    ctx.fillStyle = 'lightgrey'
    ctx.fillText(this.score, WIDTH/2, HEIGHT/2)
    if (this.paused) {
      ctx.font = '100px Arial'
      ctx.fillText("game over", WIDTH/2, HEIGHT/2 - 200)
    }

    var entities = this.entities
    for (var i = 0; i < entities.length; i++) {
      entities[i].render(ctx)
    }
  }

  Game.prototype.destroy = function(which) {
    var entities = this.entities
    for (var i = 0; i < entities.length; i++) {
      if (entities[i] === which) {
        entities.splice(i, 1)
      }
    }
    if (this.selected === which) {
      this.selected = undefined
      this.score += SCORE_DESTROY
    }
    if (this.entities.length === 0) {
      this.timers.elapsed = this.delay
    }
  }

  Game.prototype.end = function() {
    this.paused = true
  }

  Game.prototype.flash = function() {
    this.timers.flash = -0.1
  }

  return Game
})();

var Word = (function() {

  var SPEED = 30

  function Word(word, game) {
    this.word = word
    this.game = game
    game.ctx.font = '20px Courier'
    var width = game.ctx.measureText(word).width
    this.x = randint(width, WIDTH)
    this.y = 0
  }

  Word.prototype.update = function(dt, t) {
    this.y += SPEED * dt
    if (this.y > this.game.height) {
      this.game.end()
    }
  }

  Word.prototype.render = function(ctx) {
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.font = '20px Courier'
    ctx.fillStyle = 'black'
    ctx.fillText(this.word, this.x, this.y)
  }

  Word.prototype.type = function(key) {
    if (key === this.word[0]) {
      this.word = this.word.slice(1)
      while (this.word[0] === ' ') {
        this.word = this.word.slice(1)
      }
      if (this.word.length === 0) {
        this.destroy()
      }
      return true
    } else if (key === 'Spacebar') {
      return true
    }
    return false
  }

  Word.prototype.destroy = function() {
    this.game.destroy(this)
  }

  return Word
})();


(function() {

  Function.prototype.bind = Function.prototype.bind != null ? Function.prototype.bind : function(ctx) {
    var fn = this
    return function() {
      return fn.apply(ctx, arguments)
    }
  }

  Array.prototype.any = function() {
    return this[randint(0, this.length)]
  }
})();

var p = console.log.bind(console)
function clamp(x, min, max) { return x > max ? max : x < min ? min : x }
function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0 }
function randint(min, max) { return min + Math.floor(Math.random() * (max - min)) }