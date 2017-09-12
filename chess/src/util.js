(function() {
  String.prototype.repeat = String.prototype.repeat != null ? String.prototype.repeat : function(count) {
    var ret = ""
    for (var i=0; i<count; ++i) {
      ret = ret + this
    }
    return ret
  }

  String.prototype.replaceAll = function(search, replacement) {
    return this.split(search).join(replacement)
  }

  Function.prototype.bind = Function.prototype.bind != null ? Function.prototype.bind : function(ctx) {
    var fn = this
    return function() {
      return fn.apply(ctx, arguments)
    }
  }

  Function.prototype.call = Function.prototype.call != null ? Function.prototype.call : function(ctx) {
    return this.apply(ctx, arguments)
  }

  Array.prototype.peek = function() {
    return this[this.length - 1]
  }
})();

var p = console.log.bind(console)
function clamp(x, min, max) { return x > max ? max : x < min ? min : x }
function sign(x) { return x > 0 ? 1 : x < 0 ? -1 : 0 }
function r() { return Math.floor(Math.random() * 256) }