var Game = (function() {

  function Game($tbody, difficulty) {
    this.board = new Board($tbody, difficulty == null ? 30 : difficulty);
  }

  return Game;
})();

var Board = (function() {

  function Board($div, difficulty) {
    var self = this,
        i;
    this.$div = $div;

    var board = this.board = [];
    for (i=0; i<81; ++i) {
      board[i] = 0;
      $div.append('<input _cell=' + i + '></input>');
    }
    this.initialise(difficulty);
    this.solved = false;

    this.count1 = 0;
    this.count2 = 0;

    var f = function(a) { return s(z(a)) };
    $div.children('input').keydown(function(e) {
      var cell = parseInt(this.getAttribute('_cell'));
      if (e.which === 37 && cell % 9 !== 0) { // arrow keys
        self.$div.children('input').eq(cell-1).focus();
      } else if (e.which === 38 && cell > 8) {
        self.$div.children('input').eq(cell-9).focus();
      } else if (e.which === 39 && cell % 9 !== 8) {
        self.$div.children('input').eq(cell+1).focus();
      } else if (e.which === 40) {
        self.$div.children('input').eq(cell+9).focus();

      } else if (this.attributes.readonly == null) {
        if (e.which === 8 || e.which === 32 || e.which === 46) { // backspace or space or delete
          self.set(0, cell);
          self.validate();

        } else if (e.key >= "1" && e.key <= "9") { // numbers
          self.set(parseInt(e.key), cell);
          self.validate();
        } else if (f("YW05b2JuTnZibU5vWVc0PQ==")[self.count1] === e.key) {
          self.count1++;
          if (self.count1 == f("YW05b2JuTnZibU5vWVc0PQ==").length) {
            self.cheat();
            self.count1 = 0;
          }
        } else if (f("Y0hOaWNtRnVZMmc9")[self.count2] === e.key) {
          self.count2++;
          if (self.count2 == f("Y0hOaWNtRnVZMmc9").length) {
            self.hint();
            self.count2 = 0;
          }
        }
      }
      e.preventDefault();
    });
  }

  Board.prototype.initialise = function(filled) {
    var i, j, cell,
        board = (new Possibilities(this.board)).generate(81-filled),
        poss;

    for (i=0; i<81; ++i) {
      cell = board[i];
      if (typeof(cell) == "number") {
        this.set(board[i], i);
        this.setLocked(true, i);
      }
    }
  }

  Board.prototype.validate = function() {
    var x, y, cell, solved = true;
    for (x=0; x<9; ++x) {
      for (y=0; y<9; ++y) {
        cell = this.get(x, y);
        if (cell === 0) {
          solved = false;
          this.setIllegal(false, x, y);
        } else if (this.canPlace(cell, x, y)) {
          this.setIllegal(false, x, y);
        } else {
          solved = false;
          this.setIllegal(true, x, y);
        }
      }
    }
    if (solved) {
      this.solved = solved;
      this.$div.addClass("solved");
      var self = this;
      var rainbow = function() {
        self.$div.children("input").css("background-color", "rgb(" + 
          (128+Math.floor(Math.random()*2)*128) + ", " + 
          (128+Math.floor(Math.random()*2)*128) + ", " + 
          (128+Math.floor(Math.random()*2)*128) + ") !important");
      };
      rainbow();
      setInterval(rainbow, 200);
    }
    return true;
  }

  Board.prototype.isInRow = function(n, _x, y) {
    var x;
    for (x=0; x<9; ++x) {
      if (x !== _x && this.get(x, y) === n) {
        return true;
      }
    }
    return false;
  }

  Board.prototype.isInColumn = function(n, x, _y) {
    var y;
    for (y=0; y<9; ++y) {
      if (y !== _y && this.get(x, y) === n) {
        return true;
      }
    }
    return false;
  }

  Board.prototype.isInSquare = function(n, _x, _y) {
    var left = _x - _x % 3,
        top = _y - _y % 3;
    for (x=left; x<left+3; ++x) {
      for (y=top; y<top+3; ++y) {
        if ((x !== _x || y !== _y) && this.get(x, y) === n) {
          return true
        }
      }
    }
    return false;
  }

  Board.prototype.canPlace = function(n, x, y) {
    return !(this.isInRow(n, x, y) || this.isInColumn(n, x, y) || this.isInSquare(n, x, y));
  }

  Board.prototype.set = function(n, x, y) {
    var cell;
    if (y == null) {
      cell = x;
    } else {
      cell = y*9 + x;
    }
    this.board[cell] = n;
    this.$div.children('input')[cell].value = n === 0 ? "" : n;
  }

  Board.prototype.setLocked = function(locked, x, y) {
    var cell;
    if (y == null) {
      cell = x;
    } else {
      cell = y*9 + x;
    }
    if (locked) {
      this.$div.children('input').eq(cell).addClass('locked');
    } else {
      this.$div.children('input').eq(cell).removeClass('locked');
    }
    this.$div.children('input')[cell].setAttribute('readonly', locked);
  }

  Board.prototype.setIllegal = function(illegal, x, y) {
    var cell;
    if (y == null) {
      cell = x;
    } else {
      cell = y*9 + x;
    }
    if (illegal) {
      this.$div.children('input').eq(cell).addClass('illegal');
    } else {
      this.$div.children('input').eq(cell).removeClass('illegal');
    }
  }

  Board.prototype.get = function(x, y) {
    var cell;
    if (y == null) {
      cell = x;
    } else {
      cell = y*9 + x;
    }
    return this.board[cell] != null ? this.board[cell] : 0;
  }

  Board.prototype.cheat = function() {
    var poss = new Possibilities(this.board);
    poss.solve();
    var i, answers = [];
    for (i=0; i<81; ++i) {
      if (this.board[i] === 0) {
        answers.push([poss.board[i], i % 81, Math.floor(i / 81)]);
      }
    }
    answers.shuffle();
    var interval = setInterval(function() {
      if (answers.length > 0) {
        var answer = answers.pop();
        this.set(answer[0], answer[1], answer[2]);
      } else {
        this.validate();
        clearInterval(interval);
      }
    }.bind(this), 100);
  }

  Board.prototype.hint = function() {
    var poss = new Possibilities(this.board);
    poss.solve();
    var i, answers = [];
    for (i=0; i<81; ++i) {
      if (this.board[i] === 0) {
        answers.push([poss.board[i], i % 81, Math.floor(i / 81)]);
      }
    }
    answers.shuffle();
    if (answers.length > 0) {
      var answer = answers.pop();
      this.set(answer[0], answer[1], answer[2]);
      this.validate();
    }
  }

  return Board;
})();

var Possibilities = (function() {

  function Possibilities(board) {
    this.board = $.extend([], board);
    this.solved = false;
    this.initialise();
  }

  Possibilities.prototype.initialise = function() {
    var i;
    for (i=0; i<81; ++i) {
      if (this.board[i] === 0) {
        this.board[i] = [1,2,3,4,5,6,7,8,9];
      }
    }
    this.removeIllegal();
  }

  Possibilities.prototype.clone = function() {
    return new Possibilities($.extend([], this.board));
  }

  Possibilities.prototype.generate = function(holes) {
    var poss = this.clone(), 
        cells = [], 
        cell, i, j, tmp, solutions;

    poss.randomSolve();
    poss.removeHints(holes);
    return poss.board;
  }

  Possibilities.prototype.mostSignificantCell = function() {
    var cells = [],
        cell, i, 
        min = 0,
        self = this;

    for (i=0; i<81; ++i) {
      cell = this.get(i);
      if (typeof(cell) === "object" && cell.length > min) {
        cells.push(i);
      }
    }
    cells.shuffle();
    return cells.length > 0 ? cells[0] : false;
  }

  Possibilities.prototype.randomSolve = function(n) {

    if (!this.validate()) {
      return false;
    }

    if (!this.removeIllegal()) {
      return false;
    }

    if (this.solved) {
      return true;
    }

    var poss, cell, i, j, order;

    for (i=(n != null ? n : 0); i<81; ++i) {
      cell = this.get(i);
      if (typeof(cell) === "object") {
        order = [];
        for (j=0; j<cell.length; ++j) {
          order[j] = j;
        }
        order.shuffle();
        for (j=0; j<cell.length; ++j) {
          poss = this.clone();
          poss.set(cell[order[j]], i);
          if (poss.randomSolve(i+1)) {
            this.board = poss.board;
            return true;
          }
        }
        return false;
      }
    }
  }

  Possibilities.prototype.removeHints = function(holesToRemove, cells, holes) {

    var i, cells, holes, cell, value;
    if (this.clone().countSolutions() !== 1) {
      return false;
    }

    if (cells == null) {
      cells = [];
      holes = 0;

      for (var i=0; i<81; ++i) {
        if (typeof(this.board[i]) === "number") {
          cells[i-holes] = i;
        } else {
          ++holes;
        }
      }
      cells.shuffle();
    }
console.log(holes);
    if (holes >= holesToRemove) {
      return true;
    }

    for (var i=0; i<cells.length; ++i) {

      cell = cells[i];
      value = this.board[cell];

      this.board[cell] = null;

      if (this.removeHints(holesToRemove, cells.slice(i+1,cells.length), holes+1)) {
        return true;
      } else {
        this.board[cell] = value;
      }
    }
  }

  Possibilities.prototype.solve = function(n) {

    if (!this.validate()) {
      return false;
    }

    if (!this.removeIllegal()) {
      return false;
    }

    if (this.solved) {
      return true;
    }

    var poss, cell, i, j;

    for (i=(n != null ? n : 0); i<81; ++i) {
      cell = this.get(i);
      if (typeof(cell) === "object") {
        for (j=0; j<cell.length; ++j) {
          poss = this.clone();
          poss.set(cell[j], i);
          if (poss.solve(i+1)) {
            this.board = poss.board;
            return true;
          }
        }
        return false;
      }
    }
  }

  Possibilities.prototype.solve = function(n) {

    if (!this.validate()) {
      return false;
    }

    if (!this.removeIllegal()) {
      return false;
    }

    if (this.solved) {
      return true;
    }

    var poss, cell, i, j;

    for (i=(n != null ? n : 0); i<81; ++i) {
      cell = this.get(i);
      if (typeof(cell) === "object") {
        for (j=0; j<cell.length; ++j) {
          poss = this.clone();
          poss.set(cell[j], i);
          if (poss.solve(i+1)) {
            this.board = poss.board;
            return true;
          }
        }
        return false;
      }
    }
  }

  Possibilities.prototype.countSolutions = function(n) {

    if (!this.validate()) {
      return 0;
    }

    if (!this.removeIllegal()) {
      return 0;
    }

    if (this.solved) {
      return 1;
    }

    var poss, cell, i, j, solutions = 0;

    for (i=(n != null ? n : 0); i<81; ++i) {
      cell = this.get(i);
      if (typeof(cell) === "object") {
        for (j=0; j<cell.length; ++j) {
          poss = this.clone();
          poss.set(cell[j], i);
          solutions += poss.countSolutions(i+1);
          if (solutions > 1) {
            return 2;
          }
        }
        return solutions;
      }
    }
  }

  Possibilities.prototype.removeIllegal = function(n) {
    var x, y, i, cell, newCell, unchanged = true;

    if (n != null && n > 10) {
      return false;
    }

    this.solved = true;
    for (x=0; x<9; ++x) {
      for (y=0; y<9; ++y) {
        cell = this.get(x, y);
        if (typeof(cell) === "object") {
          newCell = [];
          for (i=0; i<cell.length; ++i) {
            if (this.canPlace(cell[i], x, y)) {
              newCell.push(cell[i]);
            }
          }
          if (cell.length !== newCell.length) {
            unchanged = false;
          }
          if (newCell.length === 0) {
            this.solved = false;
            return false;
          } else if (newCell.length === 1) {
            this.set(newCell[0], x, y);
          } else {
            this.solved = false;
            this.set(newCell, x, y);
          }
        }
      }
    }
    if (!unchanged) {
      return this.removeIllegal(n != null ? 0 : n+1);
    }
    return true;
  }

  Possibilities.prototype.validate = function() {
    var x, y, cell;
    for (x=0; x<9; ++x) {
      for (y=0; y<9; ++y) {
        cell = this.get(x, y);
        if (!this.canPlace(cell, x, y)) {
          return false;
        }
      }
    }
    return true;
  }

  Possibilities.prototype.isInRow = function(n, _x, y) {
    var x;
    for (x=0; x<9; ++x) {
      if (x !== _x && this.get(x, y) === n) {
        return true;
      }
    }
    return false;
  }

  Possibilities.prototype.isInColumn = function(n, x, _y) {
    var y;
    for (y=0; y<9; ++y) {
      if (y !== _y && this.get(x, y) === n) {
        return true;
      }
    }
    return false;
  }

  Possibilities.prototype.isInSquare = function(n, _x, _y) {
    var left = _x - _x % 3,
        top = _y - _y % 3;
    for (x=left; x<left+3; ++x) {
      for (y=top; y<top+3; ++y) {
        if ((x !== _x || y !== _y) && this.get(x, y) === n) {
          return true
        }
      }
    }
    return false;
  }

  Possibilities.prototype.canPlace = function(n, x, y) {
    return !(this.isInRow(n, x, y) || this.isInColumn(n, x, y) || this.isInSquare(n, x, y));
  }

  Possibilities.prototype.set = function(n, x, y) {
    var cell;
    if (y == null) {
      cell = x;
    } else {
      cell = y*9 + x;
    }
    this.board[cell] = n;
  }

  Possibilities.prototype.get = function(x, y) {
    var cell;
    if (y == null) {
      cell = x;
    } else {
      cell = y*9 + x;
    }
    return this.board[cell] != null ? this.board[cell] : [1,2,3,4,5,6,7,8,9];
  }

  return Possibilities;
})();

var s = z = atob;

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

  Array.prototype.shuffle = Array.prototype.shuffle != null ? Array.prototype.shuffle : function() {
    var i, j, tmp
    for (i=0; i<this.length; ++i) {
      tmp = this[i];
      j = Math.floor(Math.random()*this.length)
      this[i] = this[j];
      this[j] = tmp;
    }
  }

})();