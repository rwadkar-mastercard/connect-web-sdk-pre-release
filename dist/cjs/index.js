"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Connect = void 0;
var _constants = require("./constants");
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var evHandlers;
var onMessageFn;
var connectUrl;
var iframe;
var metaEl;
var targetWindow;
var connectOrigin;
var popupWindow;
var defaultEventHandlers = {
  onLoad: function onLoad() {},
  onUser: function onUser(event) {},
  onRoute: function onRoute(event) {}
};
var Connect = exports.Connect = {
  destroy: function destroy() {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    if (metaEl && metaEl.parentNode) {
      metaEl.parentNode.removeChild(metaEl);
    }
    if (!iframe && targetWindow) {
      targetWindow.close();
    }
    iframe = undefined;
    metaEl = undefined;
    window.removeEventListener('message', onMessageFn);
  },
  launch: function launch(url, eventHandlers) {
    var _this = this;
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    connectUrl = url;
    evHandlers = _objectSpread(_objectSpread({}, defaultEventHandlers), eventHandlers);
    connectOrigin = new URL(connectUrl).origin;
    if (options.popup) {
      var defaultPopupOptions = {
        toolbar: 'no',
        location: 'no',
        status: 'no',
        menubar: 'no',
        width: _constants.CONNECT_POPUP_HEIGHT,
        height: _constants.CONNECT_POPUP_WIDTH,
        top: window.self.outerHeight / 2 + window.self.screenY - _constants.CONNECT_POPUP_HEIGHT / 2,
        left: window.self.outerWidth / 2 + window.self.screenX - _constants.CONNECT_POPUP_WIDTH / 2
      };
      var popupOptions = _objectSpread(_objectSpread({}, defaultPopupOptions), options.popupOptions);
      var _popupWindow = window.open(connectUrl, 'targetWindow', "toolbar=".concat(defaultPopupOptions.toolbar, ",location=").concat(defaultPopupOptions.location, ",status=").concat(defaultPopupOptions.status, ",menubar=").concat(defaultPopupOptions.menubar, ",width=").concat(popupOptions.width, ",height=").concat(popupOptions.height, ",top=").concat(popupOptions.top, ",left=").concat(popupOptions.left));
      if (!_popupWindow) {
        evHandlers.onError({
          reason: 'error',
          code: 1403
        });
      } else {
        targetWindow = _popupWindow;
        _popupWindow.focus();
        this.initPostMessage(options);
        evHandlers.onLoad && evHandlers.onLoad();
      }
      return _popupWindow;
    } else {
      if (iframe && iframe.parentNode) {
        throw new Error('You must destroy the iframe before you can open a new one. Call "destroy()"');
      }
      if (!document.getElementById(_constants.STYLES_ID)) {
        var style = document.createElement('style');
        style.id = _constants.STYLES_ID;
        style.type = 'text/css';
        style.innerHTML = "#".concat(_constants.IFRAME_ID, " {\n          position: absolute;\n          left: 0;\n          top: 0;\n          width: 100%;\n          height: 100%;\n          z-index: 10;\n          background: rgba(0,0,0,0.8);\n        }");
        document.getElementsByTagName('head')[0].appendChild(style);
      }
      var metaArray = document.querySelectorAll('meta[name="viewport"]');
      if (metaArray.length === 0) {
        metaEl = document.createElement('meta');
        metaEl.setAttribute('name', 'viewport');
        metaEl.setAttribute('content', 'initial-scale=1');
        document.head.appendChild(metaEl);
      }
      iframe = document.createElement('iframe');
      iframe.src = connectUrl;
      iframe.setAttribute('id', _constants.IFRAME_ID);
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('scrolling', 'no');
      iframe.setAttribute('aria-label', 'Launching Modal');
      iframe.setAttribute('title', 'Launching Modal');

      // NOTE: update overlay
      if (options.overlay) {
        iframe.setAttribute('style', "background: ".concat(options.overlay, ";"));
      }
      if (options.node) {
        options.node.appendChild(iframe);
      } else {
        // NOTE: attach to selector if specified
        var parentEl = !!options.selector ? document.querySelector(options.selector) : document.body;
        if (parentEl) {
          parentEl.appendChild(iframe);
        } else {
          console.warn("Couldn't find any elements matching \"".concat(options.selector, "\", appending \"iframe\" to \"body\" instead."));
          document.body.appendChild(iframe);
        }
      }
      iframe.onload = function () {
        targetWindow = iframe.contentWindow;
        _this.initPostMessage(options);
        evHandlers.onLoad && evHandlers.onLoad();
      };
      return null;
    }
  },
  initPostMessage: function initPostMessage(options) {
    var _this2 = this;
    // NOTE: ping connect until it responds
    var intervalId = setInterval(function () {
      var data = {
        type: _constants.PING_EVENT,
        selector: options.selector,
        sdkVersion: _constants.CONNECT_SDK_VERSION,
        platform: "".concat(options.popup ? _constants.PLATFORM_POPUP : _constants.PLATFORM_IFRAME)
      };
      if (options.redirectUrl) data['redirectUrl'] = options.redirectUrl;
      _this2.postMessage(data);
    }, 1000);
    onMessageFn = function onMessageFn(event) {
      var payload = event.data.data;
      var eventType = event.data.type;
      // NOTE: make sure it's Connect and not a bad actor
      if (event.origin === connectOrigin) {
        // NOTE: actively pinging connect while it's displayed in a popup allows us to recover the
        // session if the user refreshes the popup window
        if (eventType === _constants.ACK_EVENT && !options.popup) {
          clearInterval(intervalId);
        } else if (eventType === _constants.URL_EVENT) {
          _this2.openPopupWindow(event.data.url);
        } else if (eventType === _constants.DONE_EVENT) {
          evHandlers.onDone(payload);
          _this2.destroy();
        } else if (eventType === _constants.CANCEL_EVENT) {
          evHandlers.onCancel(payload);
          _this2.destroy();
        } else if (eventType === _constants.ERROR_EVENT) {
          evHandlers.onError(payload);
          _this2.destroy();
        } else if (eventType === _constants.ROUTE_EVENT) {
          evHandlers.onRoute && evHandlers.onRoute(payload);
        } else if (eventType === _constants.USER_EVENT) {
          evHandlers.onUser && evHandlers.onUser(payload);
        } else if (eventType === _constants.CLOSE_POPUP_EVENT) {
          var _popupWindow2;
          (_popupWindow2 = popupWindow) === null || _popupWindow2 === void 0 || _popupWindow2.close();
        }
      }
    };
    window.addEventListener('message', onMessageFn);
  },
  openPopupWindow: function openPopupWindow(url) {
    var _this3 = this;
    var top = window.self.outerHeight / 2 + window.self.screenY - _constants.POPUP_HEIGHT / 2;
    var left = window.self.outerWidth / 2 + window.self.screenX - _constants.POPUP_WIDTH / 2;
    popupWindow = window.open(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=".concat(_constants.POPUP_WIDTH, ",height=").concat(_constants.POPUP_HEIGHT, ",top=").concat(top, ",left=").concat(left));
    if (popupWindow) {
      popupWindow.focus();
      var intervalId = setInterval(function () {
        var _popupWindow3;
        // clear itself if window no longer exists or has been closed
        if ((_popupWindow3 = popupWindow) !== null && _popupWindow3 !== void 0 && _popupWindow3.closed) {
          // window closed, notify connect
          clearInterval(intervalId);
          _this3.postMessage({
            type: _constants.WINDOW_EVENT,
            closed: true,
            blocked: false
          });
        }
      }, 1000);
    } else {
      this.postMessage({
        type: _constants.WINDOW_EVENT,
        closed: true,
        blocked: true
      });
    }
  },
  postMessage: function postMessage(data) {
    var _targetWindow;
    (_targetWindow = targetWindow) === null || _targetWindow === void 0 || _targetWindow.postMessage(data, connectUrl);
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfY29uc3RhbnRzIiwicmVxdWlyZSIsIl90eXBlb2YiLCJvIiwiU3ltYm9sIiwiaXRlcmF0b3IiLCJjb25zdHJ1Y3RvciIsInByb3RvdHlwZSIsIm93bktleXMiLCJlIiwiciIsInQiLCJPYmplY3QiLCJrZXlzIiwiZ2V0T3duUHJvcGVydHlTeW1ib2xzIiwiZmlsdGVyIiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIiwiZW51bWVyYWJsZSIsInB1c2giLCJhcHBseSIsIl9vYmplY3RTcHJlYWQiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJmb3JFYWNoIiwiX2RlZmluZVByb3BlcnR5IiwiZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9ycyIsImRlZmluZVByb3BlcnRpZXMiLCJkZWZpbmVQcm9wZXJ0eSIsIm9iaiIsImtleSIsInZhbHVlIiwiX3RvUHJvcGVydHlLZXkiLCJjb25maWd1cmFibGUiLCJ3cml0YWJsZSIsImkiLCJfdG9QcmltaXRpdmUiLCJTdHJpbmciLCJ0b1ByaW1pdGl2ZSIsImNhbGwiLCJUeXBlRXJyb3IiLCJOdW1iZXIiLCJldkhhbmRsZXJzIiwib25NZXNzYWdlRm4iLCJjb25uZWN0VXJsIiwiaWZyYW1lIiwibWV0YUVsIiwidGFyZ2V0V2luZG93IiwiY29ubmVjdE9yaWdpbiIsInBvcHVwV2luZG93IiwiZGVmYXVsdEV2ZW50SGFuZGxlcnMiLCJvbkxvYWQiLCJvblVzZXIiLCJldmVudCIsIm9uUm91dGUiLCJDb25uZWN0IiwiZXhwb3J0cyIsImRlc3Ryb3kiLCJwYXJlbnROb2RlIiwicmVtb3ZlQ2hpbGQiLCJjbG9zZSIsInVuZGVmaW5lZCIsIndpbmRvdyIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJsYXVuY2giLCJ1cmwiLCJldmVudEhhbmRsZXJzIiwiX3RoaXMiLCJvcHRpb25zIiwiVVJMIiwib3JpZ2luIiwicG9wdXAiLCJkZWZhdWx0UG9wdXBPcHRpb25zIiwidG9vbGJhciIsImxvY2F0aW9uIiwic3RhdHVzIiwibWVudWJhciIsIndpZHRoIiwiQ09OTkVDVF9QT1BVUF9IRUlHSFQiLCJoZWlnaHQiLCJDT05ORUNUX1BPUFVQX1dJRFRIIiwidG9wIiwic2VsZiIsIm91dGVySGVpZ2h0Iiwic2NyZWVuWSIsImxlZnQiLCJvdXRlcldpZHRoIiwic2NyZWVuWCIsInBvcHVwT3B0aW9ucyIsIm9wZW4iLCJjb25jYXQiLCJvbkVycm9yIiwicmVhc29uIiwiY29kZSIsImZvY3VzIiwiaW5pdFBvc3RNZXNzYWdlIiwiRXJyb3IiLCJkb2N1bWVudCIsImdldEVsZW1lbnRCeUlkIiwiU1RZTEVTX0lEIiwic3R5bGUiLCJjcmVhdGVFbGVtZW50IiwiaWQiLCJ0eXBlIiwiaW5uZXJIVE1MIiwiSUZSQU1FX0lEIiwiZ2V0RWxlbWVudHNCeVRhZ05hbWUiLCJhcHBlbmRDaGlsZCIsIm1ldGFBcnJheSIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJzZXRBdHRyaWJ1dGUiLCJoZWFkIiwic3JjIiwib3ZlcmxheSIsIm5vZGUiLCJwYXJlbnRFbCIsInNlbGVjdG9yIiwicXVlcnlTZWxlY3RvciIsImJvZHkiLCJjb25zb2xlIiwid2FybiIsIm9ubG9hZCIsImNvbnRlbnRXaW5kb3ciLCJfdGhpczIiLCJpbnRlcnZhbElkIiwic2V0SW50ZXJ2YWwiLCJkYXRhIiwiUElOR19FVkVOVCIsInNka1ZlcnNpb24iLCJDT05ORUNUX1NES19WRVJTSU9OIiwicGxhdGZvcm0iLCJQTEFURk9STV9QT1BVUCIsIlBMQVRGT1JNX0lGUkFNRSIsInJlZGlyZWN0VXJsIiwicG9zdE1lc3NhZ2UiLCJwYXlsb2FkIiwiZXZlbnRUeXBlIiwiQUNLX0VWRU5UIiwiY2xlYXJJbnRlcnZhbCIsIlVSTF9FVkVOVCIsIm9wZW5Qb3B1cFdpbmRvdyIsIkRPTkVfRVZFTlQiLCJvbkRvbmUiLCJDQU5DRUxfRVZFTlQiLCJvbkNhbmNlbCIsIkVSUk9SX0VWRU5UIiwiUk9VVEVfRVZFTlQiLCJVU0VSX0VWRU5UIiwiQ0xPU0VfUE9QVVBfRVZFTlQiLCJfcG9wdXBXaW5kb3cyIiwiYWRkRXZlbnRMaXN0ZW5lciIsIl90aGlzMyIsIlBPUFVQX0hFSUdIVCIsIlBPUFVQX1dJRFRIIiwiX3BvcHVwV2luZG93MyIsImNsb3NlZCIsIldJTkRPV19FVkVOVCIsImJsb2NrZWQiLCJfdGFyZ2V0V2luZG93Il0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7XG4gIElGUkFNRV9JRCxcbiAgUE9QVVBfV0lEVEgsXG4gIFBPUFVQX0hFSUdIVCxcbiAgQ09OTkVDVF9QT1BVUF9IRUlHSFQsXG4gIENPTk5FQ1RfUE9QVVBfV0lEVEgsXG4gIEFDS19FVkVOVCxcbiAgQ0FOQ0VMX0VWRU5ULFxuICBVUkxfRVZFTlQsXG4gIERPTkVfRVZFTlQsXG4gIEVSUk9SX0VWRU5ULFxuICBQSU5HX0VWRU5ULFxuICBXSU5ET1dfRVZFTlQsXG4gIFJPVVRFX0VWRU5ULFxuICBVU0VSX0VWRU5ULFxuICBTVFlMRVNfSUQsXG4gIENPTk5FQ1RfU0RLX1ZFUlNJT04sXG4gIENMT1NFX1BPUFVQX0VWRU5ULFxuICBQTEFURk9STV9QT1BVUCxcbiAgUExBVEZPUk1fSUZSQU1FLFxufSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbmxldCBldkhhbmRsZXJzOiBDb25uZWN0RXZlbnRIYW5kbGVycztcbmxldCBvbk1lc3NhZ2VGbjogYW55O1xubGV0IGNvbm5lY3RVcmw6IHN0cmluZztcbmxldCBpZnJhbWU6IGFueTtcbmxldCBtZXRhRWw6IGFueTtcbmxldCB0YXJnZXRXaW5kb3c6IFdpbmRvdztcbmxldCBjb25uZWN0T3JpZ2luOiBzdHJpbmc7XG5sZXQgcG9wdXBXaW5kb3c6IFdpbmRvdyB8IG51bGw7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdEV2ZW50SGFuZGxlcnMge1xuICBvbkRvbmU6IChldmVudDogQ29ubmVjdERvbmVFdmVudCkgPT4gdm9pZDtcbiAgb25DYW5jZWw6IChldmVudDogQ29ubmVjdENhbmNlbEV2ZW50KSA9PiB2b2lkO1xuICBvbkVycm9yOiAoZXZlbnQ6IENvbm5lY3RFcnJvckV2ZW50KSA9PiB2b2lkO1xuICBvblJvdXRlPzogKGV2ZW50OiBDb25uZWN0Um91dGVFdmVudCkgPT4gdm9pZDtcbiAgb25Vc2VyPzogKGV2ZW50OiBhbnkpID0+IHZvaWQ7XG4gIG9uTG9hZD86ICgpID0+IHZvaWQ7XG59XG5cbmNvbnN0IGRlZmF1bHRFdmVudEhhbmRsZXJzOiBhbnkgPSB7XG4gIG9uTG9hZDogKCkgPT4ge30sXG4gIG9uVXNlcjogKGV2ZW50OiBhbnkpID0+IHt9LFxuICBvblJvdXRlOiAoZXZlbnQ6IENvbm5lY3RSb3V0ZUV2ZW50KSA9PiB7fSxcbn07XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdFByb3BzIHtcbiAgY29ubmVjdFVybDogc3RyaW5nO1xuICBldmVudEhhbmRsZXJzOiBDb25uZWN0RXZlbnRIYW5kbGVycztcbiAgbGlua2luZ1VyaT86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0Q2FuY2VsRXZlbnQge1xuICBjb2RlOiBudW1iZXI7XG4gIHJlYXNvbjogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RFcnJvckV2ZW50IHtcbiAgY29kZTogbnVtYmVyO1xuICByZWFzb246IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0RG9uZUV2ZW50IHtcbiAgY29kZTogbnVtYmVyO1xuICByZWFzb246IHN0cmluZztcbiAgcmVwb3J0RGF0YTogW1xuICAgIHtcbiAgICAgIHBvcnRmb2xpb0lkOiBzdHJpbmc7XG4gICAgICB0eXBlOiBzdHJpbmc7XG4gICAgICByZXBvcnRJZDogc3RyaW5nO1xuICAgIH1cbiAgXTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0Um91dGVFdmVudCB7XG4gIHNjcmVlbjogc3RyaW5nO1xuICBwYXJhbXM6IGFueTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0T3B0aW9ucyB7XG4gIHNlbGVjdG9yPzogc3RyaW5nO1xuICBub2RlPzogTm9kZTtcbiAgb3ZlcmxheT86IHN0cmluZztcbiAgcG9wdXA/OiBib29sZWFuO1xuICBwb3B1cE9wdGlvbnM/OiBQb3B1cE9wdGlvbnM7XG4gIHJlZGlyZWN0VXJsPzogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBvcHVwT3B0aW9ucyB7XG4gIHdpZHRoPzogbnVtYmVyO1xuICBoZWlnaHQ/OiBudW1iZXI7XG4gIHRvcD86IG51bWJlcjtcbiAgbGVmdD86IG51bWJlcjtcbn1cblxuaW50ZXJmYWNlIENvbm5lY3Qge1xuICBkZXN0cm95OiAoKSA9PiB2b2lkO1xuICBsYXVuY2g6IChcbiAgICB1cmw6IHN0cmluZyxcbiAgICBldmVudEhhbmRsZXJzOiBDb25uZWN0RXZlbnRIYW5kbGVycyxcbiAgICBvcHRpb25zPzogQ29ubmVjdE9wdGlvbnNcbiAgKSA9PiBXaW5kb3cgfCBudWxsIHwgdm9pZDtcbiAgaW5pdFBvc3RNZXNzYWdlOiAob3B0aW9uczogQ29ubmVjdE9wdGlvbnMpID0+IHZvaWQ7XG4gIG9wZW5Qb3B1cFdpbmRvdzogKHVybDogc3RyaW5nKSA9PiB2b2lkO1xuICBwb3N0TWVzc2FnZTogKGV2ZW50OiBhbnkpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBjb25zdCBDb25uZWN0OiBDb25uZWN0ID0ge1xuICBkZXN0cm95KCkge1xuICAgIGlmIChpZnJhbWUgJiYgaWZyYW1lLnBhcmVudE5vZGUpIHtcbiAgICAgIGlmcmFtZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgfVxuXG4gICAgaWYgKG1ldGFFbCAmJiBtZXRhRWwucGFyZW50Tm9kZSkge1xuICAgICAgbWV0YUVsLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobWV0YUVsKTtcbiAgICB9XG5cbiAgICBpZiAoIWlmcmFtZSAmJiB0YXJnZXRXaW5kb3cpIHtcbiAgICAgIHRhcmdldFdpbmRvdy5jbG9zZSgpO1xuICAgIH1cblxuICAgIGlmcmFtZSA9IHVuZGVmaW5lZDtcbiAgICBtZXRhRWwgPSB1bmRlZmluZWQ7XG5cbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTWVzc2FnZUZuKTtcbiAgfSxcblxuICBsYXVuY2goXG4gICAgdXJsOiBzdHJpbmcsXG4gICAgZXZlbnRIYW5kbGVyczogQ29ubmVjdEV2ZW50SGFuZGxlcnMsXG4gICAgb3B0aW9uczogQ29ubmVjdE9wdGlvbnMgPSB7fVxuICApIHtcbiAgICBjb25uZWN0VXJsID0gdXJsO1xuICAgIGV2SGFuZGxlcnMgPSB7IC4uLmRlZmF1bHRFdmVudEhhbmRsZXJzLCAuLi5ldmVudEhhbmRsZXJzIH07XG4gICAgY29ubmVjdE9yaWdpbiA9IG5ldyBVUkwoY29ubmVjdFVybCkub3JpZ2luO1xuXG4gICAgaWYgKG9wdGlvbnMucG9wdXApIHtcbiAgICAgIGNvbnN0IGRlZmF1bHRQb3B1cE9wdGlvbnMgPSB7XG4gICAgICAgIHRvb2xiYXI6ICdubycsXG4gICAgICAgIGxvY2F0aW9uOiAnbm8nLFxuICAgICAgICBzdGF0dXM6ICdubycsXG4gICAgICAgIG1lbnViYXI6ICdubycsXG4gICAgICAgIHdpZHRoOiBDT05ORUNUX1BPUFVQX0hFSUdIVCxcbiAgICAgICAgaGVpZ2h0OiBDT05ORUNUX1BPUFVQX1dJRFRILFxuICAgICAgICB0b3A6XG4gICAgICAgICAgd2luZG93LnNlbGYub3V0ZXJIZWlnaHQgLyAyICtcbiAgICAgICAgICB3aW5kb3cuc2VsZi5zY3JlZW5ZIC1cbiAgICAgICAgICBDT05ORUNUX1BPUFVQX0hFSUdIVCAvIDIsXG4gICAgICAgIGxlZnQ6XG4gICAgICAgICAgd2luZG93LnNlbGYub3V0ZXJXaWR0aCAvIDIgK1xuICAgICAgICAgIHdpbmRvdy5zZWxmLnNjcmVlblggLVxuICAgICAgICAgIENPTk5FQ1RfUE9QVVBfV0lEVEggLyAyLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IHBvcHVwT3B0aW9ucyA9IHsgLi4uZGVmYXVsdFBvcHVwT3B0aW9ucywgLi4ub3B0aW9ucy5wb3B1cE9wdGlvbnMgfTtcbiAgICAgIGNvbnN0IHBvcHVwV2luZG93ID0gd2luZG93Lm9wZW4oXG4gICAgICAgIGNvbm5lY3RVcmwsXG4gICAgICAgICd0YXJnZXRXaW5kb3cnLFxuICAgICAgICBgdG9vbGJhcj0ke2RlZmF1bHRQb3B1cE9wdGlvbnMudG9vbGJhcn0sbG9jYXRpb249JHtkZWZhdWx0UG9wdXBPcHRpb25zLmxvY2F0aW9ufSxzdGF0dXM9JHtkZWZhdWx0UG9wdXBPcHRpb25zLnN0YXR1c30sbWVudWJhcj0ke2RlZmF1bHRQb3B1cE9wdGlvbnMubWVudWJhcn0sd2lkdGg9JHtwb3B1cE9wdGlvbnMud2lkdGh9LGhlaWdodD0ke3BvcHVwT3B0aW9ucy5oZWlnaHR9LHRvcD0ke3BvcHVwT3B0aW9ucy50b3B9LGxlZnQ9JHtwb3B1cE9wdGlvbnMubGVmdH1gXG4gICAgICApO1xuXG4gICAgICBpZiAoIXBvcHVwV2luZG93KSB7XG4gICAgICAgIGV2SGFuZGxlcnMub25FcnJvcih7IHJlYXNvbjogJ2Vycm9yJywgY29kZTogMTQwMyB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRhcmdldFdpbmRvdyA9IHBvcHVwV2luZG93O1xuICAgICAgICBwb3B1cFdpbmRvdy5mb2N1cygpO1xuICAgICAgICB0aGlzLmluaXRQb3N0TWVzc2FnZShvcHRpb25zKTtcbiAgICAgICAgZXZIYW5kbGVycy5vbkxvYWQgJiYgZXZIYW5kbGVycy5vbkxvYWQoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHBvcHVwV2luZG93O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaWZyYW1lICYmIGlmcmFtZS5wYXJlbnROb2RlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnWW91IG11c3QgZGVzdHJveSB0aGUgaWZyYW1lIGJlZm9yZSB5b3UgY2FuIG9wZW4gYSBuZXcgb25lLiBDYWxsIFwiZGVzdHJveSgpXCInXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGlmICghZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoU1RZTEVTX0lEKSkge1xuICAgICAgICBjb25zdCBzdHlsZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3N0eWxlJyk7XG4gICAgICAgIHN0eWxlLmlkID0gU1RZTEVTX0lEO1xuICAgICAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgICAgc3R5bGUuaW5uZXJIVE1MID0gYCMke0lGUkFNRV9JRH0ge1xuICAgICAgICAgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgICAgICAgICBsZWZ0OiAwO1xuICAgICAgICAgIHRvcDogMDtcbiAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICBoZWlnaHQ6IDEwMCU7XG4gICAgICAgICAgei1pbmRleDogMTA7XG4gICAgICAgICAgYmFja2dyb3VuZDogcmdiYSgwLDAsMCwwLjgpO1xuICAgICAgICB9YDtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXS5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBtZXRhQXJyYXkgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdtZXRhW25hbWU9XCJ2aWV3cG9ydFwiXScpO1xuICAgICAgaWYgKG1ldGFBcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgbWV0YUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbWV0YScpO1xuICAgICAgICBtZXRhRWwuc2V0QXR0cmlidXRlKCduYW1lJywgJ3ZpZXdwb3J0Jyk7XG4gICAgICAgIG1ldGFFbC5zZXRBdHRyaWJ1dGUoJ2NvbnRlbnQnLCAnaW5pdGlhbC1zY2FsZT0xJyk7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQobWV0YUVsKTtcbiAgICAgIH1cblxuICAgICAgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG5cbiAgICAgIGlmcmFtZS5zcmMgPSBjb25uZWN0VXJsO1xuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnaWQnLCBJRlJBTUVfSUQpO1xuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnZnJhbWVib3JkZXInLCAnMCcpO1xuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnc2Nyb2xsaW5nJywgJ25vJyk7XG4gICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ0xhdW5jaGluZyBNb2RhbCcpO1xuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgndGl0bGUnLCAnTGF1bmNoaW5nIE1vZGFsJyk7XG5cbiAgICAgIC8vIE5PVEU6IHVwZGF0ZSBvdmVybGF5XG4gICAgICBpZiAob3B0aW9ucy5vdmVybGF5KSB7XG4gICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3N0eWxlJywgYGJhY2tncm91bmQ6ICR7b3B0aW9ucy5vdmVybGF5fTtgKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMubm9kZSkge1xuICAgICAgICBvcHRpb25zLm5vZGUuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5PVEU6IGF0dGFjaCB0byBzZWxlY3RvciBpZiBzcGVjaWZpZWRcbiAgICAgICAgY29uc3QgcGFyZW50RWwgPSAhIW9wdGlvbnMuc2VsZWN0b3JcbiAgICAgICAgICA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Iob3B0aW9ucy5zZWxlY3RvcilcbiAgICAgICAgICA6IGRvY3VtZW50LmJvZHk7XG4gICAgICAgIGlmIChwYXJlbnRFbCkge1xuICAgICAgICAgIHBhcmVudEVsLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgYENvdWxkbid0IGZpbmQgYW55IGVsZW1lbnRzIG1hdGNoaW5nIFwiJHtvcHRpb25zLnNlbGVjdG9yfVwiLCBhcHBlbmRpbmcgXCJpZnJhbWVcIiB0byBcImJvZHlcIiBpbnN0ZWFkLmBcbiAgICAgICAgICApO1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZnJhbWUub25sb2FkID0gKCkgPT4ge1xuICAgICAgICB0YXJnZXRXaW5kb3cgPSBpZnJhbWUuY29udGVudFdpbmRvdztcbiAgICAgICAgdGhpcy5pbml0UG9zdE1lc3NhZ2Uob3B0aW9ucyk7XG4gICAgICAgIGV2SGFuZGxlcnMub25Mb2FkICYmIGV2SGFuZGxlcnMub25Mb2FkKCk7XG4gICAgICB9O1xuXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH0sXG5cbiAgaW5pdFBvc3RNZXNzYWdlKG9wdGlvbnM6IENvbm5lY3RPcHRpb25zKSB7XG4gICAgLy8gTk9URTogcGluZyBjb25uZWN0IHVudGlsIGl0IHJlc3BvbmRzXG4gICAgY29uc3QgaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICAgIHR5cGU6IFBJTkdfRVZFTlQsXG4gICAgICAgIHNlbGVjdG9yOiBvcHRpb25zLnNlbGVjdG9yLFxuICAgICAgICBzZGtWZXJzaW9uOiBDT05ORUNUX1NES19WRVJTSU9OLFxuICAgICAgICBwbGF0Zm9ybTogYCR7b3B0aW9ucy5wb3B1cCA/IFBMQVRGT1JNX1BPUFVQIDogUExBVEZPUk1fSUZSQU1FfWAsXG4gICAgICB9O1xuICAgICAgaWYgKG9wdGlvbnMucmVkaXJlY3RVcmwpIGRhdGFbJ3JlZGlyZWN0VXJsJ10gPSBvcHRpb25zLnJlZGlyZWN0VXJsO1xuXG4gICAgICB0aGlzLnBvc3RNZXNzYWdlKGRhdGEpO1xuICAgIH0sIDEwMDApO1xuXG4gICAgb25NZXNzYWdlRm4gPSAoZXZlbnQ6IGFueSkgPT4ge1xuICAgICAgY29uc3QgcGF5bG9hZCA9IGV2ZW50LmRhdGEuZGF0YTtcbiAgICAgIGNvbnN0IGV2ZW50VHlwZSA9IGV2ZW50LmRhdGEudHlwZTtcbiAgICAgIC8vIE5PVEU6IG1ha2Ugc3VyZSBpdCdzIENvbm5lY3QgYW5kIG5vdCBhIGJhZCBhY3RvclxuICAgICAgaWYgKGV2ZW50Lm9yaWdpbiA9PT0gY29ubmVjdE9yaWdpbikge1xuICAgICAgICAvLyBOT1RFOiBhY3RpdmVseSBwaW5naW5nIGNvbm5lY3Qgd2hpbGUgaXQncyBkaXNwbGF5ZWQgaW4gYSBwb3B1cCBhbGxvd3MgdXMgdG8gcmVjb3ZlciB0aGVcbiAgICAgICAgLy8gc2Vzc2lvbiBpZiB0aGUgdXNlciByZWZyZXNoZXMgdGhlIHBvcHVwIHdpbmRvd1xuICAgICAgICBpZiAoZXZlbnRUeXBlID09PSBBQ0tfRVZFTlQgJiYgIW9wdGlvbnMucG9wdXApIHtcbiAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsSWQpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gVVJMX0VWRU5UKSB7XG4gICAgICAgICAgdGhpcy5vcGVuUG9wdXBXaW5kb3coZXZlbnQuZGF0YS51cmwpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gRE9ORV9FVkVOVCkge1xuICAgICAgICAgIGV2SGFuZGxlcnMub25Eb25lKHBheWxvYWQpO1xuICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gQ0FOQ0VMX0VWRU5UKSB7XG4gICAgICAgICAgZXZIYW5kbGVycy5vbkNhbmNlbChwYXlsb2FkKTtcbiAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IEVSUk9SX0VWRU5UKSB7XG4gICAgICAgICAgZXZIYW5kbGVycy5vbkVycm9yKHBheWxvYWQpO1xuICAgICAgICAgIHRoaXMuZGVzdHJveSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gUk9VVEVfRVZFTlQpIHtcbiAgICAgICAgICBldkhhbmRsZXJzLm9uUm91dGUgJiYgZXZIYW5kbGVycy5vblJvdXRlKHBheWxvYWQpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gVVNFUl9FVkVOVCkge1xuICAgICAgICAgIGV2SGFuZGxlcnMub25Vc2VyICYmIGV2SGFuZGxlcnMub25Vc2VyKHBheWxvYWQpO1xuICAgICAgICB9IGVsc2UgaWYgKGV2ZW50VHlwZSA9PT0gQ0xPU0VfUE9QVVBfRVZFTlQpIHtcbiAgICAgICAgICBwb3B1cFdpbmRvdz8uY2xvc2UoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uTWVzc2FnZUZuKTtcbiAgfSxcblxuICBvcGVuUG9wdXBXaW5kb3codXJsOiBzdHJpbmcpIHtcbiAgICBjb25zdCB0b3AgPVxuICAgICAgd2luZG93LnNlbGYub3V0ZXJIZWlnaHQgLyAyICsgd2luZG93LnNlbGYuc2NyZWVuWSAtIFBPUFVQX0hFSUdIVCAvIDI7XG4gICAgY29uc3QgbGVmdCA9XG4gICAgICB3aW5kb3cuc2VsZi5vdXRlcldpZHRoIC8gMiArIHdpbmRvdy5zZWxmLnNjcmVlblggLSBQT1BVUF9XSURUSCAvIDI7XG4gICAgcG9wdXBXaW5kb3cgPSB3aW5kb3cub3BlbihcbiAgICAgIHVybCxcbiAgICAgICd0YXJnZXRXaW5kb3cnLFxuICAgICAgYHRvb2xiYXI9bm8sbG9jYXRpb249bm8sc3RhdHVzPW5vLG1lbnViYXI9bm8sd2lkdGg9JHtQT1BVUF9XSURUSH0saGVpZ2h0PSR7UE9QVVBfSEVJR0hUfSx0b3A9JHt0b3B9LGxlZnQ9JHtsZWZ0fWBcbiAgICApO1xuXG4gICAgaWYgKHBvcHVwV2luZG93KSB7XG4gICAgICBwb3B1cFdpbmRvdy5mb2N1cygpO1xuICAgICAgY29uc3QgaW50ZXJ2YWxJZCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICAgICAgLy8gY2xlYXIgaXRzZWxmIGlmIHdpbmRvdyBubyBsb25nZXIgZXhpc3RzIG9yIGhhcyBiZWVuIGNsb3NlZFxuICAgICAgICBpZiAocG9wdXBXaW5kb3c/LmNsb3NlZCkge1xuICAgICAgICAgIC8vIHdpbmRvdyBjbG9zZWQsIG5vdGlmeSBjb25uZWN0XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcbiAgICAgICAgICB0aGlzLnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgIHR5cGU6IFdJTkRPV19FVkVOVCxcbiAgICAgICAgICAgIGNsb3NlZDogdHJ1ZSxcbiAgICAgICAgICAgIGJsb2NrZWQ6IGZhbHNlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9LCAxMDAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wb3N0TWVzc2FnZSh7XG4gICAgICAgIHR5cGU6IFdJTkRPV19FVkVOVCxcbiAgICAgICAgY2xvc2VkOiB0cnVlLFxuICAgICAgICBibG9ja2VkOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHBvc3RNZXNzYWdlKGRhdGE6IGFueSkge1xuICAgIHRhcmdldFdpbmRvdz8ucG9zdE1lc3NhZ2UoZGF0YSwgY29ubmVjdFVybCk7XG4gIH0sXG59O1xuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7QUFBQSxJQUFBQSxVQUFBLEdBQUFDLE9BQUE7QUFvQnFCLFNBQUFDLFFBQUFDLENBQUEsc0NBQUFELE9BQUEsd0JBQUFFLE1BQUEsdUJBQUFBLE1BQUEsQ0FBQUMsUUFBQSxhQUFBRixDQUFBLGtCQUFBQSxDQUFBLGdCQUFBQSxDQUFBLFdBQUFBLENBQUEseUJBQUFDLE1BQUEsSUFBQUQsQ0FBQSxDQUFBRyxXQUFBLEtBQUFGLE1BQUEsSUFBQUQsQ0FBQSxLQUFBQyxNQUFBLENBQUFHLFNBQUEscUJBQUFKLENBQUEsS0FBQUQsT0FBQSxDQUFBQyxDQUFBO0FBQUEsU0FBQUssUUFBQUMsQ0FBQSxFQUFBQyxDQUFBLFFBQUFDLENBQUEsR0FBQUMsTUFBQSxDQUFBQyxJQUFBLENBQUFKLENBQUEsT0FBQUcsTUFBQSxDQUFBRSxxQkFBQSxRQUFBWCxDQUFBLEdBQUFTLE1BQUEsQ0FBQUUscUJBQUEsQ0FBQUwsQ0FBQSxHQUFBQyxDQUFBLEtBQUFQLENBQUEsR0FBQUEsQ0FBQSxDQUFBWSxNQUFBLFdBQUFMLENBQUEsV0FBQUUsTUFBQSxDQUFBSSx3QkFBQSxDQUFBUCxDQUFBLEVBQUFDLENBQUEsRUFBQU8sVUFBQSxPQUFBTixDQUFBLENBQUFPLElBQUEsQ0FBQUMsS0FBQSxDQUFBUixDQUFBLEVBQUFSLENBQUEsWUFBQVEsQ0FBQTtBQUFBLFNBQUFTLGNBQUFYLENBQUEsYUFBQUMsQ0FBQSxNQUFBQSxDQUFBLEdBQUFXLFNBQUEsQ0FBQUMsTUFBQSxFQUFBWixDQUFBLFVBQUFDLENBQUEsV0FBQVUsU0FBQSxDQUFBWCxDQUFBLElBQUFXLFNBQUEsQ0FBQVgsQ0FBQSxRQUFBQSxDQUFBLE9BQUFGLE9BQUEsQ0FBQUksTUFBQSxDQUFBRCxDQUFBLE9BQUFZLE9BQUEsV0FBQWIsQ0FBQSxJQUFBYyxlQUFBLENBQUFmLENBQUEsRUFBQUMsQ0FBQSxFQUFBQyxDQUFBLENBQUFELENBQUEsU0FBQUUsTUFBQSxDQUFBYSx5QkFBQSxHQUFBYixNQUFBLENBQUFjLGdCQUFBLENBQUFqQixDQUFBLEVBQUFHLE1BQUEsQ0FBQWEseUJBQUEsQ0FBQWQsQ0FBQSxLQUFBSCxPQUFBLENBQUFJLE1BQUEsQ0FBQUQsQ0FBQSxHQUFBWSxPQUFBLFdBQUFiLENBQUEsSUFBQUUsTUFBQSxDQUFBZSxjQUFBLENBQUFsQixDQUFBLEVBQUFDLENBQUEsRUFBQUUsTUFBQSxDQUFBSSx3QkFBQSxDQUFBTCxDQUFBLEVBQUFELENBQUEsaUJBQUFELENBQUE7QUFBQSxTQUFBZSxnQkFBQUksR0FBQSxFQUFBQyxHQUFBLEVBQUFDLEtBQUEsSUFBQUQsR0FBQSxHQUFBRSxjQUFBLENBQUFGLEdBQUEsT0FBQUEsR0FBQSxJQUFBRCxHQUFBLElBQUFoQixNQUFBLENBQUFlLGNBQUEsQ0FBQUMsR0FBQSxFQUFBQyxHQUFBLElBQUFDLEtBQUEsRUFBQUEsS0FBQSxFQUFBYixVQUFBLFFBQUFlLFlBQUEsUUFBQUMsUUFBQSxvQkFBQUwsR0FBQSxDQUFBQyxHQUFBLElBQUFDLEtBQUEsV0FBQUYsR0FBQTtBQUFBLFNBQUFHLGVBQUFwQixDQUFBLFFBQUF1QixDQUFBLEdBQUFDLFlBQUEsQ0FBQXhCLENBQUEsZ0NBQUFULE9BQUEsQ0FBQWdDLENBQUEsSUFBQUEsQ0FBQSxHQUFBRSxNQUFBLENBQUFGLENBQUE7QUFBQSxTQUFBQyxhQUFBeEIsQ0FBQSxFQUFBRCxDQUFBLG9CQUFBUixPQUFBLENBQUFTLENBQUEsTUFBQUEsQ0FBQSxTQUFBQSxDQUFBLE1BQUFGLENBQUEsR0FBQUUsQ0FBQSxDQUFBUCxNQUFBLENBQUFpQyxXQUFBLGtCQUFBNUIsQ0FBQSxRQUFBeUIsQ0FBQSxHQUFBekIsQ0FBQSxDQUFBNkIsSUFBQSxDQUFBM0IsQ0FBQSxFQUFBRCxDQUFBLGdDQUFBUixPQUFBLENBQUFnQyxDQUFBLFVBQUFBLENBQUEsWUFBQUssU0FBQSx5RUFBQTdCLENBQUEsR0FBQTBCLE1BQUEsR0FBQUksTUFBQSxFQUFBN0IsQ0FBQTtBQUVyQixJQUFJOEIsVUFBZ0M7QUFDcEMsSUFBSUMsV0FBZ0I7QUFDcEIsSUFBSUMsVUFBa0I7QUFDdEIsSUFBSUMsTUFBVztBQUNmLElBQUlDLE1BQVc7QUFDZixJQUFJQyxZQUFvQjtBQUN4QixJQUFJQyxhQUFxQjtBQUN6QixJQUFJQyxXQUEwQjtBQVc5QixJQUFNQyxvQkFBeUIsR0FBRztFQUNoQ0MsTUFBTSxFQUFFLFNBQUFBLE9BQUEsRUFBTSxDQUFDLENBQUM7RUFDaEJDLE1BQU0sRUFBRSxTQUFBQSxPQUFDQyxLQUFVLEVBQUssQ0FBQyxDQUFDO0VBQzFCQyxPQUFPLEVBQUUsU0FBQUEsUUFBQ0QsS0FBd0IsRUFBSyxDQUFDO0FBQzFDLENBQUM7QUErRE0sSUFBTUUsT0FBZ0IsR0FBQUMsT0FBQSxDQUFBRCxPQUFBLEdBQUc7RUFDOUJFLE9BQU8sV0FBQUEsUUFBQSxFQUFHO0lBQ1IsSUFBSVosTUFBTSxJQUFJQSxNQUFNLENBQUNhLFVBQVUsRUFBRTtNQUMvQmIsTUFBTSxDQUFDYSxVQUFVLENBQUNDLFdBQVcsQ0FBQ2QsTUFBTSxDQUFDO0lBQ3ZDO0lBRUEsSUFBSUMsTUFBTSxJQUFJQSxNQUFNLENBQUNZLFVBQVUsRUFBRTtNQUMvQlosTUFBTSxDQUFDWSxVQUFVLENBQUNDLFdBQVcsQ0FBQ2IsTUFBTSxDQUFDO0lBQ3ZDO0lBRUEsSUFBSSxDQUFDRCxNQUFNLElBQUlFLFlBQVksRUFBRTtNQUMzQkEsWUFBWSxDQUFDYSxLQUFLLENBQUMsQ0FBQztJQUN0QjtJQUVBZixNQUFNLEdBQUdnQixTQUFTO0lBQ2xCZixNQUFNLEdBQUdlLFNBQVM7SUFFbEJDLE1BQU0sQ0FBQ0MsbUJBQW1CLENBQUMsU0FBUyxFQUFFcEIsV0FBVyxDQUFDO0VBQ3BELENBQUM7RUFFRHFCLE1BQU0sV0FBQUEsT0FDSkMsR0FBVyxFQUNYQyxhQUFtQyxFQUVuQztJQUFBLElBQUFDLEtBQUE7SUFBQSxJQURBQyxPQUF1QixHQUFBOUMsU0FBQSxDQUFBQyxNQUFBLFFBQUFELFNBQUEsUUFBQXVDLFNBQUEsR0FBQXZDLFNBQUEsTUFBRyxDQUFDLENBQUM7SUFFNUJzQixVQUFVLEdBQUdxQixHQUFHO0lBQ2hCdkIsVUFBVSxHQUFBckIsYUFBQSxDQUFBQSxhQUFBLEtBQVE2QixvQkFBb0IsR0FBS2dCLGFBQWEsQ0FBRTtJQUMxRGxCLGFBQWEsR0FBRyxJQUFJcUIsR0FBRyxDQUFDekIsVUFBVSxDQUFDLENBQUMwQixNQUFNO0lBRTFDLElBQUlGLE9BQU8sQ0FBQ0csS0FBSyxFQUFFO01BQ2pCLElBQU1DLG1CQUFtQixHQUFHO1FBQzFCQyxPQUFPLEVBQUUsSUFBSTtRQUNiQyxRQUFRLEVBQUUsSUFBSTtRQUNkQyxNQUFNLEVBQUUsSUFBSTtRQUNaQyxPQUFPLEVBQUUsSUFBSTtRQUNiQyxLQUFLLEVBQUVDLCtCQUFvQjtRQUMzQkMsTUFBTSxFQUFFQyw4QkFBbUI7UUFDM0JDLEdBQUcsRUFDRG5CLE1BQU0sQ0FBQ29CLElBQUksQ0FBQ0MsV0FBVyxHQUFHLENBQUMsR0FDM0JyQixNQUFNLENBQUNvQixJQUFJLENBQUNFLE9BQU8sR0FDbkJOLCtCQUFvQixHQUFHLENBQUM7UUFDMUJPLElBQUksRUFDRnZCLE1BQU0sQ0FBQ29CLElBQUksQ0FBQ0ksVUFBVSxHQUFHLENBQUMsR0FDMUJ4QixNQUFNLENBQUNvQixJQUFJLENBQUNLLE9BQU8sR0FDbkJQLDhCQUFtQixHQUFHO01BQzFCLENBQUM7TUFDRCxJQUFNUSxZQUFZLEdBQUFuRSxhQUFBLENBQUFBLGFBQUEsS0FBUW1ELG1CQUFtQixHQUFLSixPQUFPLENBQUNvQixZQUFZLENBQUU7TUFDeEUsSUFBTXZDLFlBQVcsR0FBR2EsTUFBTSxDQUFDMkIsSUFBSSxDQUM3QjdDLFVBQVUsRUFDVixjQUFjLGFBQUE4QyxNQUFBLENBQ0hsQixtQkFBbUIsQ0FBQ0MsT0FBTyxnQkFBQWlCLE1BQUEsQ0FBYWxCLG1CQUFtQixDQUFDRSxRQUFRLGNBQUFnQixNQUFBLENBQVdsQixtQkFBbUIsQ0FBQ0csTUFBTSxlQUFBZSxNQUFBLENBQVlsQixtQkFBbUIsQ0FBQ0ksT0FBTyxhQUFBYyxNQUFBLENBQVVGLFlBQVksQ0FBQ1gsS0FBSyxjQUFBYSxNQUFBLENBQVdGLFlBQVksQ0FBQ1QsTUFBTSxXQUFBVyxNQUFBLENBQVFGLFlBQVksQ0FBQ1AsR0FBRyxZQUFBUyxNQUFBLENBQVNGLFlBQVksQ0FBQ0gsSUFBSSxDQUN6USxDQUFDO01BRUQsSUFBSSxDQUFDcEMsWUFBVyxFQUFFO1FBQ2hCUCxVQUFVLENBQUNpRCxPQUFPLENBQUM7VUFBRUMsTUFBTSxFQUFFLE9BQU87VUFBRUMsSUFBSSxFQUFFO1FBQUssQ0FBQyxDQUFDO01BQ3JELENBQUMsTUFBTTtRQUNMOUMsWUFBWSxHQUFHRSxZQUFXO1FBQzFCQSxZQUFXLENBQUM2QyxLQUFLLENBQUMsQ0FBQztRQUNuQixJQUFJLENBQUNDLGVBQWUsQ0FBQzNCLE9BQU8sQ0FBQztRQUM3QjFCLFVBQVUsQ0FBQ1MsTUFBTSxJQUFJVCxVQUFVLENBQUNTLE1BQU0sQ0FBQyxDQUFDO01BQzFDO01BRUEsT0FBT0YsWUFBVztJQUNwQixDQUFDLE1BQU07TUFDTCxJQUFJSixNQUFNLElBQUlBLE1BQU0sQ0FBQ2EsVUFBVSxFQUFFO1FBQy9CLE1BQU0sSUFBSXNDLEtBQUssQ0FDYiw2RUFDRixDQUFDO01BQ0g7TUFFQSxJQUFJLENBQUNDLFFBQVEsQ0FBQ0MsY0FBYyxDQUFDQyxvQkFBUyxDQUFDLEVBQUU7UUFDdkMsSUFBTUMsS0FBSyxHQUFHSCxRQUFRLENBQUNJLGFBQWEsQ0FBQyxPQUFPLENBQUM7UUFDN0NELEtBQUssQ0FBQ0UsRUFBRSxHQUFHSCxvQkFBUztRQUNwQkMsS0FBSyxDQUFDRyxJQUFJLEdBQUcsVUFBVTtRQUN2QkgsS0FBSyxDQUFDSSxTQUFTLE9BQUFkLE1BQUEsQ0FBT2Usb0JBQVMseU1BUTdCO1FBQ0ZSLFFBQVEsQ0FBQ1Msb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUNDLFdBQVcsQ0FBQ1AsS0FBSyxDQUFDO01BQzdEO01BRUEsSUFBSVEsU0FBUyxHQUFHWCxRQUFRLENBQUNZLGdCQUFnQixDQUFDLHVCQUF1QixDQUFDO01BQ2xFLElBQUlELFNBQVMsQ0FBQ3JGLE1BQU0sS0FBSyxDQUFDLEVBQUU7UUFDMUJ1QixNQUFNLEdBQUdtRCxRQUFRLENBQUNJLGFBQWEsQ0FBQyxNQUFNLENBQUM7UUFDdkN2RCxNQUFNLENBQUNnRSxZQUFZLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQztRQUN2Q2hFLE1BQU0sQ0FBQ2dFLFlBQVksQ0FBQyxTQUFTLEVBQUUsaUJBQWlCLENBQUM7UUFDakRiLFFBQVEsQ0FBQ2MsSUFBSSxDQUFDSixXQUFXLENBQUM3RCxNQUFNLENBQUM7TUFDbkM7TUFFQUQsTUFBTSxHQUFHb0QsUUFBUSxDQUFDSSxhQUFhLENBQUMsUUFBUSxDQUFDO01BRXpDeEQsTUFBTSxDQUFDbUUsR0FBRyxHQUFHcEUsVUFBVTtNQUN2QkMsTUFBTSxDQUFDaUUsWUFBWSxDQUFDLElBQUksRUFBRUwsb0JBQVMsQ0FBQztNQUNwQzVELE1BQU0sQ0FBQ2lFLFlBQVksQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDO01BQ3ZDakUsTUFBTSxDQUFDaUUsWUFBWSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUM7TUFDdENqRSxNQUFNLENBQUNpRSxZQUFZLENBQUMsWUFBWSxFQUFFLGlCQUFpQixDQUFDO01BQ3BEakUsTUFBTSxDQUFDaUUsWUFBWSxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQzs7TUFFL0M7TUFDQSxJQUFJMUMsT0FBTyxDQUFDNkMsT0FBTyxFQUFFO1FBQ25CcEUsTUFBTSxDQUFDaUUsWUFBWSxDQUFDLE9BQU8saUJBQUFwQixNQUFBLENBQWlCdEIsT0FBTyxDQUFDNkMsT0FBTyxNQUFHLENBQUM7TUFDakU7TUFFQSxJQUFJN0MsT0FBTyxDQUFDOEMsSUFBSSxFQUFFO1FBQ2hCOUMsT0FBTyxDQUFDOEMsSUFBSSxDQUFDUCxXQUFXLENBQUM5RCxNQUFNLENBQUM7TUFDbEMsQ0FBQyxNQUFNO1FBQ0w7UUFDQSxJQUFNc0UsUUFBUSxHQUFHLENBQUMsQ0FBQy9DLE9BQU8sQ0FBQ2dELFFBQVEsR0FDL0JuQixRQUFRLENBQUNvQixhQUFhLENBQUNqRCxPQUFPLENBQUNnRCxRQUFRLENBQUMsR0FDeENuQixRQUFRLENBQUNxQixJQUFJO1FBQ2pCLElBQUlILFFBQVEsRUFBRTtVQUNaQSxRQUFRLENBQUNSLFdBQVcsQ0FBQzlELE1BQU0sQ0FBQztRQUM5QixDQUFDLE1BQU07VUFDTDBFLE9BQU8sQ0FBQ0MsSUFBSSwwQ0FBQTlCLE1BQUEsQ0FDOEJ0QixPQUFPLENBQUNnRCxRQUFRLGtEQUMxRCxDQUFDO1VBQ0RuQixRQUFRLENBQUNxQixJQUFJLENBQUNYLFdBQVcsQ0FBQzlELE1BQU0sQ0FBQztRQUNuQztNQUNGO01BRUFBLE1BQU0sQ0FBQzRFLE1BQU0sR0FBRyxZQUFNO1FBQ3BCMUUsWUFBWSxHQUFHRixNQUFNLENBQUM2RSxhQUFhO1FBQ25DdkQsS0FBSSxDQUFDNEIsZUFBZSxDQUFDM0IsT0FBTyxDQUFDO1FBQzdCMUIsVUFBVSxDQUFDUyxNQUFNLElBQUlULFVBQVUsQ0FBQ1MsTUFBTSxDQUFDLENBQUM7TUFDMUMsQ0FBQztNQUVELE9BQU8sSUFBSTtJQUNiO0VBQ0YsQ0FBQztFQUVENEMsZUFBZSxXQUFBQSxnQkFBQzNCLE9BQXVCLEVBQUU7SUFBQSxJQUFBdUQsTUFBQTtJQUN2QztJQUNBLElBQU1DLFVBQVUsR0FBR0MsV0FBVyxDQUFDLFlBQU07TUFDbkMsSUFBTUMsSUFBSSxHQUFHO1FBQ1h2QixJQUFJLEVBQUV3QixxQkFBVTtRQUNoQlgsUUFBUSxFQUFFaEQsT0FBTyxDQUFDZ0QsUUFBUTtRQUMxQlksVUFBVSxFQUFFQyw4QkFBbUI7UUFDL0JDLFFBQVEsS0FBQXhDLE1BQUEsQ0FBS3RCLE9BQU8sQ0FBQ0csS0FBSyxHQUFHNEQseUJBQWMsR0FBR0MsMEJBQWU7TUFDL0QsQ0FBQztNQUNELElBQUloRSxPQUFPLENBQUNpRSxXQUFXLEVBQUVQLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRzFELE9BQU8sQ0FBQ2lFLFdBQVc7TUFFbEVWLE1BQUksQ0FBQ1csV0FBVyxDQUFDUixJQUFJLENBQUM7SUFDeEIsQ0FBQyxFQUFFLElBQUksQ0FBQztJQUVSbkYsV0FBVyxHQUFHLFNBQUFBLFlBQUNVLEtBQVUsRUFBSztNQUM1QixJQUFNa0YsT0FBTyxHQUFHbEYsS0FBSyxDQUFDeUUsSUFBSSxDQUFDQSxJQUFJO01BQy9CLElBQU1VLFNBQVMsR0FBR25GLEtBQUssQ0FBQ3lFLElBQUksQ0FBQ3ZCLElBQUk7TUFDakM7TUFDQSxJQUFJbEQsS0FBSyxDQUFDaUIsTUFBTSxLQUFLdEIsYUFBYSxFQUFFO1FBQ2xDO1FBQ0E7UUFDQSxJQUFJd0YsU0FBUyxLQUFLQyxvQkFBUyxJQUFJLENBQUNyRSxPQUFPLENBQUNHLEtBQUssRUFBRTtVQUM3Q21FLGFBQWEsQ0FBQ2QsVUFBVSxDQUFDO1FBQzNCLENBQUMsTUFBTSxJQUFJWSxTQUFTLEtBQUtHLG9CQUFTLEVBQUU7VUFDbENoQixNQUFJLENBQUNpQixlQUFlLENBQUN2RixLQUFLLENBQUN5RSxJQUFJLENBQUM3RCxHQUFHLENBQUM7UUFDdEMsQ0FBQyxNQUFNLElBQUl1RSxTQUFTLEtBQUtLLHFCQUFVLEVBQUU7VUFDbkNuRyxVQUFVLENBQUNvRyxNQUFNLENBQUNQLE9BQU8sQ0FBQztVQUMxQlosTUFBSSxDQUFDbEUsT0FBTyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxNQUFNLElBQUkrRSxTQUFTLEtBQUtPLHVCQUFZLEVBQUU7VUFDckNyRyxVQUFVLENBQUNzRyxRQUFRLENBQUNULE9BQU8sQ0FBQztVQUM1QlosTUFBSSxDQUFDbEUsT0FBTyxDQUFDLENBQUM7UUFDaEIsQ0FBQyxNQUFNLElBQUkrRSxTQUFTLEtBQUtTLHNCQUFXLEVBQUU7VUFDcEN2RyxVQUFVLENBQUNpRCxPQUFPLENBQUM0QyxPQUFPLENBQUM7VUFDM0JaLE1BQUksQ0FBQ2xFLE9BQU8sQ0FBQyxDQUFDO1FBQ2hCLENBQUMsTUFBTSxJQUFJK0UsU0FBUyxLQUFLVSxzQkFBVyxFQUFFO1VBQ3BDeEcsVUFBVSxDQUFDWSxPQUFPLElBQUlaLFVBQVUsQ0FBQ1ksT0FBTyxDQUFDaUYsT0FBTyxDQUFDO1FBQ25ELENBQUMsTUFBTSxJQUFJQyxTQUFTLEtBQUtXLHFCQUFVLEVBQUU7VUFDbkN6RyxVQUFVLENBQUNVLE1BQU0sSUFBSVYsVUFBVSxDQUFDVSxNQUFNLENBQUNtRixPQUFPLENBQUM7UUFDakQsQ0FBQyxNQUFNLElBQUlDLFNBQVMsS0FBS1ksNEJBQWlCLEVBQUU7VUFBQSxJQUFBQyxhQUFBO1VBQzFDLENBQUFBLGFBQUEsR0FBQXBHLFdBQVcsY0FBQW9HLGFBQUEsZUFBWEEsYUFBQSxDQUFhekYsS0FBSyxDQUFDLENBQUM7UUFDdEI7TUFDRjtJQUNGLENBQUM7SUFFREUsTUFBTSxDQUFDd0YsZ0JBQWdCLENBQUMsU0FBUyxFQUFFM0csV0FBVyxDQUFDO0VBQ2pELENBQUM7RUFFRGlHLGVBQWUsV0FBQUEsZ0JBQUMzRSxHQUFXLEVBQUU7SUFBQSxJQUFBc0YsTUFBQTtJQUMzQixJQUFNdEUsR0FBRyxHQUNQbkIsTUFBTSxDQUFDb0IsSUFBSSxDQUFDQyxXQUFXLEdBQUcsQ0FBQyxHQUFHckIsTUFBTSxDQUFDb0IsSUFBSSxDQUFDRSxPQUFPLEdBQUdvRSx1QkFBWSxHQUFHLENBQUM7SUFDdEUsSUFBTW5FLElBQUksR0FDUnZCLE1BQU0sQ0FBQ29CLElBQUksQ0FBQ0ksVUFBVSxHQUFHLENBQUMsR0FBR3hCLE1BQU0sQ0FBQ29CLElBQUksQ0FBQ0ssT0FBTyxHQUFHa0Usc0JBQVcsR0FBRyxDQUFDO0lBQ3BFeEcsV0FBVyxHQUFHYSxNQUFNLENBQUMyQixJQUFJLENBQ3ZCeEIsR0FBRyxFQUNILGNBQWMsdURBQUF5QixNQUFBLENBQ3VDK0Qsc0JBQVcsY0FBQS9ELE1BQUEsQ0FBVzhELHVCQUFZLFdBQUE5RCxNQUFBLENBQVFULEdBQUcsWUFBQVMsTUFBQSxDQUFTTCxJQUFJLENBQ2pILENBQUM7SUFFRCxJQUFJcEMsV0FBVyxFQUFFO01BQ2ZBLFdBQVcsQ0FBQzZDLEtBQUssQ0FBQyxDQUFDO01BQ25CLElBQU04QixVQUFVLEdBQUdDLFdBQVcsQ0FBQyxZQUFNO1FBQUEsSUFBQTZCLGFBQUE7UUFDbkM7UUFDQSxLQUFBQSxhQUFBLEdBQUl6RyxXQUFXLGNBQUF5RyxhQUFBLGVBQVhBLGFBQUEsQ0FBYUMsTUFBTSxFQUFFO1VBQ3ZCO1VBQ0FqQixhQUFhLENBQUNkLFVBQVUsQ0FBQztVQUN6QjJCLE1BQUksQ0FBQ2pCLFdBQVcsQ0FBQztZQUNmL0IsSUFBSSxFQUFFcUQsdUJBQVk7WUFDbEJELE1BQU0sRUFBRSxJQUFJO1lBQ1pFLE9BQU8sRUFBRTtVQUNYLENBQUMsQ0FBQztRQUNKO01BQ0YsQ0FBQyxFQUFFLElBQUksQ0FBQztJQUNWLENBQUMsTUFBTTtNQUNMLElBQUksQ0FBQ3ZCLFdBQVcsQ0FBQztRQUNmL0IsSUFBSSxFQUFFcUQsdUJBQVk7UUFDbEJELE1BQU0sRUFBRSxJQUFJO1FBQ1pFLE9BQU8sRUFBRTtNQUNYLENBQUMsQ0FBQztJQUNKO0VBQ0YsQ0FBQztFQUVEdkIsV0FBVyxXQUFBQSxZQUFDUixJQUFTLEVBQUU7SUFBQSxJQUFBZ0MsYUFBQTtJQUNyQixDQUFBQSxhQUFBLEdBQUEvRyxZQUFZLGNBQUErRyxhQUFBLGVBQVpBLGFBQUEsQ0FBY3hCLFdBQVcsQ0FBQ1IsSUFBSSxFQUFFbEYsVUFBVSxDQUFDO0VBQzdDO0FBQ0YsQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==