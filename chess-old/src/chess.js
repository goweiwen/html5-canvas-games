var Game = (function() {

  function Game($tbody) {
    this.board = new Board($tbody, WIDTH, HEIGHT);
  }

  return Game;
})();

var Board = (function() {

  function Board($tbody, width, height) {
    var self = this,
        row, $row, x, y;
    this.$tbody = $tbody;
    this.grid = [];
    this.width = width;
    this.height = height;
    for (y=0; y < height; ++y) {
      row = this.grid[y] = [];
      $row = $tbody.children('tr').eq(y);
      for (x=0; x < width; ++x) {
        $row.children('td').eq(x)
          .attr("_c", x)
          .attr("_r", y);
      }
    }
    this.initialise();
    this.history = [];
    this.eaten = ["", ""];

    var $history = $("#history");
    $tbody.children('tr').children('td').click(function(e) {
      var x = parseInt(this.getAttribute('_c')), 
          y = parseInt(this.getAttribute('_r'));
      if (self.isLegalMove(x, y)) {
        var _x = self.selected[0], 
            _y = self.selected[1],
            piece = self.getCell(self.selected[0], self.selected[1]);
        
        var isEnPassant = Pawn.prototype.isPrototypeOf(piece) && 
                          _x !== x && _y !== y &&
                          self.getCell(x, y) == null;
        
        var isKingSideCastle = King.prototype.isPrototypeOf(piece) && 
                          (x === 6) && (y === 0 || y === 7);
        
        var isQueenSideCastle = King.prototype.isPrototypeOf(piece) && 
                          (x === 2) && (y === 0 || y === 7);

        if (isKingSideCastle || isQueenSideCastle) {

          $history.append(
              (piece.colour == WHITE ? "<br/>" + Math.ceil(self.turn/2) + ". " : " ") +
              (isQueenSideCastle ? "0-0-0" : "0-0")
            );

        } else {

          $history.append(
              (piece.colour == WHITE ? "<br/>" + Math.ceil(self.turn/2) + ". " : " ") +
              (self.getCell(x, y) != null ? "x" : "") +
              piece.getText(true) + "abcdefgh"[x] + (8-y) +
              (isEnPassant ? "e.p." : "")
            );

        }

        piece.setPos(x, y);
        ++self.turn;
      }

      return self.select(x, y);
    });
  }

  Board.prototype.initialise = function() {
    new Rook  (this, BLACK, 0, 0);
    new Knight(this, BLACK, 1, 0);
    new Bishop(this, BLACK, 2, 0);
    new Queen (this, BLACK, 3, 0);
    new King  (this, BLACK, 4, 0);
    new Bishop(this, BLACK, 5, 0);
    new Knight(this, BLACK, 6, 0);
    new Rook  (this, BLACK, 7, 0);

    new Pawn(this, BLACK, 0, 1);
    new Pawn(this, BLACK, 1, 1);
    new Pawn(this, BLACK, 2, 1);
    new Pawn(this, BLACK, 3, 1);
    new Pawn(this, BLACK, 4, 1);
    new Pawn(this, BLACK, 5, 1);
    new Pawn(this, BLACK, 6, 1);
    new Pawn(this, BLACK, 7, 1);

    new Rook  (this, WHITE, 0, 7);
    new Knight(this, WHITE, 1, 7);
    new Bishop(this, WHITE, 2, 7);
    new Queen (this, WHITE, 3, 7);
    new King  (this, WHITE, 4, 7);
    new Bishop(this, WHITE, 5, 7);
    new Knight(this, WHITE, 6, 7);
    new Rook  (this, WHITE, 7, 7);

    new Pawn(this, WHITE, 0, 6);
    new Pawn(this, WHITE, 1, 6);
    new Pawn(this, WHITE, 2, 6);
    new Pawn(this, WHITE, 3, 6);
    new Pawn(this, WHITE, 4, 6);
    new Pawn(this, WHITE, 5, 6);
    new Pawn(this, WHITE, 6, 6);
    new Pawn(this, WHITE, 7, 6);

    this.turn = 1;
  }

  Board.prototype.select = function(x, y) {
    this.deselect();
    this.selected = [x, y];
    this.get$cell(x, y).addClass('selected');
    var i, legal = this.legal;
    if (this.getCell(x, y) != null) {
      if (this.turn % 2 === this.getCell(x, y).colour) {
        this.legal = [];
      } else {
        legal = this.getCell(x, y).legalMoves();
        for (i=0; i<legal.length; ++i) {
          this.get$cell(legal[i][0], legal[i][1]).addClass('legal');
        }
        this.legal = legal;
      }
    }
  }

  Board.prototype.deselect = function(x, y) {
    if (this.selected != null) {
      this.get$cell(this.selected[0], this.selected[1]).removeClass('selected');
    }
    var i, legal;
    legal = this.legal;
    if (legal != null) {
      for (i=0; i<legal.length; ++i) {
        this.get$cell(legal[i][0], legal[i][1]).removeClass('legal');
      }
    }
    this.selected = undefined;
    this.legal = [];
  }

  Board.prototype.isValidPos = function(x, y) {
    if ((x == null || y == null) ||
        (isNaN(x) || isNaN(y)) ||
        (x < 0 || x >= this.width) || 
        (y < 0 || y >= this.height)) {
      return false;
    }
    return true;
  }

  Board.prototype.isLegalMove = function(x, y) {
    var i, legal;
    legal = this.legal;
    if (legal == null) {
      return false;
    }
    for (i=0; i<legal.length; ++i) {
      if (legal[i][0] == x && legal[i][1] == y) {
        return true;
      }
    }
    return false;
  }

  Board.prototype.getCell = function(x, y) {
    if (!this.isValidPos(x, y)) {
      return;
    }
    return this.grid[y][x];
  }

  Board.prototype.get$cell = function(x, y) {
    return this.$tbody.children('tr').eq(y).children('td').eq(x);
  }

  Board.prototype.get$cellspan = function(x, y) {
    return this.get$cell(x, y).children('p');
  }

  Board.prototype.addPiece = function(x, y, piece) {
    if (!this.isValidPos(x, y)) {
      throw "Board.addPiece(x, y): Invalid x or y";
    }
    if (this.grid[y][x] != null) {
      throw "Board.addPiece(x, y): Piece exists at (x, y)";
    }
    this.grid[y][x] = piece;
    this.get$cellspan(x, y).text(piece.text);
    this.get$cellspan(x, y).addClass(["white", "black"][piece.colour]);
  }

  Board.prototype.canMove = function(x, y) {
    if (!this.isValidPos(x, y)) {
      return false;
    }
    var piece = this.getCell(x, y);
    if (piece != null) {
      return false;
    }
    return true;
  }

  Board.prototype.canEat = function(x, y, colour) {
    if (!this.isValidPos(x, y)) {
      return false;
    }
    var piece = this.getCell(x, y);
    if (piece != null) {
      return piece.colour !== colour;
    } else {
      return true;
    }
  }

  Board.prototype.hasThreat = function(_x, _y, colour) {
    if (!this.isValidPos(_x, _y)) {
      return false;
    }

    var piece, x, y, i, legalMoves;

    for (y=0; y<8; ++y) {
      for (x=0; x<8; ++x) {
        if (x === _x && y === _y) {
          continue;
        }
        piece = this.getCell(x, y);
        if (piece != null && 
            piece.colour !== colour &&
            !King.prototype.isPrototypeOf(piece)) {

          legalMoves = piece.legalMoves();
          for (i=0; i<legalMoves.length; ++i) {
            if (legalMoves[i][0] === _x &&
                legalMoves[i][1] === _y) {
              return true;
            }
          }

        }

      }
    }
    return false;
  }

  Board.prototype.removePiece = function(x, y) {
    if (!this.isValidPos(x, y)) {
      throw "Board.removePiece(x, y): Invalid x or y";
    }
    if (this.grid[y][x] == null) {
      throw "Board.removePiece(x, y): No piece exists at (x, y)";
    }
    var piece = this.grid[y][x];
    this.get$cellspan(x, y).text("");
    this.get$cellspan(x, y).removeClass(["white", "black"][piece.colour]);
    piece.destroy();
    this.grid[y][x] = undefined;
  }

  Board.prototype.movePiece = function(_x, _y, x, y) {
    if (!this.isValidPos(x, y) || !this.isValidPos(_x, _y)) {
      throw "Board.movePiece(_x, _y, x, y): Invalid _x or _y or x or y";
    }
    var piece = this.grid[_y][_x];
    if (this.grid[y][x] != null) {
      this.eatPiece(x, y, piece.colour);
    }
    this.get$cellspan(_x, _y).text("");
    this.get$cellspan(_x, _y).removeClass(["white", "black"][piece.colour]);
    this.grid[_y][_x] = undefined;

    this.grid[y][x] = piece;
    this.get$cellspan(x, y).text(piece.text);
    this.get$cellspan(x, y).addClass(["white", "black"][piece.colour]);
    this.deselect();
  }

  Board.prototype.eatPiece = function(x, y, colour) {
console.log(colour);
      this.eaten[colour] = this.eaten[colour] + this.getCell(x, y).text;
      this.removePiece(x, y);
      $(colour == 0 ? "#eaten > .black" : "#eaten > .white").text(this.eaten[colour]);
  }

  return Board;
})();

var Piece = (function() {

  function Piece() {
  }

  Piece.prototype.init = function(board, colour, x, y) {
    if (board == null || !board.grid) {
      throw "Piece(board, colour, x, y): Invalid board";
    }
    if (colour == null || (colour !== 0 && colour !== 1)) {
      throw "Piece(board, colour, x, y): Invalid colour";
    } else if (!board.isValidPos(x, y)) {
      throw "Piece(board, colour, x, y): Invalid x or y";
    }
    this.board = board;
    this.colour = colour;
    this.text = this.getText();
    this.x = x, this.y = y;
    this.board.addPiece(x, y, this);
  }

  Piece.prototype.getText = function() {
    return "?";
  }

  Piece.prototype.setPos = function(x, y) {
    if (!this.board.isValidPos(x, y)) {
      throw "Piece.setPos(x, y): Invalid x and y";
    }
    this.board.movePiece(this.x, this.y, x, y);
    this.x = x;
    this.y = y;
  };

  Piece.prototype.destroy = function(x, y) {
  };

  Piece.prototype.canEat = function(x, y) {
    return this.board.canEat(x, y, this.colour);
  };

  Piece.prototype.canMove = function(x, y) {
    return this.board.canMove(x, y);
  };

  Piece.prototype.safeToMove = function(x, y) {
    if (!this.board.canMove(x, y)) {
      return false;
    }
    return !this.board.hasThreat(x, y, this.colour);
  };

  Piece.prototype.legalMoves = function() {
    var i, j, ret = [];
    for (i=0; i < this.board.height; ++i) {
      for (j=0; j < this.board.width; ++j) {
        if ((this.x !== j || this.y !== i) && this.board.canEat(j, i, this.colour)) {
          ret.push([j, i]);
        }
      }
    }
    return ret;
  };

  return Piece;
})();

var King = (function() {
  King.prototype = new Piece();
  King.prototype.MOVES = [[1,1],[1,0],[1,-1],[0,1],[0,-1],[-1,1],[-1,0],[-1,-1]];
  
  function King(board, colour, x, y) {
    this.init(board, colour, x, y);
  }

  King.prototype.getText = function() {
    return KING[this.colour];
  }

  King.prototype.legalMoves = function() {
    var i, x, y, piece, ret = [], 
        MOVES = this.MOVES;

    for (i=0; i < MOVES.length; ++i) {
      x = MOVES[i][0] + this.x, y = MOVES[i][1] + this.y;
      if (this.canEat(x, y) && this.safeToMove(x, y, this.colour)) {
        ret.push([x, y]);
      }
    }

    // castling
    if (!this.moved) {
      x = this.x;
      y = this.y;

      piece = this.board.getCell(0, y);
      if (piece && !piece.moved &&
          this.safeToMove(1, y) &&
          this.safeToMove(2, y) &&
          this.safeToMove(3, y)) {
        ret.push([2, y]);
      }
      piece = this.board.getCell(7, y);
      if (piece && !piece.moved &&
          this.safeToMove(6, y) &&
          this.safeToMove(5, y)) {
        ret.push([6, y]);
      }
    }

    return ret;
  };

  King.prototype._setPos = King.prototype.setPos;
  King.prototype.setPos = function() {
    var x = arguments[0], 
        y = arguments[1];

    if (x-this.x > 1) {
      this.board.getCell(7, this.y).setPos(5, this.y);
    }

    if (x-this.x < -1) {
      this.board.getCell(0, this.y).setPos(3, this.y);
    }

    this._setPos(x, y);
    this.moved = true;
  }

  return King;
})();

var Queen = (function() {
  Queen.prototype = new Piece();
  
  function Queen(board, colour, x, y) {
    this.init(board, colour, x, y);
  }

  Queen.prototype.getText = function() {
    return QUEEN[this.colour];
  }

  Queen.prototype.legalMoves = function() {
    var ret = Bishop.prototype.legalMoves.call(this);
    return ret.concat(Rook.prototype.legalMoves.call(this));
  }

  return Queen;
})();

var Rook = (function() {
  Rook.prototype = new Piece();
  
  function Rook(board, colour, x, y) {
    this.init(board, colour, x, y);
  }

  Rook.prototype.getText = function() {
    return ROOK[this.colour];
  }

  Rook.prototype.legalMoves = function() {
    var i, j, 
        ret = [], 
        x = this.x, 
        y = this.y;

    for (i=y+1; i < this.board.height; ++i) {
      if (this.canEat(x, i)) {
        ret.push([x, i]);
      }
      if (!this.canMove(x, i)) {
        break;
      }
    }
    for (i=y-1; i >= 0; --i) {
      if (this.canEat(x, i)) {
        ret.push([x, i]);
      }
      if (!this.canMove(x, i)) {
        break;
      }
    }
    for (i=x+1; i < this.board.width; ++i) {
      if (this.canEat(i, y)) {
        ret.push([i, y]);
      }
      if (!this.canMove(i, y)) {
        break;
      }
    }
    for (i=x-1; i >= 0; --i) {
      if (this.canEat(i, y)) {
        ret.push([i, y]);
      }
      if (!this.canMove(i, y)) {
        break;
      }
    }
    return ret;
  };

  Rook.prototype._setPos = Rook.prototype.setPos;
  Rook.prototype.setPos = function() {
    this._setPos(arguments[0], arguments[1]);
    this.moved = true;
  }

  return Rook;
})();

var Knight = (function() {

  Knight.prototype = new Piece();
  Knight.prototype.MOVES = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
  
  function Knight(board, colour, x, y) {
    this.init(board, colour, x, y);
  }

  Knight.prototype.getText = function() {
    return KNIGHT[this.colour];
  }

  Knight.prototype.legalMoves = function() {
    var i, x, y, ret = [], 
        MOVES = this.MOVES;

    for (i=0; i < MOVES.length; ++i) {
      x = MOVES[i][0] + this.x, y = MOVES[i][1] + this.y;
      if (this.canEat(x, y)) {
        ret.push([x, y]);
      }
    }
    return ret;
  };

  return Knight;
})();

var Bishop = (function() {
  Bishop.prototype = new Piece();
  
  function Bishop(board, colour, x, y) {
    this.init(board, colour, x, y);
  }

  Bishop.prototype.getText = function() {
    return BISHOP[this.colour];
  }

  Bishop.prototype.legalMoves = function() {
    var i, j, 
        ret = [],
        x = this.x, 
        y = this.y;

    for (i=1;; ++i) {
      if (this.canEat(x+i, y+i)) {
        ret.push([x+i, y+i]);
      }
      if (!this.canMove(x+i, y+i)) {
        break;
      }
    }
    for (i=1;; ++i) {
      if (this.canEat(x-i, y+i)) {
        ret.push([x-i, y+i]);
      }
      if (!this.canMove(x-i, y+i)) {
        break;
      }
    }
    for (i=1;; ++i) {
      if (this.canEat(x+i, y-i)) {
        ret.push([x+i, y-i]);
      }
      if (!this.canMove(x+i, y-i)) {
        break;
      }
    }
    for (i=1;; ++i) {
      if (this.canEat(x-i, y-i)) {
        ret.push([x-i, y-i]);
      }
      if (!this.canMove(x-i, y-i)) {
        break;
      }
    }

    return ret;
  };

  return Bishop;
})();

var Pawn = (function() {
  Pawn.prototype = new Piece();
  
  function Pawn(board, colour, x, y) {
    this.init(board, colour, x, y);
    this.moved = false;
    this.firstMoved = -1;
  }

  Pawn.prototype.getText = function(notation) {
    return notation ? "" : PAWN[this.colour];
  }

  Pawn.prototype._setPos = Pawn.prototype.setPos;
  Pawn.prototype.setPos = function() {
    var x = arguments[0],
        y = arguments[1];

    if (x !== this.x && y !== this.y &&
        this.board.getCell(x, y) == null) {
      this.board.eatPiece(x, this.y, this.colour);
    }

    this._setPos(x, y);
    this.moved = true;
    this.firstMoved = this.firstMoved != -1 ? this.firstMoved : this.board.turn;

    var promotionRank = [0, 7][this.colour];
    if (y === promotionRank) {
      this.promote();
    }
  }

  Pawn.prototype.promote = function() {
    var board = this.board,
        colour = this.colour,
        x = this.x,
        y = this.y;
    board.removePiece(this.x, this.y);
    new Queen (board, colour, x, y);
  }

  Pawn.prototype.legalMoves = function() {
    var ret = [], offset, x = this.x, y = this.y, piece;

    offset = [-1, 1][this.colour];
    if (this.canMove(x, y+offset)) {
      ret.push([x, y+offset]);
      if (!this.moved) {
        offset = [-2, 2][this.colour];
        if (this.canMove(x, y+offset)) {
          ret.push([x, y+offset]);
        }
      }
    }

    offset = [-1, 1][this.colour];
    if (!this.canMove(x+1, y+offset) && this.canEat(x+1, y+offset)) {
      ret.push([x+1, y+offset]);
    }
    if (!this.canMove(x-1, y+offset) && this.canEat(x-1, y+offset)) {
      ret.push([x-1, y+offset]);
    }

    // en passant

    piece = this.board.getCell(x+1, y);
    if (piece != null && piece.firstMoved === this.board.turn-1 &&
        this.canMove(x+1, y+offset)) {
      ret.push([x+1, y+offset]);
    }
    piece = this.board.getCell(x-1, y);
    if (piece != null && piece.firstMoved === this.board.turn-1 &&
        this.canMove(x-1, y+offset)) {
      ret.push([x-1, y+offset]);
    }

    return ret;
  };

  return Pawn;
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