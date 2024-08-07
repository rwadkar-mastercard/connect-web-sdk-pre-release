"use strict";

var _index = require("./index");
var _constants = require("./constants");
var defaultPopupOptions = {
  width: _constants.CONNECT_POPUP_HEIGHT,
  height: _constants.CONNECT_POPUP_WIDTH,
  top: window.top.outerHeight / 2 + window.top.screenY - _constants.CONNECT_POPUP_HEIGHT / 2,
  left: window.top.outerWidth / 2 + window.top.screenX - _constants.CONNECT_POPUP_WIDTH / 2
};
var url = 'http://test.com';
describe('Connect', function () {
  var mockWindow;
  beforeEach(function () {
    mockWindow = {
      close: jest.fn(),
      focus: jest.fn(),
      closed: false,
      postMessage: jest.fn()
    };
    jest.useFakeTimers();
  });
  afterEach(function () {
    jest.resetAllMocks();
    _index.Connect.destroy();
  });
  test('should apply iframe styles', function () {
    _index.Connect.launch(url, {
      onDone: function onDone() {},
      onError: function onError() {},
      onCancel: function onCancel() {}
    });
    var styles = document.getElementById(_constants.STYLES_ID);
    expect(styles.id).toBe(_constants.STYLES_ID);
    expect(styles.innerHTML).toBe("#".concat(_constants.IFRAME_ID, " {\n          position: absolute;\n          left: 0;\n          top: 0;\n          width: 100%;\n          height: 100%;\n          z-index: 10;\n          background: rgba(0,0,0,0.8);\n        }"));
    _index.Connect.destroy();
  });
  test('should apply iframe styles only once if not available on document', function () {
    _index.Connect.launch(url, {
      onDone: function onDone() {},
      onError: function onError() {},
      onCancel: function onCancel() {}
    });
    var styles = document.querySelectorAll("[id=".concat(_constants.STYLES_ID, "]"));
    expect(styles.length).toBe(1);
    expect(styles[0].id).toBe(_constants.STYLES_ID);
    expect(styles[0].innerHTML).toBe("#".concat(_constants.IFRAME_ID, " {\n          position: absolute;\n          left: 0;\n          top: 0;\n          width: 100%;\n          height: 100%;\n          z-index: 10;\n          background: rgba(0,0,0,0.8);\n        }"));
    _index.Connect.destroy();

    // Re-enable launch
    _index.Connect.launch(url, {
      onDone: function onDone() {},
      onError: function onError() {},
      onCancel: function onCancel() {}
    });
    styles = document.querySelectorAll("[id=".concat(_constants.STYLES_ID, "]"));
    expect(styles.length).toBe(1);
    expect(styles[0].id).toBe(_constants.STYLES_ID);
    expect(styles[0].innerHTML).toBe("#".concat(_constants.IFRAME_ID, " {\n          position: absolute;\n          left: 0;\n          top: 0;\n          width: 100%;\n          height: 100%;\n          z-index: 10;\n          background: rgba(0,0,0,0.8);\n        }"));
    _index.Connect.destroy();
  });
  describe('destroy', function () {
    test('should remove iframe and meta elements', function () {
      var iframeStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      var metaStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      spyOn(document.head, 'appendChild').and.callFake(function () {});
      spyOn(document.body, 'appendChild').and.callFake(function () {});
      spyOn(window.document, 'createElement').and.callFake(function (element) {
        return element === 'iframe' ? iframeStub : metaStub;
      });
      jest.spyOn(window, 'removeEventListener');
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {}
      });
      _index.Connect.destroy();
      expect(iframeStub.parentNode.removeChild).toHaveBeenCalled();
      expect(metaStub.parentNode.removeChild).toHaveBeenCalled();
    });
    test('should remove postMessage event listener', function () {
      var onMessageFn;
      window.addEventListener = function (cb) {
        onMessageFn = cb;
      };
      jest.spyOn(window, 'removeEventListener');
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {}
      });
      _index.Connect.destroy();
      expect(window.removeEventListener).toHaveBeenCalledWith('message', onMessageFn);
    });
    test('should close popup window', function () {
      spyOn(window, 'open').and.returnValue(mockWindow);
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {}
      }, {
        popup: true
      });
      _index.Connect.destroy();
      expect(mockWindow.close).toHaveBeenCalled();
    });
  });
  describe('launch', function () {
    test('should handle popup scenario with default options', function () {
      spyOn(window, 'open').and.returnValue(mockWindow);
      var onLoad = jest.fn();
      spyOn(_index.Connect, 'initPostMessage').and.callFake(function () {});
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {},
        onLoad: onLoad
      }, {
        popup: true
      });
      expect(window.open).toHaveBeenCalledWith(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=720,height=520,top=24,left=252");
      expect(onLoad).toHaveBeenCalled();
      expect(_index.Connect.initPostMessage).toHaveBeenCalled();
    });
    test('should handle popup scenario with specified options', function () {
      spyOn(window, 'open').and.returnValue(mockWindow);
      var popupOptions = {
        width: 100,
        height: 100,
        top: 200,
        left: 200
      };
      var onLoad = jest.fn();
      spyOn(_index.Connect, 'initPostMessage').and.callFake(function () {});
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {},
        onLoad: onLoad
      }, {
        popup: true,
        popupOptions: popupOptions
      });
      expect(onLoad).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=".concat(popupOptions.width, ",height=").concat(popupOptions.height, ",top=").concat(popupOptions.top, ",left=").concat(popupOptions.left));
      expect(_index.Connect.initPostMessage).toHaveBeenCalled();
    });
    test('should call PostMessage with redirectUrl parameter if passed as an option', function () {
      spyOn(window, 'open').and.returnValue(mockWindow);
      var popupOptions = {
        width: 100,
        height: 100,
        top: 200,
        left: 200
      };
      var onLoad = jest.fn();
      spyOn(_index.Connect, 'initPostMessage').and.callFake(function () {});
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {},
        onLoad: onLoad
      }, {
        popup: true,
        popupOptions: popupOptions,
        redirectUrl: 'https://test.com'
      });
      expect(onLoad).toHaveBeenCalled();
      expect(window.open).toHaveBeenCalledWith(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=".concat(popupOptions.width, ",height=").concat(popupOptions.height, ",top=").concat(popupOptions.top, ",left=").concat(popupOptions.left));
      expect(_index.Connect.initPostMessage).toHaveBeenCalledWith({
        popup: true,
        popupOptions: popupOptions,
        redirectUrl: 'https://test.com'
      });
    });
    test('should return error event if popup failed to open', function () {
      spyOn(window, 'open').and.returnValue(undefined);
      var onError = jest.fn();
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: onError,
        onCancel: function onCancel() {}
      }, {
        popup: true
      });
      expect(window.open).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith({
        reason: 'error',
        code: 1403
      });
    });
    test('should handle iframe scenario with no overrides', function () {
      spyOn(document, 'querySelectorAll').and.callThrough();
      var iframeStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      var metaStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      spyOn(document.head, 'appendChild').and.callFake(function () {});
      spyOn(document.body, 'appendChild').and.callFake(function () {});
      spyOn(window.document, 'createElement').and.callFake(function (element) {
        return element === 'iframe' ? iframeStub : metaStub;
      });
      var onLoad = jest.fn();
      spyOn(_index.Connect, 'initPostMessage').and.callFake(function () {});
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {},
        onLoad: onLoad
      });
      expect(document.querySelectorAll).toHaveBeenCalledWith('meta[name="viewport"]');
      expect(document.createElement).toHaveBeenCalledWith('meta');
      expect(metaStub.setAttribute).toHaveBeenCalledWith('name', 'viewport');
      expect(metaStub.setAttribute).toHaveBeenCalledWith('content', 'initial-scale=1');
      expect(document.head.appendChild).toHaveBeenCalledWith(metaStub);
      expect(document.createElement).toHaveBeenCalledWith('iframe');
      expect(iframeStub.src).toBe(url);
      expect(iframeStub.setAttribute).toHaveBeenCalledWith('id', _constants.IFRAME_ID);
      expect(iframeStub.setAttribute).toHaveBeenCalledWith('frameborder', '0');
      expect(iframeStub.setAttribute).toHaveBeenCalledWith('scrolling', 'no');
      expect(document.body.appendChild).toHaveBeenCalledWith(iframeStub);
      iframeStub.onload();
      expect(_index.Connect.initPostMessage).toHaveBeenCalledWith({});
      expect(onLoad).toHaveBeenCalled();
    });
    test('should handle iframe scenario with custom overlay and container', function () {
      var mockContainer = {
        appendChild: jest.fn()
      };
      var options = {
        overlay: 'gray',
        selector: '#container'
      };
      spyOn(document, 'querySelectorAll').and.callThrough();
      spyOn(document, 'querySelector').and.returnValue(mockContainer);
      var iframeStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      var metaStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      spyOn(document.head, 'appendChild').and.callFake(function () {});
      spyOn(document.body, 'appendChild').and.callFake(function () {});
      spyOn(window.document, 'createElement').and.callFake(function (element) {
        return element === 'iframe' ? iframeStub : metaStub;
      });
      var onLoad = jest.fn();
      spyOn(_index.Connect, 'initPostMessage').and.callFake(function () {});
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {},
        onLoad: onLoad
      }, options);
      expect(iframeStub.setAttribute).toHaveBeenCalledWith('style', 'background: gray;');
      expect(document.querySelector).toHaveBeenCalledWith('#container');
      expect(mockContainer.appendChild).toHaveBeenCalledWith(iframeStub);
      iframeStub.onload();
      expect(_index.Connect.initPostMessage).toHaveBeenCalledWith(options);
      expect(onLoad).toHaveBeenCalled();
    });
    test('should handle iframe scenario with custom container as node', function () {
      var mockContainer = {
        appendChild: jest.fn()
      };
      var options = {
        node: mockContainer
      };
      var iframeStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      var metaStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      spyOn(document.head, 'appendChild').and.callFake(function () {});
      spyOn(window.document, 'createElement').and.callFake(function (element) {
        return element === 'iframe' ? iframeStub : metaStub;
      });
      var onLoad = jest.fn();
      spyOn(_index.Connect, 'initPostMessage').and.callFake(function () {});
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {},
        onLoad: onLoad
      }, options);
      expect(mockContainer.appendChild).toHaveBeenCalledWith(iframeStub);
      iframeStub.onload();
      expect(_index.Connect.initPostMessage).toHaveBeenCalledWith(options);
      expect(onLoad).toHaveBeenCalled();
    });
    test("should log warning and append iframe to body if selector doesn't return an element", function () {
      spyOn(console, 'warn').and.callFake(function () {});
      var options = {
        selector: '#container'
      };
      spyOn(document, 'querySelectorAll').and.callThrough();
      spyOn(document, 'querySelector').and.returnValue(undefined);
      var iframeStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      var metaStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      spyOn(document.head, 'appendChild').and.callFake(function () {});
      spyOn(document.body, 'appendChild').and.callFake(function () {});
      spyOn(window.document, 'createElement').and.callFake(function (element) {
        return element === 'iframe' ? iframeStub : metaStub;
      });
      var onLoad = jest.fn();
      spyOn(_index.Connect, 'initPostMessage').and.callFake(function () {});
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {},
        onLoad: onLoad
      }, options);
      expect(document.querySelector).toHaveBeenCalledWith('#container');
      expect(document.body.appendChild).toHaveBeenCalledWith(iframeStub);
      expect(console.warn).toHaveBeenCalledWith("Couldn't find any elements matching \"".concat(options.selector, "\", appending \"iframe\" to \"body\" instead."));
    });
    test('should throw error if launch is called again before calling destroy', function () {
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {}
      });
      try {
        _index.Connect.launch(url, {
          onDone: function onDone() {},
          onError: function onError() {},
          onCancel: function onCancel() {}
        });
      } catch (e) {
        expect(e.message).toBe('You must destroy the iframe before you can open a new one. Call "destroy()"');
      }
    });
  });
  describe('initPostMessage', function () {
    test('should call postMessage every second with the expected parameters and attach postMessage event handler', function () {
      spyOn(window, 'setInterval').and.callThrough();
      spyOn(_index.Connect, 'postMessage').and.callFake(function () {});
      _index.Connect.initPostMessage({
        selector: '#container'
      });
      jest.advanceTimersByTime(1100);
      expect(_index.Connect.postMessage).toHaveBeenCalledWith({
        type: _constants.PING_EVENT,
        selector: '#container',
        sdkVersion: _constants.CONNECT_SDK_VERSION,
        platform: _constants.PLATFORM_IFRAME
      });
      _index.Connect.initPostMessage({
        popup: true
      });
      jest.advanceTimersByTime(1100);
      expect(_index.Connect.postMessage).toHaveBeenCalledWith({
        type: _constants.PING_EVENT,
        selector: undefined,
        sdkVersion: _constants.CONNECT_SDK_VERSION,
        platform: _constants.PLATFORM_POPUP
      });
    });
    test('should call attach postMessage event handler and send events as expected', function () {
      var eventHandler;
      var popupMock = {
        close: jest.fn(),
        focus: jest.fn()
      };
      spyOn(window, 'open').and.callFake(jest.fn().mockReturnValue(popupMock));
      spyOn(window, 'addEventListener').and.callFake(function (eventType, eh) {
        return eventHandler = eh;
      });
      var eventHandlers = {
        onDone: jest.fn(),
        onError: jest.fn(),
        onCancel: jest.fn()
      };
      _index.Connect.launch(url, eventHandlers);
      _index.Connect.initPostMessage({
        selector: '#container'
      });
      expect(window.addEventListener).toHaveBeenCalled();
      spyOn(window, 'clearInterval');
      eventHandler({
        origin: url,
        data: {
          type: _constants.ACK_EVENT
        }
      });
      expect(window.clearInterval).toHaveBeenCalled();
      spyOn(_index.Connect, 'openPopupWindow').and.callThrough();
      spyOn(_index.Connect, 'destroy');
      eventHandler({
        origin: url,
        data: {
          type: _constants.URL_EVENT,
          url: 'http://oauth.com'
        }
      });
      expect(_index.Connect.openPopupWindow).toHaveBeenCalledWith('http://oauth.com');
      var payload = {
        test: true
      };
      eventHandler({
        origin: url,
        data: {
          type: _constants.DONE_EVENT,
          data: payload
        }
      });
      expect(eventHandlers.onDone).toHaveBeenCalledWith(payload);
      expect(_index.Connect.destroy).toHaveBeenCalledTimes(1);
      eventHandler({
        origin: url,
        data: {
          type: _constants.CANCEL_EVENT,
          data: payload
        }
      });
      expect(eventHandlers.onCancel).toHaveBeenCalledWith(payload);
      expect(_index.Connect.destroy).toHaveBeenCalledTimes(2);
      eventHandler({
        origin: url,
        data: {
          type: _constants.ERROR_EVENT,
          data: payload
        }
      });
      expect(eventHandlers.onCancel).toHaveBeenCalledWith(payload);
      expect(_index.Connect.destroy).toHaveBeenCalledTimes(3);
      eventHandler({
        origin: url,
        data: {
          type: _constants.ROUTE_EVENT,
          data: payload
        }
      });
      expect(eventHandlers.onCancel).toHaveBeenCalledWith(payload);
      expect(_index.Connect.destroy).toHaveBeenCalledTimes(3);
      eventHandler({
        origin: url,
        data: {
          type: _constants.USER_EVENT,
          data: payload
        }
      });
      expect(eventHandlers.onCancel).toHaveBeenCalledWith(payload);
      expect(_index.Connect.destroy).toHaveBeenCalledTimes(3);
      eventHandler({
        origin: url,
        data: {
          type: _constants.CLOSE_POPUP_EVENT,
          data: payload
        }
      });
      expect(popupMock.close).toHaveBeenCalled();
      expect(_index.Connect.destroy).toHaveBeenCalledTimes(3);
    });
    test('should call attach postMessage event handler and ping Connect indefinitely for popup scenario', function () {
      var eventHandler;
      spyOn(window, 'open').and.callFake(function () {
        return mockWindow;
      });
      spyOn(window, 'addEventListener').and.callFake(function (eventType, eh) {
        return eventHandler = eh;
      });
      var eventHandlers = {
        onDone: jest.fn(),
        onError: jest.fn(),
        onCancel: jest.fn()
      };
      _index.Connect.launch(url, eventHandlers, {
        popup: true
      });
      _index.Connect.initPostMessage({
        popup: true
      });
      expect(window.addEventListener).toHaveBeenCalled();
      spyOn(window, 'clearInterval');
      eventHandler({
        origin: url,
        data: {
          type: _constants.ACK_EVENT
        }
      });
      expect(window.clearInterval).not.toHaveBeenCalled();
    });
  });
  describe('openPopupWindow', function () {
    test("should open popup window, focus on it and periodically watch if it's still open", function () {
      spyOn(window, 'open').and.callFake(function () {
        return mockWindow;
      });
      spyOn(window, 'setInterval');
      spyOn(window, 'clearInterval');
      spyOn(_index.Connect, 'postMessage').and.callFake(function () {});
      _index.Connect.openPopupWindow(url);
      expect(window.open).toHaveBeenCalledWith(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=".concat(_constants.POPUP_WIDTH, ",height=").concat(_constants.POPUP_HEIGHT, ",top=84,left=212"));
      expect(mockWindow.focus).toHaveBeenCalled();
      expect(window.setInterval).toHaveBeenCalled();
      jest.advanceTimersByTime(1100);
      expect(window.clearInterval).not.toHaveBeenCalled();
    });
    test('should call postMessage when the popup is closed', function () {
      mockWindow.closed = true;
      spyOn(window, 'open').and.callFake(function () {
        return mockWindow;
      });
      spyOn(window, 'setInterval').and.callThrough();
      spyOn(window, 'clearInterval');
      spyOn(_index.Connect, 'postMessage').and.callFake(function () {});
      _index.Connect.openPopupWindow(url);
      expect(window.open).toHaveBeenCalledWith(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=".concat(_constants.POPUP_WIDTH, ",height=").concat(_constants.POPUP_HEIGHT, ",top=84,left=212"));
      expect(mockWindow.focus).toHaveBeenCalled();
      expect(window.setInterval).toHaveBeenCalled();
      jest.advanceTimersByTime(1100);
      expect(window.clearInterval).toHaveBeenCalled();
      expect(_index.Connect.postMessage).toHaveBeenCalledWith({
        type: _constants.WINDOW_EVENT,
        closed: true,
        blocked: false
      });
    });
    test('should let Connect know if the popup was blocked', function () {
      spyOn(window, 'open').and.callFake(function () {
        return undefined;
      });
      spyOn(_index.Connect, 'postMessage').and.callFake(function () {});
      _index.Connect.openPopupWindow(url);
      expect(window.open).toHaveBeenCalledWith(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=".concat(_constants.POPUP_WIDTH, ",height=").concat(_constants.POPUP_HEIGHT, ",top=84,left=212"));
      expect(mockWindow.focus).not.toHaveBeenCalled();
      expect(_index.Connect.postMessage).toHaveBeenCalledWith({
        type: _constants.WINDOW_EVENT,
        closed: true,
        blocked: true
      });
    });
  });
  describe('postMessage', function () {
    test('should call postMessage on (iframe)', function () {
      var iframeStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn(),
        contentWindow: {
          postMessage: jest.fn()
        }
      };
      var metaStub = {
        parentNode: {
          removeChild: jest.fn()
        },
        setAttribute: jest.fn()
      };
      spyOn(document.head, 'appendChild').and.callFake(function () {});
      spyOn(document.body, 'appendChild').and.callFake(function () {});
      spyOn(window.document, 'createElement').and.callFake(function (element) {
        return element === 'iframe' ? iframeStub : metaStub;
      });
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {}
      });
      iframeStub.onload();
      var data = {
        test: true
      };
      _index.Connect.postMessage(data);
      expect(iframeStub.contentWindow.postMessage).toHaveBeenCalledWith(data, url);
    });
    test('should call postMessage on (popup)', function () {
      spyOn(window, 'open').and.returnValue(mockWindow);
      _index.Connect.launch(url, {
        onDone: function onDone() {},
        onError: function onError() {},
        onCancel: function onCancel() {}
      }, {
        popup: true
      });
      var data = {
        test: true
      };
      _index.Connect.postMessage(data);
      expect(mockWindow.postMessage).toHaveBeenCalledWith(data, url);
    });
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfaW5kZXgiLCJyZXF1aXJlIiwiX2NvbnN0YW50cyIsImRlZmF1bHRQb3B1cE9wdGlvbnMiLCJ3aWR0aCIsIkNPTk5FQ1RfUE9QVVBfSEVJR0hUIiwiaGVpZ2h0IiwiQ09OTkVDVF9QT1BVUF9XSURUSCIsInRvcCIsIndpbmRvdyIsIm91dGVySGVpZ2h0Iiwic2NyZWVuWSIsImxlZnQiLCJvdXRlcldpZHRoIiwic2NyZWVuWCIsInVybCIsImRlc2NyaWJlIiwibW9ja1dpbmRvdyIsImJlZm9yZUVhY2giLCJjbG9zZSIsImplc3QiLCJmbiIsImZvY3VzIiwiY2xvc2VkIiwicG9zdE1lc3NhZ2UiLCJ1c2VGYWtlVGltZXJzIiwiYWZ0ZXJFYWNoIiwicmVzZXRBbGxNb2NrcyIsIkNvbm5lY3QiLCJkZXN0cm95IiwidGVzdCIsImxhdW5jaCIsIm9uRG9uZSIsIm9uRXJyb3IiLCJvbkNhbmNlbCIsInN0eWxlcyIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJTVFlMRVNfSUQiLCJleHBlY3QiLCJpZCIsInRvQmUiLCJpbm5lckhUTUwiLCJjb25jYXQiLCJJRlJBTUVfSUQiLCJxdWVyeVNlbGVjdG9yQWxsIiwibGVuZ3RoIiwiaWZyYW1lU3R1YiIsInBhcmVudE5vZGUiLCJyZW1vdmVDaGlsZCIsInNldEF0dHJpYnV0ZSIsIm1ldGFTdHViIiwic3B5T24iLCJoZWFkIiwiYW5kIiwiY2FsbEZha2UiLCJib2R5IiwiZWxlbWVudCIsInRvSGF2ZUJlZW5DYWxsZWQiLCJvbk1lc3NhZ2VGbiIsImFkZEV2ZW50TGlzdGVuZXIiLCJjYiIsInJlbW92ZUV2ZW50TGlzdGVuZXIiLCJ0b0hhdmVCZWVuQ2FsbGVkV2l0aCIsInJldHVyblZhbHVlIiwicG9wdXAiLCJvbkxvYWQiLCJvcGVuIiwiaW5pdFBvc3RNZXNzYWdlIiwicG9wdXBPcHRpb25zIiwicmVkaXJlY3RVcmwiLCJ1bmRlZmluZWQiLCJyZWFzb24iLCJjb2RlIiwiY2FsbFRocm91Z2giLCJjcmVhdGVFbGVtZW50IiwiYXBwZW5kQ2hpbGQiLCJzcmMiLCJvbmxvYWQiLCJtb2NrQ29udGFpbmVyIiwib3B0aW9ucyIsIm92ZXJsYXkiLCJzZWxlY3RvciIsInF1ZXJ5U2VsZWN0b3IiLCJub2RlIiwiY29uc29sZSIsIndhcm4iLCJlIiwibWVzc2FnZSIsImFkdmFuY2VUaW1lcnNCeVRpbWUiLCJ0eXBlIiwiUElOR19FVkVOVCIsInNka1ZlcnNpb24iLCJDT05ORUNUX1NES19WRVJTSU9OIiwicGxhdGZvcm0iLCJQTEFURk9STV9JRlJBTUUiLCJQTEFURk9STV9QT1BVUCIsImV2ZW50SGFuZGxlciIsInBvcHVwTW9jayIsIm1vY2tSZXR1cm5WYWx1ZSIsImV2ZW50VHlwZSIsImVoIiwiZXZlbnRIYW5kbGVycyIsIm9yaWdpbiIsImRhdGEiLCJBQ0tfRVZFTlQiLCJjbGVhckludGVydmFsIiwiVVJMX0VWRU5UIiwib3BlblBvcHVwV2luZG93IiwicGF5bG9hZCIsIkRPTkVfRVZFTlQiLCJ0b0hhdmVCZWVuQ2FsbGVkVGltZXMiLCJDQU5DRUxfRVZFTlQiLCJFUlJPUl9FVkVOVCIsIlJPVVRFX0VWRU5UIiwiVVNFUl9FVkVOVCIsIkNMT1NFX1BPUFVQX0VWRU5UIiwibm90IiwiUE9QVVBfV0lEVEgiLCJQT1BVUF9IRUlHSFQiLCJzZXRJbnRlcnZhbCIsIldJTkRPV19FVkVOVCIsImJsb2NrZWQiLCJjb250ZW50V2luZG93Il0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL2luZGV4LnNwZWMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29ubmVjdCB9IGZyb20gJy4vaW5kZXgnO1xuXG5pbXBvcnQge1xuICBJRlJBTUVfSUQsXG4gIFBPUFVQX1dJRFRILFxuICBQT1BVUF9IRUlHSFQsXG4gIENPTk5FQ1RfUE9QVVBfSEVJR0hULFxuICBDT05ORUNUX1BPUFVQX1dJRFRILFxuICBBQ0tfRVZFTlQsXG4gIENBTkNFTF9FVkVOVCxcbiAgVVJMX0VWRU5ULFxuICBET05FX0VWRU5ULFxuICBFUlJPUl9FVkVOVCxcbiAgUElOR19FVkVOVCxcbiAgV0lORE9XX0VWRU5ULFxuICBST1VURV9FVkVOVCxcbiAgVVNFUl9FVkVOVCxcbiAgUExBVEZPUk1fSUZSQU1FLFxuICBQTEFURk9STV9QT1BVUCxcbiAgU1RZTEVTX0lELFxuICBDT05ORUNUX1NES19WRVJTSU9OLFxuICBDTE9TRV9QT1BVUF9FVkVOVCxcbn0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5jb25zdCBkZWZhdWx0UG9wdXBPcHRpb25zID0ge1xuICB3aWR0aDogQ09OTkVDVF9QT1BVUF9IRUlHSFQsXG4gIGhlaWdodDogQ09OTkVDVF9QT1BVUF9XSURUSCxcbiAgdG9wOlxuICAgIHdpbmRvdy50b3Aub3V0ZXJIZWlnaHQgLyAyICsgd2luZG93LnRvcC5zY3JlZW5ZIC0gQ09OTkVDVF9QT1BVUF9IRUlHSFQgLyAyLFxuICBsZWZ0OlxuICAgIHdpbmRvdy50b3Aub3V0ZXJXaWR0aCAvIDIgKyB3aW5kb3cudG9wLnNjcmVlblggLSBDT05ORUNUX1BPUFVQX1dJRFRIIC8gMixcbn07XG5cbmNvbnN0IHVybCA9ICdodHRwOi8vdGVzdC5jb20nO1xuZGVzY3JpYmUoJ0Nvbm5lY3QnLCAoKSA9PiB7XG4gIGxldCBtb2NrV2luZG93O1xuICBiZWZvcmVFYWNoKCgpID0+IHtcbiAgICBtb2NrV2luZG93ID0ge1xuICAgICAgY2xvc2U6IGplc3QuZm4oKSxcbiAgICAgIGZvY3VzOiBqZXN0LmZuKCksXG4gICAgICBjbG9zZWQ6IGZhbHNlLFxuICAgICAgcG9zdE1lc3NhZ2U6IGplc3QuZm4oKSxcbiAgICB9O1xuICAgIGplc3QudXNlRmFrZVRpbWVycygpO1xuICB9KTtcblxuICBhZnRlckVhY2goKCkgPT4ge1xuICAgIGplc3QucmVzZXRBbGxNb2NrcygpO1xuICAgIENvbm5lY3QuZGVzdHJveSgpO1xuICB9KTtcblxuICB0ZXN0KCdzaG91bGQgYXBwbHkgaWZyYW1lIHN0eWxlcycsICgpID0+IHtcbiAgICBDb25uZWN0LmxhdW5jaCh1cmwsIHtcbiAgICAgIG9uRG9uZTogKCkgPT4ge30sXG4gICAgICBvbkVycm9yOiAoKSA9PiB7fSxcbiAgICAgIG9uQ2FuY2VsOiAoKSA9PiB7fSxcbiAgICB9KTtcbiAgICBjb25zdCBzdHlsZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChTVFlMRVNfSUQpO1xuICAgIGV4cGVjdChzdHlsZXMuaWQpLnRvQmUoU1RZTEVTX0lEKTtcbiAgICBleHBlY3Qoc3R5bGVzLmlubmVySFRNTCkudG9CZShgIyR7SUZSQU1FX0lEfSB7XG4gICAgICAgICAgcG9zaXRpb246IGFic29sdXRlO1xuICAgICAgICAgIGxlZnQ6IDA7XG4gICAgICAgICAgdG9wOiAwO1xuICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgIGhlaWdodDogMTAwJTtcbiAgICAgICAgICB6LWluZGV4OiAxMDtcbiAgICAgICAgICBiYWNrZ3JvdW5kOiByZ2JhKDAsMCwwLDAuOCk7XG4gICAgICAgIH1gKTtcbiAgICBDb25uZWN0LmRlc3Ryb3koKTtcbiAgfSk7XG5cbiAgdGVzdCgnc2hvdWxkIGFwcGx5IGlmcmFtZSBzdHlsZXMgb25seSBvbmNlIGlmIG5vdCBhdmFpbGFibGUgb24gZG9jdW1lbnQnLCAoKSA9PiB7XG4gICAgQ29ubmVjdC5sYXVuY2godXJsLCB7XG4gICAgICBvbkRvbmU6ICgpID0+IHt9LFxuICAgICAgb25FcnJvcjogKCkgPT4ge30sXG4gICAgICBvbkNhbmNlbDogKCkgPT4ge30sXG4gICAgfSk7XG4gICAgbGV0IHN0eWxlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtpZD0ke1NUWUxFU19JRH1dYCk7XG4gICAgZXhwZWN0KHN0eWxlcy5sZW5ndGgpLnRvQmUoMSk7XG4gICAgZXhwZWN0KHN0eWxlc1swXS5pZCkudG9CZShTVFlMRVNfSUQpO1xuICAgIGV4cGVjdChzdHlsZXNbMF0uaW5uZXJIVE1MKS50b0JlKGAjJHtJRlJBTUVfSUR9IHtcbiAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgbGVmdDogMDtcbiAgICAgICAgICB0b3A6IDA7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIHotaW5kZXg6IDEwO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwwLDAsMC44KTtcbiAgICAgICAgfWApO1xuICAgIENvbm5lY3QuZGVzdHJveSgpO1xuXG4gICAgLy8gUmUtZW5hYmxlIGxhdW5jaFxuICAgIENvbm5lY3QubGF1bmNoKHVybCwge1xuICAgICAgb25Eb25lOiAoKSA9PiB7fSxcbiAgICAgIG9uRXJyb3I6ICgpID0+IHt9LFxuICAgICAgb25DYW5jZWw6ICgpID0+IHt9LFxuICAgIH0pO1xuICAgIHN0eWxlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoYFtpZD0ke1NUWUxFU19JRH1dYCk7XG4gICAgZXhwZWN0KHN0eWxlcy5sZW5ndGgpLnRvQmUoMSk7XG4gICAgZXhwZWN0KHN0eWxlc1swXS5pZCkudG9CZShTVFlMRVNfSUQpO1xuICAgIGV4cGVjdChzdHlsZXNbMF0uaW5uZXJIVE1MKS50b0JlKGAjJHtJRlJBTUVfSUR9IHtcbiAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgbGVmdDogMDtcbiAgICAgICAgICB0b3A6IDA7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIHotaW5kZXg6IDEwO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwwLDAsMC44KTtcbiAgICAgICAgfWApO1xuICAgIENvbm5lY3QuZGVzdHJveSgpO1xuICB9KTtcblxuICBkZXNjcmliZSgnZGVzdHJveScsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgcmVtb3ZlIGlmcmFtZSBhbmQgbWV0YSBlbGVtZW50cycsICgpID0+IHtcbiAgICAgIGNvbnN0IGlmcmFtZVN0dWI6IGFueSA9IHtcbiAgICAgICAgcGFyZW50Tm9kZTogeyByZW1vdmVDaGlsZDogamVzdC5mbigpIH0sXG4gICAgICAgIHNldEF0dHJpYnV0ZTogamVzdC5mbigpLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IG1ldGFTdHViOiBhbnkgPSB7XG4gICAgICAgIHBhcmVudE5vZGU6IHsgcmVtb3ZlQ2hpbGQ6IGplc3QuZm4oKSB9LFxuICAgICAgICBzZXRBdHRyaWJ1dGU6IGplc3QuZm4oKSxcbiAgICAgIH07XG4gICAgICBzcHlPbihkb2N1bWVudC5oZWFkLCAnYXBwZW5kQ2hpbGQnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuICAgICAgc3B5T24oZG9jdW1lbnQuYm9keSwgJ2FwcGVuZENoaWxkJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcbiAgICAgIHNweU9uKHdpbmRvdy5kb2N1bWVudCwgJ2NyZWF0ZUVsZW1lbnQnKS5hbmQuY2FsbEZha2UoKGVsZW1lbnQpID0+XG4gICAgICAgIGVsZW1lbnQgPT09ICdpZnJhbWUnID8gaWZyYW1lU3R1YiA6IG1ldGFTdHViXG4gICAgICApO1xuICAgICAgamVzdC5zcHlPbih3aW5kb3csICdyZW1vdmVFdmVudExpc3RlbmVyJyk7XG4gICAgICBDb25uZWN0LmxhdW5jaCh1cmwsIHtcbiAgICAgICAgb25Eb25lOiAoKSA9PiB7fSxcbiAgICAgICAgb25FcnJvcjogKCkgPT4ge30sXG4gICAgICAgIG9uQ2FuY2VsOiAoKSA9PiB7fSxcbiAgICAgIH0pO1xuICAgICAgQ29ubmVjdC5kZXN0cm95KCk7XG5cbiAgICAgIGV4cGVjdChpZnJhbWVTdHViLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGV4cGVjdChtZXRhU3R1Yi5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgcmVtb3ZlIHBvc3RNZXNzYWdlIGV2ZW50IGxpc3RlbmVyJywgKCkgPT4ge1xuICAgICAgbGV0IG9uTWVzc2FnZUZuO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIgPSAoY2IpID0+IHtcbiAgICAgICAgb25NZXNzYWdlRm4gPSBjYjtcbiAgICAgIH07XG4gICAgICBqZXN0LnNweU9uKHdpbmRvdywgJ3JlbW92ZUV2ZW50TGlzdGVuZXInKTtcbiAgICAgIENvbm5lY3QubGF1bmNoKHVybCwge1xuICAgICAgICBvbkRvbmU6ICgpID0+IHt9LFxuICAgICAgICBvbkVycm9yOiAoKSA9PiB7fSxcbiAgICAgICAgb25DYW5jZWw6ICgpID0+IHt9LFxuICAgICAgfSk7XG4gICAgICBDb25uZWN0LmRlc3Ryb3koKTtcbiAgICAgIGV4cGVjdCh3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgICdtZXNzYWdlJyxcbiAgICAgICAgb25NZXNzYWdlRm5cbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgY2xvc2UgcG9wdXAgd2luZG93JywgKCkgPT4ge1xuICAgICAgc3B5T24od2luZG93LCAnb3BlbicpLmFuZC5yZXR1cm5WYWx1ZShtb2NrV2luZG93KTtcbiAgICAgIENvbm5lY3QubGF1bmNoKFxuICAgICAgICB1cmwsXG4gICAgICAgIHsgb25Eb25lOiAoKSA9PiB7fSwgb25FcnJvcjogKCkgPT4ge30sIG9uQ2FuY2VsOiAoKSA9PiB7fSB9LFxuICAgICAgICB7IHBvcHVwOiB0cnVlIH1cbiAgICAgICk7XG4gICAgICBDb25uZWN0LmRlc3Ryb3koKTtcbiAgICAgIGV4cGVjdChtb2NrV2luZG93LmNsb3NlKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdsYXVuY2gnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBwb3B1cCBzY2VuYXJpbyB3aXRoIGRlZmF1bHQgb3B0aW9ucycsICgpID0+IHtcbiAgICAgIHNweU9uKHdpbmRvdywgJ29wZW4nKS5hbmQucmV0dXJuVmFsdWUobW9ja1dpbmRvdyk7XG4gICAgICBjb25zdCBvbkxvYWQgPSBqZXN0LmZuKCk7XG4gICAgICBzcHlPbihDb25uZWN0LCAnaW5pdFBvc3RNZXNzYWdlJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcbiAgICAgIENvbm5lY3QubGF1bmNoKFxuICAgICAgICB1cmwsXG4gICAgICAgIHsgb25Eb25lOiAoKSA9PiB7fSwgb25FcnJvcjogKCkgPT4ge30sIG9uQ2FuY2VsOiAoKSA9PiB7fSwgb25Mb2FkIH0sXG4gICAgICAgIHsgcG9wdXA6IHRydWUgfVxuICAgICAgKTtcbiAgICAgIGV4cGVjdCh3aW5kb3cub3BlbikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIHVybCxcbiAgICAgICAgJ3RhcmdldFdpbmRvdycsXG4gICAgICAgIGB0b29sYmFyPW5vLGxvY2F0aW9uPW5vLHN0YXR1cz1ubyxtZW51YmFyPW5vLHdpZHRoPTcyMCxoZWlnaHQ9NTIwLHRvcD0yNCxsZWZ0PTI1MmBcbiAgICAgICk7XG4gICAgICBleHBlY3Qob25Mb2FkKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBleHBlY3QoQ29ubmVjdC5pbml0UG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgcG9wdXAgc2NlbmFyaW8gd2l0aCBzcGVjaWZpZWQgb3B0aW9ucycsICgpID0+IHtcbiAgICAgIHNweU9uKHdpbmRvdywgJ29wZW4nKS5hbmQucmV0dXJuVmFsdWUobW9ja1dpbmRvdyk7XG4gICAgICBjb25zdCBwb3B1cE9wdGlvbnMgPSB7XG4gICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgIGhlaWdodDogMTAwLFxuICAgICAgICB0b3A6IDIwMCxcbiAgICAgICAgbGVmdDogMjAwLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IG9uTG9hZCA9IGplc3QuZm4oKTtcbiAgICAgIHNweU9uKENvbm5lY3QsICdpbml0UG9zdE1lc3NhZ2UnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuICAgICAgQ29ubmVjdC5sYXVuY2goXG4gICAgICAgIHVybCxcbiAgICAgICAgeyBvbkRvbmU6ICgpID0+IHt9LCBvbkVycm9yOiAoKSA9PiB7fSwgb25DYW5jZWw6ICgpID0+IHt9LCBvbkxvYWQgfSxcbiAgICAgICAgeyBwb3B1cDogdHJ1ZSwgcG9wdXBPcHRpb25zIH1cbiAgICAgICk7XG4gICAgICBleHBlY3Qob25Mb2FkKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBleHBlY3Qod2luZG93Lm9wZW4pLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICB1cmwsXG4gICAgICAgICd0YXJnZXRXaW5kb3cnLFxuICAgICAgICBgdG9vbGJhcj1ubyxsb2NhdGlvbj1ubyxzdGF0dXM9bm8sbWVudWJhcj1ubyx3aWR0aD0ke3BvcHVwT3B0aW9ucy53aWR0aH0saGVpZ2h0PSR7cG9wdXBPcHRpb25zLmhlaWdodH0sdG9wPSR7cG9wdXBPcHRpb25zLnRvcH0sbGVmdD0ke3BvcHVwT3B0aW9ucy5sZWZ0fWBcbiAgICAgICk7XG4gICAgICBleHBlY3QoQ29ubmVjdC5pbml0UG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBjYWxsIFBvc3RNZXNzYWdlIHdpdGggcmVkaXJlY3RVcmwgcGFyYW1ldGVyIGlmIHBhc3NlZCBhcyBhbiBvcHRpb24nLCAoKSA9PiB7XG4gICAgICBzcHlPbih3aW5kb3csICdvcGVuJykuYW5kLnJldHVyblZhbHVlKG1vY2tXaW5kb3cpO1xuICAgICAgY29uc3QgcG9wdXBPcHRpb25zID0ge1xuICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICBoZWlnaHQ6IDEwMCxcbiAgICAgICAgdG9wOiAyMDAsXG4gICAgICAgIGxlZnQ6IDIwMCxcbiAgICAgIH07XG4gICAgICBjb25zdCBvbkxvYWQgPSBqZXN0LmZuKCk7XG4gICAgICBzcHlPbihDb25uZWN0LCAnaW5pdFBvc3RNZXNzYWdlJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcbiAgICAgIENvbm5lY3QubGF1bmNoKFxuICAgICAgICB1cmwsXG4gICAgICAgIHsgb25Eb25lOiAoKSA9PiB7fSwgb25FcnJvcjogKCkgPT4ge30sIG9uQ2FuY2VsOiAoKSA9PiB7fSwgb25Mb2FkIH0sXG4gICAgICAgIHsgcG9wdXA6IHRydWUsIHBvcHVwT3B0aW9ucywgcmVkaXJlY3RVcmw6ICdodHRwczovL3Rlc3QuY29tJyB9XG4gICAgICApO1xuICAgICAgZXhwZWN0KG9uTG9hZCkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgZXhwZWN0KHdpbmRvdy5vcGVuKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgdXJsLFxuICAgICAgICAndGFyZ2V0V2luZG93JyxcbiAgICAgICAgYHRvb2xiYXI9bm8sbG9jYXRpb249bm8sc3RhdHVzPW5vLG1lbnViYXI9bm8sd2lkdGg9JHtwb3B1cE9wdGlvbnMud2lkdGh9LGhlaWdodD0ke3BvcHVwT3B0aW9ucy5oZWlnaHR9LHRvcD0ke3BvcHVwT3B0aW9ucy50b3B9LGxlZnQ9JHtwb3B1cE9wdGlvbnMubGVmdH1gXG4gICAgICApO1xuICAgICAgZXhwZWN0KENvbm5lY3QuaW5pdFBvc3RNZXNzYWdlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCh7XG4gICAgICAgIHBvcHVwOiB0cnVlLFxuICAgICAgICBwb3B1cE9wdGlvbnMsXG4gICAgICAgIHJlZGlyZWN0VXJsOiAnaHR0cHM6Ly90ZXN0LmNvbScsXG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCByZXR1cm4gZXJyb3IgZXZlbnQgaWYgcG9wdXAgZmFpbGVkIHRvIG9wZW4nLCAoKSA9PiB7XG4gICAgICBzcHlPbih3aW5kb3csICdvcGVuJykuYW5kLnJldHVyblZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBvbkVycm9yID0gamVzdC5mbigpO1xuICAgICAgQ29ubmVjdC5sYXVuY2goXG4gICAgICAgIHVybCxcbiAgICAgICAgeyBvbkRvbmU6ICgpID0+IHt9LCBvbkVycm9yLCBvbkNhbmNlbDogKCkgPT4ge30gfSxcbiAgICAgICAgeyBwb3B1cDogdHJ1ZSB9XG4gICAgICApO1xuICAgICAgZXhwZWN0KHdpbmRvdy5vcGVuKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBleHBlY3Qob25FcnJvcikudG9IYXZlQmVlbkNhbGxlZFdpdGgoeyByZWFzb246ICdlcnJvcicsIGNvZGU6IDE0MDMgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgaGFuZGxlIGlmcmFtZSBzY2VuYXJpbyB3aXRoIG5vIG92ZXJyaWRlcycsICgpID0+IHtcbiAgICAgIHNweU9uKGRvY3VtZW50LCAncXVlcnlTZWxlY3RvckFsbCcpLmFuZC5jYWxsVGhyb3VnaCgpO1xuICAgICAgY29uc3QgaWZyYW1lU3R1YjogYW55ID0ge1xuICAgICAgICBwYXJlbnROb2RlOiB7IHJlbW92ZUNoaWxkOiBqZXN0LmZuKCkgfSxcbiAgICAgICAgc2V0QXR0cmlidXRlOiBqZXN0LmZuKCksXG4gICAgICB9O1xuICAgICAgY29uc3QgbWV0YVN0dWI6IGFueSA9IHtcbiAgICAgICAgcGFyZW50Tm9kZTogeyByZW1vdmVDaGlsZDogamVzdC5mbigpIH0sXG4gICAgICAgIHNldEF0dHJpYnV0ZTogamVzdC5mbigpLFxuICAgICAgfTtcbiAgICAgIHNweU9uKGRvY3VtZW50LmhlYWQsICdhcHBlbmRDaGlsZCcpLmFuZC5jYWxsRmFrZSgoKSA9PiB7fSk7XG4gICAgICBzcHlPbihkb2N1bWVudC5ib2R5LCAnYXBwZW5kQ2hpbGQnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuICAgICAgc3B5T24od2luZG93LmRvY3VtZW50LCAnY3JlYXRlRWxlbWVudCcpLmFuZC5jYWxsRmFrZSgoZWxlbWVudCkgPT5cbiAgICAgICAgZWxlbWVudCA9PT0gJ2lmcmFtZScgPyBpZnJhbWVTdHViIDogbWV0YVN0dWJcbiAgICAgICk7XG4gICAgICBjb25zdCBvbkxvYWQgPSBqZXN0LmZuKCk7XG4gICAgICBzcHlPbihDb25uZWN0LCAnaW5pdFBvc3RNZXNzYWdlJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcbiAgICAgIENvbm5lY3QubGF1bmNoKHVybCwge1xuICAgICAgICBvbkRvbmU6ICgpID0+IHt9LFxuICAgICAgICBvbkVycm9yOiAoKSA9PiB7fSxcbiAgICAgICAgb25DYW5jZWw6ICgpID0+IHt9LFxuICAgICAgICBvbkxvYWQsXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgJ21ldGFbbmFtZT1cInZpZXdwb3J0XCJdJ1xuICAgICAgKTtcbiAgICAgIGV4cGVjdChkb2N1bWVudC5jcmVhdGVFbGVtZW50KS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnbWV0YScpO1xuICAgICAgZXhwZWN0KG1ldGFTdHViLnNldEF0dHJpYnV0ZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoJ25hbWUnLCAndmlld3BvcnQnKTtcbiAgICAgIGV4cGVjdChtZXRhU3R1Yi5zZXRBdHRyaWJ1dGUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKFxuICAgICAgICAnY29udGVudCcsXG4gICAgICAgICdpbml0aWFsLXNjYWxlPTEnXG4gICAgICApO1xuICAgICAgZXhwZWN0KGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKG1ldGFTdHViKTtcblxuICAgICAgZXhwZWN0KGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCdpZnJhbWUnKTtcbiAgICAgIGV4cGVjdChpZnJhbWVTdHViLnNyYykudG9CZSh1cmwpO1xuICAgICAgZXhwZWN0KGlmcmFtZVN0dWIuc2V0QXR0cmlidXRlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnaWQnLCBJRlJBTUVfSUQpO1xuICAgICAgZXhwZWN0KGlmcmFtZVN0dWIuc2V0QXR0cmlidXRlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnZnJhbWVib3JkZXInLCAnMCcpO1xuICAgICAgZXhwZWN0KGlmcmFtZVN0dWIuc2V0QXR0cmlidXRlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnc2Nyb2xsaW5nJywgJ25vJyk7XG5cbiAgICAgIGV4cGVjdChkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChpZnJhbWVTdHViKTtcbiAgICAgIGlmcmFtZVN0dWIub25sb2FkKCk7XG4gICAgICBleHBlY3QoQ29ubmVjdC5pbml0UG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHt9KTtcbiAgICAgIGV4cGVjdChvbkxvYWQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBoYW5kbGUgaWZyYW1lIHNjZW5hcmlvIHdpdGggY3VzdG9tIG92ZXJsYXkgYW5kIGNvbnRhaW5lcicsICgpID0+IHtcbiAgICAgIGNvbnN0IG1vY2tDb250YWluZXIgPSB7IGFwcGVuZENoaWxkOiBqZXN0LmZuKCkgfTtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7IG92ZXJsYXk6ICdncmF5Jywgc2VsZWN0b3I6ICcjY29udGFpbmVyJyB9O1xuICAgICAgc3B5T24oZG9jdW1lbnQsICdxdWVyeVNlbGVjdG9yQWxsJykuYW5kLmNhbGxUaHJvdWdoKCk7XG4gICAgICBzcHlPbihkb2N1bWVudCwgJ3F1ZXJ5U2VsZWN0b3InKS5hbmQucmV0dXJuVmFsdWUobW9ja0NvbnRhaW5lcik7XG4gICAgICBjb25zdCBpZnJhbWVTdHViOiBhbnkgPSB7XG4gICAgICAgIHBhcmVudE5vZGU6IHsgcmVtb3ZlQ2hpbGQ6IGplc3QuZm4oKSB9LFxuICAgICAgICBzZXRBdHRyaWJ1dGU6IGplc3QuZm4oKSxcbiAgICAgIH07XG4gICAgICBjb25zdCBtZXRhU3R1YjogYW55ID0ge1xuICAgICAgICBwYXJlbnROb2RlOiB7IHJlbW92ZUNoaWxkOiBqZXN0LmZuKCkgfSxcbiAgICAgICAgc2V0QXR0cmlidXRlOiBqZXN0LmZuKCksXG4gICAgICB9O1xuICAgICAgc3B5T24oZG9jdW1lbnQuaGVhZCwgJ2FwcGVuZENoaWxkJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcbiAgICAgIHNweU9uKGRvY3VtZW50LmJvZHksICdhcHBlbmRDaGlsZCcpLmFuZC5jYWxsRmFrZSgoKSA9PiB7fSk7XG4gICAgICBzcHlPbih3aW5kb3cuZG9jdW1lbnQsICdjcmVhdGVFbGVtZW50JykuYW5kLmNhbGxGYWtlKChlbGVtZW50KSA9PlxuICAgICAgICBlbGVtZW50ID09PSAnaWZyYW1lJyA/IGlmcmFtZVN0dWIgOiBtZXRhU3R1YlxuICAgICAgKTtcbiAgICAgIGNvbnN0IG9uTG9hZCA9IGplc3QuZm4oKTtcbiAgICAgIHNweU9uKENvbm5lY3QsICdpbml0UG9zdE1lc3NhZ2UnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuICAgICAgQ29ubmVjdC5sYXVuY2goXG4gICAgICAgIHVybCxcbiAgICAgICAgeyBvbkRvbmU6ICgpID0+IHt9LCBvbkVycm9yOiAoKSA9PiB7fSwgb25DYW5jZWw6ICgpID0+IHt9LCBvbkxvYWQgfSxcbiAgICAgICAgb3B0aW9uc1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KGlmcmFtZVN0dWIuc2V0QXR0cmlidXRlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgJ3N0eWxlJyxcbiAgICAgICAgJ2JhY2tncm91bmQ6IGdyYXk7J1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCcjY29udGFpbmVyJyk7XG4gICAgICBleHBlY3QobW9ja0NvbnRhaW5lci5hcHBlbmRDaGlsZCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoaWZyYW1lU3R1Yik7XG5cbiAgICAgIGlmcmFtZVN0dWIub25sb2FkKCk7XG4gICAgICBleHBlY3QoQ29ubmVjdC5pbml0UG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKG9wdGlvbnMpO1xuICAgICAgZXhwZWN0KG9uTG9hZCkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGhhbmRsZSBpZnJhbWUgc2NlbmFyaW8gd2l0aCBjdXN0b20gY29udGFpbmVyIGFzIG5vZGUnLCAoKSA9PiB7XG4gICAgICBjb25zdCBtb2NrQ29udGFpbmVyID0geyBhcHBlbmRDaGlsZDogamVzdC5mbigpIH0gYXMgYW55O1xuICAgICAgY29uc3Qgb3B0aW9ucyA9IHsgbm9kZTogbW9ja0NvbnRhaW5lciB9O1xuICAgICAgY29uc3QgaWZyYW1lU3R1YjogYW55ID0ge1xuICAgICAgICBwYXJlbnROb2RlOiB7IHJlbW92ZUNoaWxkOiBqZXN0LmZuKCkgfSxcbiAgICAgICAgc2V0QXR0cmlidXRlOiBqZXN0LmZuKCksXG4gICAgICB9O1xuICAgICAgY29uc3QgbWV0YVN0dWI6IGFueSA9IHtcbiAgICAgICAgcGFyZW50Tm9kZTogeyByZW1vdmVDaGlsZDogamVzdC5mbigpIH0sXG4gICAgICAgIHNldEF0dHJpYnV0ZTogamVzdC5mbigpLFxuICAgICAgfTtcbiAgICAgIHNweU9uKGRvY3VtZW50LmhlYWQsICdhcHBlbmRDaGlsZCcpLmFuZC5jYWxsRmFrZSgoKSA9PiB7fSk7XG4gICAgICBzcHlPbih3aW5kb3cuZG9jdW1lbnQsICdjcmVhdGVFbGVtZW50JykuYW5kLmNhbGxGYWtlKChlbGVtZW50KSA9PlxuICAgICAgICBlbGVtZW50ID09PSAnaWZyYW1lJyA/IGlmcmFtZVN0dWIgOiBtZXRhU3R1YlxuICAgICAgKTtcbiAgICAgIGNvbnN0IG9uTG9hZCA9IGplc3QuZm4oKTtcbiAgICAgIHNweU9uKENvbm5lY3QsICdpbml0UG9zdE1lc3NhZ2UnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuICAgICAgQ29ubmVjdC5sYXVuY2goXG4gICAgICAgIHVybCxcbiAgICAgICAgeyBvbkRvbmU6ICgpID0+IHt9LCBvbkVycm9yOiAoKSA9PiB7fSwgb25DYW5jZWw6ICgpID0+IHt9LCBvbkxvYWQgfSxcbiAgICAgICAgb3B0aW9uc1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KG1vY2tDb250YWluZXIuYXBwZW5kQ2hpbGQpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKGlmcmFtZVN0dWIpO1xuXG4gICAgICBpZnJhbWVTdHViLm9ubG9hZCgpO1xuICAgICAgZXhwZWN0KENvbm5lY3QuaW5pdFBvc3RNZXNzYWdlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChvcHRpb25zKTtcbiAgICAgIGV4cGVjdChvbkxvYWQpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICB9KTtcblxuICAgIHRlc3QoXCJzaG91bGQgbG9nIHdhcm5pbmcgYW5kIGFwcGVuZCBpZnJhbWUgdG8gYm9keSBpZiBzZWxlY3RvciBkb2Vzbid0IHJldHVybiBhbiBlbGVtZW50XCIsICgpID0+IHtcbiAgICAgIHNweU9uKGNvbnNvbGUsICd3YXJuJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB7IHNlbGVjdG9yOiAnI2NvbnRhaW5lcicgfTtcbiAgICAgIHNweU9uKGRvY3VtZW50LCAncXVlcnlTZWxlY3RvckFsbCcpLmFuZC5jYWxsVGhyb3VnaCgpO1xuICAgICAgc3B5T24oZG9jdW1lbnQsICdxdWVyeVNlbGVjdG9yJykuYW5kLnJldHVyblZhbHVlKHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBpZnJhbWVTdHViOiBhbnkgPSB7XG4gICAgICAgIHBhcmVudE5vZGU6IHsgcmVtb3ZlQ2hpbGQ6IGplc3QuZm4oKSB9LFxuICAgICAgICBzZXRBdHRyaWJ1dGU6IGplc3QuZm4oKSxcbiAgICAgIH07XG4gICAgICBjb25zdCBtZXRhU3R1YjogYW55ID0ge1xuICAgICAgICBwYXJlbnROb2RlOiB7IHJlbW92ZUNoaWxkOiBqZXN0LmZuKCkgfSxcbiAgICAgICAgc2V0QXR0cmlidXRlOiBqZXN0LmZuKCksXG4gICAgICB9O1xuICAgICAgc3B5T24oZG9jdW1lbnQuaGVhZCwgJ2FwcGVuZENoaWxkJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcbiAgICAgIHNweU9uKGRvY3VtZW50LmJvZHksICdhcHBlbmRDaGlsZCcpLmFuZC5jYWxsRmFrZSgoKSA9PiB7fSk7XG4gICAgICBzcHlPbih3aW5kb3cuZG9jdW1lbnQsICdjcmVhdGVFbGVtZW50JykuYW5kLmNhbGxGYWtlKChlbGVtZW50KSA9PlxuICAgICAgICBlbGVtZW50ID09PSAnaWZyYW1lJyA/IGlmcmFtZVN0dWIgOiBtZXRhU3R1YlxuICAgICAgKTtcbiAgICAgIGNvbnN0IG9uTG9hZCA9IGplc3QuZm4oKTtcbiAgICAgIHNweU9uKENvbm5lY3QsICdpbml0UG9zdE1lc3NhZ2UnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuICAgICAgQ29ubmVjdC5sYXVuY2goXG4gICAgICAgIHVybCxcbiAgICAgICAgeyBvbkRvbmU6ICgpID0+IHt9LCBvbkVycm9yOiAoKSA9PiB7fSwgb25DYW5jZWw6ICgpID0+IHt9LCBvbkxvYWQgfSxcbiAgICAgICAgb3B0aW9uc1xuICAgICAgKTtcblxuICAgICAgZXhwZWN0KGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKCcjY29udGFpbmVyJyk7XG4gICAgICBleHBlY3QoZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCkudG9IYXZlQmVlbkNhbGxlZFdpdGgoaWZyYW1lU3R1Yik7XG4gICAgICBleHBlY3QoY29uc29sZS53YXJuKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgYENvdWxkbid0IGZpbmQgYW55IGVsZW1lbnRzIG1hdGNoaW5nIFwiJHtvcHRpb25zLnNlbGVjdG9yfVwiLCBhcHBlbmRpbmcgXCJpZnJhbWVcIiB0byBcImJvZHlcIiBpbnN0ZWFkLmBcbiAgICAgICk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgdGhyb3cgZXJyb3IgaWYgbGF1bmNoIGlzIGNhbGxlZCBhZ2FpbiBiZWZvcmUgY2FsbGluZyBkZXN0cm95JywgKCkgPT4ge1xuICAgICAgQ29ubmVjdC5sYXVuY2godXJsLCB7XG4gICAgICAgIG9uRG9uZTogKCkgPT4ge30sXG4gICAgICAgIG9uRXJyb3I6ICgpID0+IHt9LFxuICAgICAgICBvbkNhbmNlbDogKCkgPT4ge30sXG4gICAgICB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIENvbm5lY3QubGF1bmNoKHVybCwge1xuICAgICAgICAgIG9uRG9uZTogKCkgPT4ge30sXG4gICAgICAgICAgb25FcnJvcjogKCkgPT4ge30sXG4gICAgICAgICAgb25DYW5jZWw6ICgpID0+IHt9LFxuICAgICAgICB9KTtcbiAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICBleHBlY3QoZS5tZXNzYWdlKS50b0JlKFxuICAgICAgICAgICdZb3UgbXVzdCBkZXN0cm95IHRoZSBpZnJhbWUgYmVmb3JlIHlvdSBjYW4gb3BlbiBhIG5ldyBvbmUuIENhbGwgXCJkZXN0cm95KClcIidcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG5cbiAgZGVzY3JpYmUoJ2luaXRQb3N0TWVzc2FnZScsICgpID0+IHtcbiAgICB0ZXN0KCdzaG91bGQgY2FsbCBwb3N0TWVzc2FnZSBldmVyeSBzZWNvbmQgd2l0aCB0aGUgZXhwZWN0ZWQgcGFyYW1ldGVycyBhbmQgYXR0YWNoIHBvc3RNZXNzYWdlIGV2ZW50IGhhbmRsZXInLCAoKSA9PiB7XG4gICAgICBzcHlPbih3aW5kb3csICdzZXRJbnRlcnZhbCcpLmFuZC5jYWxsVGhyb3VnaCgpO1xuICAgICAgc3B5T24oQ29ubmVjdCwgJ3Bvc3RNZXNzYWdlJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcblxuICAgICAgQ29ubmVjdC5pbml0UG9zdE1lc3NhZ2UoeyBzZWxlY3RvcjogJyNjb250YWluZXInIH0pO1xuICAgICAgamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDExMDApO1xuICAgICAgZXhwZWN0KENvbm5lY3QucG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgdHlwZTogUElOR19FVkVOVCxcbiAgICAgICAgc2VsZWN0b3I6ICcjY29udGFpbmVyJyxcbiAgICAgICAgc2RrVmVyc2lvbjogQ09OTkVDVF9TREtfVkVSU0lPTixcbiAgICAgICAgcGxhdGZvcm06IFBMQVRGT1JNX0lGUkFNRSxcbiAgICAgIH0pO1xuXG4gICAgICBDb25uZWN0LmluaXRQb3N0TWVzc2FnZSh7IHBvcHVwOiB0cnVlIH0pO1xuICAgICAgamVzdC5hZHZhbmNlVGltZXJzQnlUaW1lKDExMDApO1xuICAgICAgZXhwZWN0KENvbm5lY3QucG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgdHlwZTogUElOR19FVkVOVCxcbiAgICAgICAgc2VsZWN0b3I6IHVuZGVmaW5lZCxcbiAgICAgICAgc2RrVmVyc2lvbjogQ09OTkVDVF9TREtfVkVSU0lPTixcbiAgICAgICAgcGxhdGZvcm06IFBMQVRGT1JNX1BPUFVQLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgY2FsbCBhdHRhY2ggcG9zdE1lc3NhZ2UgZXZlbnQgaGFuZGxlciBhbmQgc2VuZCBldmVudHMgYXMgZXhwZWN0ZWQnLCAoKSA9PiB7XG4gICAgICBsZXQgZXZlbnRIYW5kbGVyO1xuICAgICAgbGV0IHBvcHVwTW9jayA9IHsgY2xvc2U6IGplc3QuZm4oKSwgZm9jdXM6IGplc3QuZm4oKSB9O1xuICAgICAgc3B5T24od2luZG93LCAnb3BlbicpLmFuZC5jYWxsRmFrZShqZXN0LmZuKCkubW9ja1JldHVyblZhbHVlKHBvcHVwTW9jaykpO1xuICAgICAgc3B5T24od2luZG93LCAnYWRkRXZlbnRMaXN0ZW5lcicpLmFuZC5jYWxsRmFrZShcbiAgICAgICAgKGV2ZW50VHlwZSwgZWgpID0+IChldmVudEhhbmRsZXIgPSBlaClcbiAgICAgICk7XG4gICAgICBjb25zdCBldmVudEhhbmRsZXJzID0ge1xuICAgICAgICBvbkRvbmU6IGplc3QuZm4oKSxcbiAgICAgICAgb25FcnJvcjogamVzdC5mbigpLFxuICAgICAgICBvbkNhbmNlbDogamVzdC5mbigpLFxuICAgICAgfTtcbiAgICAgIENvbm5lY3QubGF1bmNoKHVybCwgZXZlbnRIYW5kbGVycyk7XG4gICAgICBDb25uZWN0LmluaXRQb3N0TWVzc2FnZSh7IHNlbGVjdG9yOiAnI2NvbnRhaW5lcicgfSk7XG5cbiAgICAgIGV4cGVjdCh3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgc3B5T24od2luZG93LCAnY2xlYXJJbnRlcnZhbCcpO1xuICAgICAgZXZlbnRIYW5kbGVyKHsgb3JpZ2luOiB1cmwsIGRhdGE6IHsgdHlwZTogQUNLX0VWRU5UIH0gfSk7XG4gICAgICBleHBlY3Qod2luZG93LmNsZWFySW50ZXJ2YWwpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcblxuICAgICAgc3B5T24oQ29ubmVjdCwgJ29wZW5Qb3B1cFdpbmRvdycpLmFuZC5jYWxsVGhyb3VnaCgpO1xuICAgICAgc3B5T24oQ29ubmVjdCwgJ2Rlc3Ryb3knKTtcbiAgICAgIGV2ZW50SGFuZGxlcih7XG4gICAgICAgIG9yaWdpbjogdXJsLFxuICAgICAgICBkYXRhOiB7IHR5cGU6IFVSTF9FVkVOVCwgdXJsOiAnaHR0cDovL29hdXRoLmNvbScgfSxcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KENvbm5lY3Qub3BlblBvcHVwV2luZG93KS50b0hhdmVCZWVuQ2FsbGVkV2l0aCgnaHR0cDovL29hdXRoLmNvbScpO1xuXG4gICAgICBjb25zdCBwYXlsb2FkID0geyB0ZXN0OiB0cnVlIH07XG4gICAgICBldmVudEhhbmRsZXIoeyBvcmlnaW46IHVybCwgZGF0YTogeyB0eXBlOiBET05FX0VWRU5ULCBkYXRhOiBwYXlsb2FkIH0gfSk7XG4gICAgICBleHBlY3QoZXZlbnRIYW5kbGVycy5vbkRvbmUpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBheWxvYWQpO1xuICAgICAgZXhwZWN0KENvbm5lY3QuZGVzdHJveSkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDEpO1xuXG4gICAgICBldmVudEhhbmRsZXIoe1xuICAgICAgICBvcmlnaW46IHVybCxcbiAgICAgICAgZGF0YTogeyB0eXBlOiBDQU5DRUxfRVZFTlQsIGRhdGE6IHBheWxvYWQgfSxcbiAgICAgIH0pO1xuICAgICAgZXhwZWN0KGV2ZW50SGFuZGxlcnMub25DYW5jZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBheWxvYWQpO1xuICAgICAgZXhwZWN0KENvbm5lY3QuZGVzdHJveSkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDIpO1xuXG4gICAgICBldmVudEhhbmRsZXIoeyBvcmlnaW46IHVybCwgZGF0YTogeyB0eXBlOiBFUlJPUl9FVkVOVCwgZGF0YTogcGF5bG9hZCB9IH0pO1xuICAgICAgZXhwZWN0KGV2ZW50SGFuZGxlcnMub25DYW5jZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBheWxvYWQpO1xuICAgICAgZXhwZWN0KENvbm5lY3QuZGVzdHJveSkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDMpO1xuXG4gICAgICBldmVudEhhbmRsZXIoeyBvcmlnaW46IHVybCwgZGF0YTogeyB0eXBlOiBST1VURV9FVkVOVCwgZGF0YTogcGF5bG9hZCB9IH0pO1xuICAgICAgZXhwZWN0KGV2ZW50SGFuZGxlcnMub25DYW5jZWwpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHBheWxvYWQpO1xuICAgICAgZXhwZWN0KENvbm5lY3QuZGVzdHJveSkudG9IYXZlQmVlbkNhbGxlZFRpbWVzKDMpO1xuXG4gICAgICBldmVudEhhbmRsZXIoeyBvcmlnaW46IHVybCwgZGF0YTogeyB0eXBlOiBVU0VSX0VWRU5ULCBkYXRhOiBwYXlsb2FkIH0gfSk7XG4gICAgICBleHBlY3QoZXZlbnRIYW5kbGVycy5vbkNhbmNlbCkudG9IYXZlQmVlbkNhbGxlZFdpdGgocGF5bG9hZCk7XG4gICAgICBleHBlY3QoQ29ubmVjdC5kZXN0cm95KS50b0hhdmVCZWVuQ2FsbGVkVGltZXMoMyk7XG5cbiAgICAgIGV2ZW50SGFuZGxlcih7XG4gICAgICAgIG9yaWdpbjogdXJsLFxuICAgICAgICBkYXRhOiB7IHR5cGU6IENMT1NFX1BPUFVQX0VWRU5ULCBkYXRhOiBwYXlsb2FkIH0sXG4gICAgICB9KTtcbiAgICAgIGV4cGVjdChwb3B1cE1vY2suY2xvc2UpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGV4cGVjdChDb25uZWN0LmRlc3Ryb3kpLnRvSGF2ZUJlZW5DYWxsZWRUaW1lcygzKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBjYWxsIGF0dGFjaCBwb3N0TWVzc2FnZSBldmVudCBoYW5kbGVyIGFuZCBwaW5nIENvbm5lY3QgaW5kZWZpbml0ZWx5IGZvciBwb3B1cCBzY2VuYXJpbycsICgpID0+IHtcbiAgICAgIGxldCBldmVudEhhbmRsZXI7XG4gICAgICBzcHlPbih3aW5kb3csICdvcGVuJykuYW5kLmNhbGxGYWtlKCgpID0+IG1vY2tXaW5kb3cpO1xuICAgICAgc3B5T24od2luZG93LCAnYWRkRXZlbnRMaXN0ZW5lcicpLmFuZC5jYWxsRmFrZShcbiAgICAgICAgKGV2ZW50VHlwZSwgZWgpID0+IChldmVudEhhbmRsZXIgPSBlaClcbiAgICAgICk7XG4gICAgICBjb25zdCBldmVudEhhbmRsZXJzID0ge1xuICAgICAgICBvbkRvbmU6IGplc3QuZm4oKSxcbiAgICAgICAgb25FcnJvcjogamVzdC5mbigpLFxuICAgICAgICBvbkNhbmNlbDogamVzdC5mbigpLFxuICAgICAgfTtcbiAgICAgIENvbm5lY3QubGF1bmNoKHVybCwgZXZlbnRIYW5kbGVycywgeyBwb3B1cDogdHJ1ZSB9KTtcbiAgICAgIENvbm5lY3QuaW5pdFBvc3RNZXNzYWdlKHsgcG9wdXA6IHRydWUgfSk7XG5cbiAgICAgIGV4cGVjdCh3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcikudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgc3B5T24od2luZG93LCAnY2xlYXJJbnRlcnZhbCcpO1xuICAgICAgZXZlbnRIYW5kbGVyKHsgb3JpZ2luOiB1cmwsIGRhdGE6IHsgdHlwZTogQUNLX0VWRU5UIH0gfSk7XG4gICAgICBleHBlY3Qod2luZG93LmNsZWFySW50ZXJ2YWwpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgfSk7XG4gIH0pO1xuXG4gIGRlc2NyaWJlKCdvcGVuUG9wdXBXaW5kb3cnLCAoKSA9PiB7XG4gICAgdGVzdChcInNob3VsZCBvcGVuIHBvcHVwIHdpbmRvdywgZm9jdXMgb24gaXQgYW5kIHBlcmlvZGljYWxseSB3YXRjaCBpZiBpdCdzIHN0aWxsIG9wZW5cIiwgKCkgPT4ge1xuICAgICAgc3B5T24od2luZG93LCAnb3BlbicpLmFuZC5jYWxsRmFrZSgoKSA9PiBtb2NrV2luZG93KTtcbiAgICAgIHNweU9uKHdpbmRvdywgJ3NldEludGVydmFsJyk7XG4gICAgICBzcHlPbih3aW5kb3csICdjbGVhckludGVydmFsJyk7XG4gICAgICBzcHlPbihDb25uZWN0LCAncG9zdE1lc3NhZ2UnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuXG4gICAgICBDb25uZWN0Lm9wZW5Qb3B1cFdpbmRvdyh1cmwpO1xuICAgICAgZXhwZWN0KHdpbmRvdy5vcGVuKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgdXJsLFxuICAgICAgICAndGFyZ2V0V2luZG93JyxcbiAgICAgICAgYHRvb2xiYXI9bm8sbG9jYXRpb249bm8sc3RhdHVzPW5vLG1lbnViYXI9bm8sd2lkdGg9JHtQT1BVUF9XSURUSH0saGVpZ2h0PSR7UE9QVVBfSEVJR0hUfSx0b3A9ODQsbGVmdD0yMTJgXG4gICAgICApO1xuICAgICAgZXhwZWN0KG1vY2tXaW5kb3cuZm9jdXMpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGV4cGVjdCh3aW5kb3cuc2V0SW50ZXJ2YWwpLnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICAgIGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgxMTAwKTtcbiAgICAgIGV4cGVjdCh3aW5kb3cuY2xlYXJJbnRlcnZhbCkubm90LnRvSGF2ZUJlZW5DYWxsZWQoKTtcbiAgICB9KTtcblxuICAgIHRlc3QoJ3Nob3VsZCBjYWxsIHBvc3RNZXNzYWdlIHdoZW4gdGhlIHBvcHVwIGlzIGNsb3NlZCcsICgpID0+IHtcbiAgICAgIG1vY2tXaW5kb3cuY2xvc2VkID0gdHJ1ZTtcbiAgICAgIHNweU9uKHdpbmRvdywgJ29wZW4nKS5hbmQuY2FsbEZha2UoKCkgPT4gbW9ja1dpbmRvdyk7XG4gICAgICBzcHlPbih3aW5kb3csICdzZXRJbnRlcnZhbCcpLmFuZC5jYWxsVGhyb3VnaCgpO1xuICAgICAgc3B5T24od2luZG93LCAnY2xlYXJJbnRlcnZhbCcpO1xuICAgICAgc3B5T24oQ29ubmVjdCwgJ3Bvc3RNZXNzYWdlJykuYW5kLmNhbGxGYWtlKCgpID0+IHt9KTtcblxuICAgICAgQ29ubmVjdC5vcGVuUG9wdXBXaW5kb3codXJsKTtcbiAgICAgIGV4cGVjdCh3aW5kb3cub3BlbikudG9IYXZlQmVlbkNhbGxlZFdpdGgoXG4gICAgICAgIHVybCxcbiAgICAgICAgJ3RhcmdldFdpbmRvdycsXG4gICAgICAgIGB0b29sYmFyPW5vLGxvY2F0aW9uPW5vLHN0YXR1cz1ubyxtZW51YmFyPW5vLHdpZHRoPSR7UE9QVVBfV0lEVEh9LGhlaWdodD0ke1BPUFVQX0hFSUdIVH0sdG9wPTg0LGxlZnQ9MjEyYFxuICAgICAgKTtcbiAgICAgIGV4cGVjdChtb2NrV2luZG93LmZvY3VzKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBleHBlY3Qod2luZG93LnNldEludGVydmFsKS50b0hhdmVCZWVuQ2FsbGVkKCk7XG5cbiAgICAgIGplc3QuYWR2YW5jZVRpbWVyc0J5VGltZSgxMTAwKTtcbiAgICAgIGV4cGVjdCh3aW5kb3cuY2xlYXJJbnRlcnZhbCkudG9IYXZlQmVlbkNhbGxlZCgpO1xuICAgICAgZXhwZWN0KENvbm5lY3QucG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKHtcbiAgICAgICAgdHlwZTogV0lORE9XX0VWRU5ULFxuICAgICAgICBjbG9zZWQ6IHRydWUsXG4gICAgICAgIGJsb2NrZWQ6IGZhbHNlLFxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0ZXN0KCdzaG91bGQgbGV0IENvbm5lY3Qga25vdyBpZiB0aGUgcG9wdXAgd2FzIGJsb2NrZWQnLCAoKSA9PiB7XG4gICAgICBzcHlPbih3aW5kb3csICdvcGVuJykuYW5kLmNhbGxGYWtlKCgpID0+IHVuZGVmaW5lZCk7XG4gICAgICBzcHlPbihDb25uZWN0LCAncG9zdE1lc3NhZ2UnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuXG4gICAgICBDb25uZWN0Lm9wZW5Qb3B1cFdpbmRvdyh1cmwpO1xuICAgICAgZXhwZWN0KHdpbmRvdy5vcGVuKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgdXJsLFxuICAgICAgICAndGFyZ2V0V2luZG93JyxcbiAgICAgICAgYHRvb2xiYXI9bm8sbG9jYXRpb249bm8sc3RhdHVzPW5vLG1lbnViYXI9bm8sd2lkdGg9JHtQT1BVUF9XSURUSH0saGVpZ2h0PSR7UE9QVVBfSEVJR0hUfSx0b3A9ODQsbGVmdD0yMTJgXG4gICAgICApO1xuICAgICAgZXhwZWN0KG1vY2tXaW5kb3cuZm9jdXMpLm5vdC50b0hhdmVCZWVuQ2FsbGVkKCk7XG4gICAgICBleHBlY3QoQ29ubmVjdC5wb3N0TWVzc2FnZSkudG9IYXZlQmVlbkNhbGxlZFdpdGgoe1xuICAgICAgICB0eXBlOiBXSU5ET1dfRVZFTlQsXG4gICAgICAgIGNsb3NlZDogdHJ1ZSxcbiAgICAgICAgYmxvY2tlZDogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcblxuICBkZXNjcmliZSgncG9zdE1lc3NhZ2UnLCAoKSA9PiB7XG4gICAgdGVzdCgnc2hvdWxkIGNhbGwgcG9zdE1lc3NhZ2Ugb24gKGlmcmFtZSknLCAoKSA9PiB7XG4gICAgICBjb25zdCBpZnJhbWVTdHViOiBhbnkgPSB7XG4gICAgICAgIHBhcmVudE5vZGU6IHsgcmVtb3ZlQ2hpbGQ6IGplc3QuZm4oKSB9LFxuICAgICAgICBzZXRBdHRyaWJ1dGU6IGplc3QuZm4oKSxcbiAgICAgICAgY29udGVudFdpbmRvdzogeyBwb3N0TWVzc2FnZTogamVzdC5mbigpIH0sXG4gICAgICB9O1xuICAgICAgY29uc3QgbWV0YVN0dWI6IGFueSA9IHtcbiAgICAgICAgcGFyZW50Tm9kZTogeyByZW1vdmVDaGlsZDogamVzdC5mbigpIH0sXG4gICAgICAgIHNldEF0dHJpYnV0ZTogamVzdC5mbigpLFxuICAgICAgfTtcbiAgICAgIHNweU9uKGRvY3VtZW50LmhlYWQsICdhcHBlbmRDaGlsZCcpLmFuZC5jYWxsRmFrZSgoKSA9PiB7fSk7XG4gICAgICBzcHlPbihkb2N1bWVudC5ib2R5LCAnYXBwZW5kQ2hpbGQnKS5hbmQuY2FsbEZha2UoKCkgPT4ge30pO1xuICAgICAgc3B5T24od2luZG93LmRvY3VtZW50LCAnY3JlYXRlRWxlbWVudCcpLmFuZC5jYWxsRmFrZSgoZWxlbWVudCkgPT5cbiAgICAgICAgZWxlbWVudCA9PT0gJ2lmcmFtZScgPyBpZnJhbWVTdHViIDogbWV0YVN0dWJcbiAgICAgICk7XG4gICAgICBDb25uZWN0LmxhdW5jaCh1cmwsIHtcbiAgICAgICAgb25Eb25lOiAoKSA9PiB7fSxcbiAgICAgICAgb25FcnJvcjogKCkgPT4ge30sXG4gICAgICAgIG9uQ2FuY2VsOiAoKSA9PiB7fSxcbiAgICAgIH0pO1xuICAgICAgaWZyYW1lU3R1Yi5vbmxvYWQoKTtcbiAgICAgIGNvbnN0IGRhdGEgPSB7IHRlc3Q6IHRydWUgfTtcbiAgICAgIENvbm5lY3QucG9zdE1lc3NhZ2UoZGF0YSk7XG4gICAgICBleHBlY3QoaWZyYW1lU3R1Yi5jb250ZW50V2luZG93LnBvc3RNZXNzYWdlKS50b0hhdmVCZWVuQ2FsbGVkV2l0aChcbiAgICAgICAgZGF0YSxcbiAgICAgICAgdXJsXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgdGVzdCgnc2hvdWxkIGNhbGwgcG9zdE1lc3NhZ2Ugb24gKHBvcHVwKScsICgpID0+IHtcbiAgICAgIHNweU9uKHdpbmRvdywgJ29wZW4nKS5hbmQucmV0dXJuVmFsdWUobW9ja1dpbmRvdyk7XG4gICAgICBDb25uZWN0LmxhdW5jaChcbiAgICAgICAgdXJsLFxuICAgICAgICB7IG9uRG9uZTogKCkgPT4ge30sIG9uRXJyb3I6ICgpID0+IHt9LCBvbkNhbmNlbDogKCkgPT4ge30gfSxcbiAgICAgICAgeyBwb3B1cDogdHJ1ZSB9XG4gICAgICApO1xuXG4gICAgICBjb25zdCBkYXRhID0geyB0ZXN0OiB0cnVlIH07XG4gICAgICBDb25uZWN0LnBvc3RNZXNzYWdlKGRhdGEpO1xuICAgICAgZXhwZWN0KG1vY2tXaW5kb3cucG9zdE1lc3NhZ2UpLnRvSGF2ZUJlZW5DYWxsZWRXaXRoKGRhdGEsIHVybCk7XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iXSwibWFwcGluZ3MiOiI7O0FBQUEsSUFBQUEsTUFBQSxHQUFBQyxPQUFBO0FBRUEsSUFBQUMsVUFBQSxHQUFBRCxPQUFBO0FBc0JBLElBQU1FLG1CQUFtQixHQUFHO0VBQzFCQyxLQUFLLEVBQUVDLCtCQUFvQjtFQUMzQkMsTUFBTSxFQUFFQyw4QkFBbUI7RUFDM0JDLEdBQUcsRUFDREMsTUFBTSxDQUFDRCxHQUFHLENBQUNFLFdBQVcsR0FBRyxDQUFDLEdBQUdELE1BQU0sQ0FBQ0QsR0FBRyxDQUFDRyxPQUFPLEdBQUdOLCtCQUFvQixHQUFHLENBQUM7RUFDNUVPLElBQUksRUFDRkgsTUFBTSxDQUFDRCxHQUFHLENBQUNLLFVBQVUsR0FBRyxDQUFDLEdBQUdKLE1BQU0sQ0FBQ0QsR0FBRyxDQUFDTSxPQUFPLEdBQUdQLDhCQUFtQixHQUFHO0FBQzNFLENBQUM7QUFFRCxJQUFNUSxHQUFHLEdBQUcsaUJBQWlCO0FBQzdCQyxRQUFRLENBQUMsU0FBUyxFQUFFLFlBQU07RUFDeEIsSUFBSUMsVUFBVTtFQUNkQyxVQUFVLENBQUMsWUFBTTtJQUNmRCxVQUFVLEdBQUc7TUFDWEUsS0FBSyxFQUFFQyxJQUFJLENBQUNDLEVBQUUsQ0FBQyxDQUFDO01BQ2hCQyxLQUFLLEVBQUVGLElBQUksQ0FBQ0MsRUFBRSxDQUFD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