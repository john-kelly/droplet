/*
# Copyright (c) 2014 Anthony Bau
# MIT License
# 
# Minimalistic HTML5 canvas wrapper. Mainly used as conveneince tools in ICE editor.
*/


/*
# Secret functions
*/


(function() {
  var Group, NoRectangle, Path, Point, QuadTree, Rectangle, Text, exports, _CTX, _area, _intersects,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _area = function(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  };

  _intersects = function(a, b, c, d) {
    return ((_area(a, b, c) > 0) !== (_area(a, b, d) > 0)) && ((_area(c, d, a) > 0) !== (_area(c, d, b) > 0));
  };

  /*
  # Public functions
  */


  exports = {};

  exports.Point = Point = (function() {
    function Point(x, y) {
      this.x = x;
      this.y = y;
    }

    Point.prototype.clone = function() {
      return new Point(this.x, this.y);
    };

    Point.prototype.translate = function(vector) {
      this.x += vector.x;
      return this.y += vector.y;
    };

    Point.prototype.add = function(x, y) {
      this.x += x;
      return this.y += y;
    };

    Point.prototype.copy = function(point) {
      this.x = point.x;
      return this.y = point.y;
    };

    Point.prototype.from = function(point) {
      return new Point(this.x - point.x, this.y - point.y);
    };

    Point.prototype.clear = function() {
      return this.x = this.y = 0;
    };

    return Point;

  })();

  exports.Rectangle = Rectangle = (function() {
    function Rectangle(x, y, width, height) {
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
    }

    Rectangle.prototype.contains = function(point) {
      return (this.x != null) && (this.y != null) && !((point.x < this.x) || (point.x > this.x + this.width) || (point.y < this.y) || (point.y > this.y + this.height));
    };

    Rectangle.prototype.copy = function(rect) {
      this.x = rect.x;
      this.y = rect.y;
      this.width = rect.width;
      return this.height = rect.height;
    };

    Rectangle.prototype.clear = function() {
      this.width = this.height = 0;
      return this.x = this.y = null;
    };

    Rectangle.prototype.bottom = function() {
      return this.y + this.height;
    };

    Rectangle.prototype.right = function() {
      return this.x + this.width;
    };

    Rectangle.prototype.fill = function(ctx, style) {
      ctx.fillStyle = style;
      return ctx.fillRect(this.x, this.y, this.width, this.height);
    };

    Rectangle.prototype.unite = function(rectangle) {
      if (!((this.x != null) && (this.y != null))) {
        return this.copy(rectangle);
      } else {
        this.width = Math.max(this.right(), rectangle.right()) - (this.x = Math.min(this.x, rectangle.x));
        return this.height = Math.max(this.bottom(), rectangle.bottom()) - (this.y = Math.min(this.y, rectangle.y));
      }
    };

    Rectangle.prototype.swallow = function(point) {
      if (!(this.x && (this.y != null))) {
        return this.copy(new Rectangle(point.x, point.y, 0, 0));
      } else {
        this.width = Math.max(this.right(), point.x) - (this.x = Math.min(this.x, point.x));
        return this.height = Math.max(this.bottom(), point.y) - (this.y = Math.min(this.y, point.y));
      }
    };

    Rectangle.prototype.overlap = function(rectangle) {
      return (this.x != null) && (this.y != null) && !(rectangle.x < this.x || (rectangle.y < y) || (rectangle.right() > this.right()) || (rectangle.bottom() > this.bottom()));
    };

    Rectangle.prototype.translate = function(vector) {
      this.x += vector.x;
      return this.y += vector.y;
    };

    return Rectangle;

  })();

  exports.NoRectangle = NoRectangle = (function(_super) {
    __extends(NoRectangle, _super);

    function NoRectangle() {
      NoRectangle.__super__.constructor.call(this, null, null, 0, 0);
    }

    return NoRectangle;

  })(Rectangle);

  exports.Path = Path = (function() {
    function Path() {
      this._points = [];
      this._cachedTranslation = new Point(0, 0);
      this._cacheFlag = false;
      this._bounds = new NoRectangle();
      this.style = {
        'strokeColor': '#000',
        'fillColor': null
      };
    }

    Path.prototype._clearCache = function() {
      var point, _i, _len, _ref;
      if (this._cacheFlag) {
        _ref = this._points;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          point = _ref[_i];
          point.translate(this._cachedTranslation);
        }
        this._bounds.translate(this._cachedTranslation);
        this._cachedTranslation.clear();
        return this._cacheFlag = false;
      }
    };

    Path.prototype.recompute = function() {
      var point, _i, _len, _ref, _results;
      this._bounds = new NoRectangle();
      _ref = this._points;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        point = _ref[_i];
        _results.push(this._bounds.swallow(point));
      }
      return _results;
    };

    Path.prototype.push = function(point) {
      this._points.push(point);
      return this._bounds.swallow(point);
    };

    Path.prototype.unshift = function(point) {
      this._points.unshift(point);
      return this._bounds.swallow(point);
    };

    Path.prototype.contains = function(point) {
      var count, dest, end, last, _i, _len, _ref;
      this._clearCache();
      dest = new Point(this._bounds.x - 1, point.y);
      count = 0;
      last = this._points[this._points.length - 1];
      _ref = this._points;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        end = _ref[_i];
        if (_intersects(last, end, point, dest)) {
          count += 1;
        }
        last = end;
      }
      return count % 2 === 1;
    };

    Path.prototype.bounds = function() {
      this._clearCache();
      return this._bounds;
    };

    Path.prototype.translate = function(vector) {
      this._cachedTranslation.translate(vector);
      return this._cacheFlag = true;
    };

    Path.prototype.draw = function(ctx) {
      var point, _i, _len, _ref;
      this._clearCache();
      ctx.strokeStyle = this.style.strokeColor;
      if (this.style.fillColor != null) {
        ctx.fillStyle = this.style.fillColor;
      }
      ctx.beginPath();
      ctx.moveTo(this._points[0].x, this._points[0].y);
      _ref = this._points;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        point = _ref[_i];
        ctx.lineTo(point.x, point.y);
      }
      ctx.lineTo(this._points[0].x, this._points[0].y);
      ctx.stroke();
      if (this.style.fillColor != null) {
        return ctx.fill();
      }
    };

    return Path;

  })();

  _CTX = null;

  exports.Text = Text = (function() {
    Text.prototype._FONT_SIZE = 15;

    function Text(point, value) {
      this.point = point;
      this.value = value;
      _CTX.font = Text.prototype._FONT_SIZE + 'px Courier New';
      this._bounds = new Rectangle(this.point.x, this.point.y, _CTX.measureText(this.value).width, Text.prototype._FONT_SIZE);
    }

    Text.prototype.bounds = function() {
      return this._bounds;
    };

    Text.prototype.contains = function(point) {
      return this._bounds.contains(point);
    };

    Text.prototype.translate = function(vector) {
      this.point.translate(vector);
      return this._bounds.translate(vector);
    };

    Text.prototype.setPosition = function(point) {
      return this.translate(point.from(this.point));
    };

    Text.prototype.draw = function(ctx) {
      ctx.textBaseline = 'top';
      ctx.font = Text.prototype._FONT_SIZE + 'px Courier New';
      ctx.fillStyle = '#000';
      return ctx.fillText(this.value, this.point.x, this.point.y);
    };

    return Text;

  })();

  exports._setCTX = function(ctx) {
    return _CTX = ctx;
  };

  exports.Group = Group = (function() {
    function Group() {
      this.children = [];
      this._cachedTranslation = new Point(0, 0);
      this._cacheFlag = false;
      this._bounds = new NoRectangle();
    }

    Group.prototype._clearCache = function() {
      var child, _i, _len, _ref;
      if (this._cacheFlag) {
        _ref = this.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          child.translate(this._cachedTranslation);
        }
        this._cachedTranslation.clear();
        return this._cacheFlag = false;
      }
    };

    Group.prototype.empty = function() {
      this.children.length = 0;
      return this._bounds.clear();
    };

    Group.prototype.recompute = function() {
      var child, _i, _len, _ref, _results;
      this._bounds.clear();
      _ref = this.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(this._bounds.unite(child.bounds()));
      }
      return _results;
    };

    Group.prototype.translate = function(vector) {
      return this._cachedTranslation.translate(vector);
    };

    Group.prototype.push = function(child) {
      this.children.push(child);
      return this._bounds.unite(child.bounds());
    };

    Group.prototype.bounds = function() {
      this._clearCache();
      return this._bounds;
    };

    Group.prototype.setPosition = function(point) {
      return this.translate(point.from(new Point(this.bounds().x, this.bounds.y)));
    };

    Group.prototype.contains = function(point) {
      var child, _i, _len, _ref;
      this._clearCache;
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (child.contains(point)) {
          return true;
        }
      }
      return false;
    };

    Group.prototype.draw = function(ctx) {
      var child, _i, _len, _ref, _results;
      _ref = this.children;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        _results.push(child.draw(ctx));
      }
      return _results;
    };

    return Group;

  })();

  exports.QuadTree = QuadTree = (function() {
    function QuadTree(bounds) {
      this.bounds = bounds;
      this.children = null;
      this.contents = [];
    }

    QuadTree.prototype._split = function() {
      var child, content, _i, _j, _len, _len1, _ref, _ref1;
      this.children = [new QuadTree(new Rectangle(this.bounds.x + this.bounds.width / 2, this.bounds.y, this.bounds.height / 2, this.bounds.width / 2)), new QuadTree(new Rectangle(this.bounds.x, this.bounds.y, this.bounds.height / 2, this.bounds.width / 2)), new QuadTree(new Rectangle(this.bounds.x, this.bounds.y + this.bounds.width / 2, this.bounds.height / 2, this.bounds.width / 2)), new QuadTree(new Rectangle(this.bounds.x + this.bounds.width / 2, this.bounds.y + this.bounds.width / 2, this.bounds.height / 2, this.bounds.width / 2))];
      _ref = this.contents;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        content = _ref[_i];
        _ref1 = this.children;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          child = _ref1[_j];
          if (content.rect.overlap(child.bounds)) {
            child.insert(content);
          }
        }
      }
      return this.contents = [];
    };

    QuadTree.prototype.insert = function(obj) {
      var child, _i, _len, _ref, _results;
      if (this.children != null) {
        _ref = this.children;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (obj.rect.overlap(child.bounds)) {
            _results.push(child.insert(obj));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      } else {
        return this.contents.push(obj);
      }
    };

    QuadTree.prototype.find = function(point) {
      var child, content, _i, _j, _len, _len1, _ref, _ref1;
      if (this.children != null) {
        _ref = this.children;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          child = _ref[_i];
          if (child.bounds.contains(point)) {
            return child.find(point);
          }
        }
      } else {
        _ref1 = this.contents;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          content = _ref1[_j];
          if (content.rect.contains(point)) {
            return content;
          }
        }
      }
    };

    return QuadTree;

  })();

  window.draw = exports;

  /*
  # Performance strategy (might not be faster): convert paths to images in offscreen canvas once drawn, then translate those instead.
  */


}).call(this);

/*
//@ sourceMappingURL=draw.js.map
*/