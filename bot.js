// Generated by CoffeeScript 1.6.2
(function() {
  var Bot, fs,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  require('string-format');

  fs = require('fs');

  Bot = (function() {
    var pickOne, similarity;

    similarity = function(incoming, words) {
      var m, match, score, word, _i, _j, _len, _len1;

      score = 0;
      for (_i = 0, _len = incoming.length; _i < _len; _i++) {
        word = incoming[_i];
        match = words.filter(function(w) {
          return w.word === word;
        });
        for (_j = 0, _len1 = match.length; _j < _len1; _j++) {
          m = match[_j];
          score += 1 / m.score;
        }
      }
      return score / incoming.length;
    };

    pickOne = function(items) {
      var index;

      index = Math.random();
      index *= Math.pow(10, (items.length - 1) / 10);
      return items[Math.floor(index)];
    };

    function Bot(_arg) {
      var _ref, _ref1, _ref2, _ref3, _ref4,
        _this = this;

      this.name = _arg.name, this.channel = _arg.channel, this.chattiness = _arg.chattiness, this.muted = _arg.muted, this.server = _arg.server;
      this.respond = __bind(this.respond, this);
      this.canRespondTo = __bind(this.canRespondTo, this);
      this.save = __bind(this.save, this);
      this.prepare = __bind(this.prepare, this);
      this.receive = __bind(this.receive, this);
      this.dump = __bind(this.dump, this);
      if ((_ref = this.name) == null) {
        this.name = 'ruddy';
      }
      if ((_ref1 = this.channel) == null) {
        this.channel = '#redspider';
      }
      if ((_ref2 = this.chattiness) == null) {
        this.chattiness = 0;
      }
      if ((_ref3 = this.muted) == null) {
        this.muted = false;
      }
      if ((_ref4 = this.server) == null) {
        this.server = 'localhost';
      }
      this.names = [this.name];
      this.messages = require('./database.json');
      this.client = (function() {
        var client, irc;

        irc = require('irc');
        client = new irc.Client(_this.server, _this.name, {
          channels: [_this.channel],
          userName: _this.name,
          realName: _this.name
        });
        client.on('message' + _this.channel, _this.receive);
        client.on('names', function(channel, nicks) {
          var nick, value;

          _this.names = (function() {
            var _results;

            _results = [];
            for (nick in nicks) {
              value = nicks[nick];
              _results.push(nick);
            }
            return _results;
          })();
          _this.names.push(_this.name);
          return console.log("Got names!", _this.names);
        });
        return {
          say: function(to, message) {
            return client.say(to, message);
          }
        };
      })();
      setInterval(this.dump, 5000);
    }

    Bot.prototype.dump = function() {
      return fs.writeFile('./database.json', JSON.stringify(this.messages));
    };

    Bot.prototype.receive = function(from, text) {
      var message;

      message = this.prepare(text);
      console.log(from, ': ', text);
      if (this.canRespondTo(text)) {
        this.respond(from, message);
      }
      return this.save(message);
    };

    Bot.prototype.prepare = function(message) {
      var i, name, regex, word, _i, _len, _ref;

      message = message.replace(/^\s*/, '');
      message = message.replace(/\s*$/, '');
      message = message.replace(/^\S+:\s*/, '');
      message = message.replace('}', '}}');
      message = message.replace('{', '{{');
      i = 0;
      _ref = this.names;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        regex = new RegExp("\\b" + name + "\\b", 'gi');
        if (regex.test(message)) {
          message = message.replace(regex, "{" + i + "}");
          i += 1;
        }
      }
      return {
        words: (function() {
          var _j, _len1, _ref1, _results;

          _ref1 = message.split(' ');
          _results = [];
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            word = _ref1[_j];
            _results.push(word.toLowerCase());
          }
          return _results;
        })(),
        text: message
      };
    };

    Bot.prototype.save = function(message) {
      return this.messages.push(message);
    };

    Bot.prototype.canRespondTo = function(message) {
      return !this.muted && (Math.random() <= this.chattiness || 0 <= message.indexOf(this.name));
    };

    Bot.prototype.respond = function(from, message) {
      var count, i, index, m, matches, w, word, words, _ref;

      words = (function() {
        var _i, _j, _len, _len1, _ref, _ref1, _results;

        _ref = message.words;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          word = _ref[_i];
          count = 0;
          _ref1 = (function() {
            var _k, _len1, _ref1, _results1;

            _ref1 = this.messages;
            _results1 = [];
            for (_k = 0, _len1 = _ref1.length; _k < _len1; _k++) {
              m = _ref1[_k];
              _results1.push(m.words);
            }
            return _results1;
          }).call(this);
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            w = _ref1[_j];
            if (0 <= w.indexOf(word)) {
              count += 1;
            }
          }
          _results.push({
            score: count,
            word: word
          });
        }
        return _results;
      }).call(this);
      matches = (function() {
        var _i, _len, _ref, _results;

        _ref = this.messages;
        _results = [];
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          m = _ref[i];
          if (m.words.some(function(w) {
            return words.some(function(w2) {
              return w2.word.toLowerCase() === w.toLowerCase();
            });
          })) {
            _results.push({
              i: i,
              text: m.text,
              words: m.words
            });
          }
        }
        return _results;
      }).call(this);
      if (!(matches != null ? matches.length : void 0)) {
        return;
      }
      matches.sort(function(a, b) {
        return (similarity(b.words, words)) - (similarity(a.words, words));
      });
      matches = matches.slice(0, 6);
      index = pickOne(matches);
      message = this.messages[index.i + 1];
      if (message != null) {
        console.log(this.name, ': ', message.text);
        this.save(message);
        return this.client.say(this.channel, (_ref = message.text).format.apply(_ref, [from].concat(__slice.call(this.names))));
      }
    };

    return Bot;

  })();

  module.exports = Bot;

}).call(this);