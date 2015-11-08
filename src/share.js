(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Share = factory(); // jshint ignore:line
}(this, function () {
  'use strict';

  var allowedShares = ['vk', 'fb', 'ok', 'tw'];

  function isFunction(func) {
    var obj = {};
    return func && obj.toString.call(func) === '[object Function]';
  }

  function hasOwnProp(a, b) {
    return Object.prototype.hasOwnProperty.call(a, b);
  }

  function extend(a, b) {
    for (var i in b) {
      if (hasOwnProp(b, i)) {
        a[i] = b[i];
      }
    }

    if (hasOwnProp(b, 'toString')) {
      a.toString = b.toString;
    }

    if (hasOwnProp(b, 'valueOf')) {
      a.valueOf = b.valueOf;
    }

    return a;
  }

  function Share_utils(config, callback) {
    this.config = config;
    this.callback = callback;
    this.results = {};
    this.reached = 0;
    this.requested = 0;
    this.timeout = false;
    this.socialIframes = {};
    this.createSocialIframes();
    this.createScopeIframe();
  }

  Share_utils.map = {
    vk: 'http://vkontakte.ru/share.php?act=count&index=1&format=json&url=',
    ok: 'http://ok.ru/dk?st.cmd=extLike&uid=odklcnt0&ref=',
    fb: 'http://api.facebook.com/restserver.php?callback=getFB&method=links.getStats&format=json&urls=',
    tw: 'http://urls.api.twitter.com/1/urls/count.json?callback=getTW&url='
  };

  Share_utils.prototype.createSocialIframes = function () {
    var url = escape(this.config.url);

    for (var i = 0, includeLength = this.config.include.length; i < includeLength; i++) {
      var item = this.config.include[i];

      if (this.config.exclude.indexOf(item) === -1 && allowedShares.indexOf(item) !== -1) {
        this.socialIframes[item] = this.createSocialIframe(Share_utils.map[item] + url, item);
        this.requested++;
      }
    }
  };

  Share_utils.prototype.createScopeIframe = function () {
    var self = this,

    frameLoad = function () {
      self.timeout = setTimeout(function () {
        self.callback(self.results);
        self.scopeIframe.parentNode.removeChild(self.scopeIframe);
      }, self.config.delay);

      this.contentWindow.window.getTW = function () {
        self.push('tw', arguments);
      };
      this.contentWindow.window.getFB = function () {
        self.push('fb', arguments);
      };

      this.contentWindow.window.VK = {
        Share: {
          count: function () {
            self.push('vk', arguments);
          }
        }
      };

      this.contentWindow.window.ODKL = {
        updateCount: function () {
          self.push('ok', arguments);
        }
      };

      if (self.socialIframes.vk) {
        this.contentWindow.document.body.appendChild(self.socialIframes.vk);
      }

      if (self.socialIframes.ok) {
        this.contentWindow.document.body.appendChild(self.socialIframes.ok);
      }

      if (self.socialIframes.tw) {
        this.contentWindow.document.body.appendChild(self.socialIframes.tw);
      }

      if (self.socialIframes.fb) {
        this.contentWindow.document.body.appendChild(self.socialIframes.fb);
      }
    };

    this.scopeIframe = document.createElement('iframe');
    this.scopeIframe.setAttribute('id', 'scopeIframe');
    this.scopeIframe.style.width = '1px';
    this.scopeIframe.style.height = '1px';
    this.scopeIframe.style.display = 'none';
    this.scopeIframe.onload = frameLoad;

    document.body.appendChild(this.scopeIframe);
  };

  Share_utils.prototype.push = function (type, data) {
    var count;

    switch (type) {
      case 'ok':
      case 'vk':
        if (data[1] !== undefined) {
          count = data[1];
        }
      break;

      case 'tw':
        if (typeof data[0] === 'object' && data[0].hasOwnProperty('count')) {
          count = data[0].count;
        }
      break;

      case 'fb':
        data = data[0];
        if (typeof data[0] === 'object' && data[0].hasOwnProperty('share_count')) {
          count = data[0].share_count;
        }
      break;
    }

    if (count !== undefined) {
      this.results[type] = Number(count);
      this.reached++;
    }

    if (this.reached >= this.requested) {
      clearTimeout(this.timeout);
      this.callback(this.results);
      this.scopeIframe.parentNode.removeChild(this.scopeIframe);
    }
  };

  Share_utils.prototype.createSocialIframe = function (src, type) {
    var script = document.createElement('script'),
        self = this;

    script.src = src;
    script.async = true;
    script.onerror = function (error) {
      self.results[type] = false;
      self.reached++;

      if (self.reached >= self.requested) {
        clearTimeout(self.timeout);
        self.callback(self.results);
        self.scopeIframe.parentNode.removeChild(self.scopeIframe);
      }
    };

    return script;
  };

  function Share(config, callback) {
    var share_config = {
      include: allowedShares,
      exclude: [],
      url: window.location.href,
      delay: 5000
    };

    var share_callback = function () {};

    if (isFunction(config)) {
      share_callback = callback;
    } else {
      if (typeof config === 'object') {
        extend(share_config, config);
      }

      if (isFunction(callback)) {
        share_callback = callback;
      }
    }

    var _utils = new Share_utils(share_config, share_callback);
  }

  return Share;
}));