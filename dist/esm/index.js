var __defProp = Object.defineProperty;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

// src/constants.ts
var IFRAME_ID = "connectIframe";
var STYLES_ID = "connectStyles";
var PLATFORM_IFRAME = "iframe";
var PLATFORM_POPUP = "web";
var CONNECT_SDK_VERSION = "PACKAGE_VERSION";
var POPUP_WIDTH = 600;
var POPUP_HEIGHT = 600;
var CONNECT_POPUP_WIDTH = 520;
var CONNECT_POPUP_HEIGHT = 720;
var ACK_EVENT = "ack";
var CANCEL_EVENT = "cancel";
var URL_EVENT = "url";
var DONE_EVENT = "done";
var ERROR_EVENT = "error";
var PING_EVENT = "ping";
var WINDOW_EVENT = "window";
var ROUTE_EVENT = "route";
var USER_EVENT = "user";
var CLOSE_POPUP_EVENT = "closePopup";

// src/index.ts
var evHandlers;
var onMessageFn;
var connectUrl;
var iframe;
var metaEl;
var targetWindow;
var connectOrigin;
var popupWindow;
var defaultEventHandlers = {
  onLoad: () => {
  },
  onUser: (event) => {
  },
  onRoute: (event) => {
  }
};
var Connect = {
  destroy() {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    if (metaEl && metaEl.parentNode) {
      metaEl.parentNode.removeChild(metaEl);
    }
    if (!iframe && targetWindow) {
      targetWindow.close();
    }
    iframe = void 0;
    metaEl = void 0;
    window.removeEventListener("message", onMessageFn);
  },
  launch(url, eventHandlers, options = {}) {
    connectUrl = url;
    evHandlers = __spreadValues(__spreadValues({}, defaultEventHandlers), eventHandlers);
    connectOrigin = new URL(connectUrl).origin;
    if (options.popup) {
      const defaultPopupOptions = {
        toolbar: "no",
        location: "no",
        status: "no",
        menubar: "no",
        width: CONNECT_POPUP_HEIGHT,
        height: CONNECT_POPUP_WIDTH,
        top: window.self.outerHeight / 2 + window.self.screenY - CONNECT_POPUP_HEIGHT / 2,
        left: window.self.outerWidth / 2 + window.self.screenX - CONNECT_POPUP_WIDTH / 2
      };
      const popupOptions = __spreadValues(__spreadValues({}, defaultPopupOptions), options.popupOptions);
      const popupWindow2 = window.open(
        connectUrl,
        "targetWindow",
        `toolbar=${defaultPopupOptions.toolbar},location=${defaultPopupOptions.location},status=${defaultPopupOptions.status},menubar=${defaultPopupOptions.menubar},width=${popupOptions.width},height=${popupOptions.height},top=${popupOptions.top},left=${popupOptions.left}`
      );
      if (!popupWindow2) {
        evHandlers.onError({ reason: "error", code: 1403 });
      } else {
        targetWindow = popupWindow2;
        popupWindow2.focus();
        this.initPostMessage(options);
        evHandlers.onLoad && evHandlers.onLoad();
      }
      return popupWindow2;
    } else {
      if (iframe && iframe.parentNode) {
        throw new Error(
          'You must destroy the iframe before you can open a new one. Call "destroy()"'
        );
      }
      if (!document.getElementById(STYLES_ID)) {
        const style = document.createElement("style");
        style.id = STYLES_ID;
        style.type = "text/css";
        style.innerHTML = `#${IFRAME_ID} {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          background: rgba(0,0,0,0.8);
        }`;
        document.getElementsByTagName("head")[0].appendChild(style);
      }
      let metaArray = document.querySelectorAll('meta[name="viewport"]');
      if (metaArray.length === 0) {
        metaEl = document.createElement("meta");
        metaEl.setAttribute("name", "viewport");
        metaEl.setAttribute("content", "initial-scale=1");
        document.head.appendChild(metaEl);
      }
      iframe = document.createElement("iframe");
      iframe.src = connectUrl;
      iframe.setAttribute("id", IFRAME_ID);
      iframe.setAttribute("frameborder", "0");
      iframe.setAttribute("scrolling", "no");
      iframe.setAttribute("aria-label", "Launching Modal");
      iframe.setAttribute("title", "Launching Modal");
      if (options.overlay) {
        iframe.setAttribute("style", `background: ${options.overlay};`);
      }
      if (options.node) {
        options.node.appendChild(iframe);
      } else {
        const parentEl = !!options.selector ? document.querySelector(options.selector) : document.body;
        if (parentEl) {
          parentEl.appendChild(iframe);
        } else {
          console.warn(
            `Couldn't find any elements matching "${options.selector}", appending "iframe" to "body" instead.`
          );
          document.body.appendChild(iframe);
        }
      }
      iframe.onload = () => {
        targetWindow = iframe.contentWindow;
        this.initPostMessage(options);
        evHandlers.onLoad && evHandlers.onLoad();
      };
      return null;
    }
  },
  initPostMessage(options) {
    const intervalId = setInterval(() => {
      const data = {
        type: PING_EVENT,
        selector: options.selector,
        sdkVersion: CONNECT_SDK_VERSION,
        platform: `${options.popup ? PLATFORM_POPUP : PLATFORM_IFRAME}`
      };
      if (options.redirectUrl) data["redirectUrl"] = options.redirectUrl;
      this.postMessage(data);
    }, 1e3);
    onMessageFn = (event) => {
      const payload = event.data.data;
      const eventType = event.data.type;
      if (event.origin === connectOrigin) {
        if (eventType === ACK_EVENT && !options.popup) {
          clearInterval(intervalId);
        } else if (eventType === URL_EVENT) {
          this.openPopupWindow(event.data.url);
        } else if (eventType === DONE_EVENT) {
          evHandlers.onDone(payload);
          this.destroy();
        } else if (eventType === CANCEL_EVENT) {
          evHandlers.onCancel(payload);
          this.destroy();
        } else if (eventType === ERROR_EVENT) {
          evHandlers.onError(payload);
          this.destroy();
        } else if (eventType === ROUTE_EVENT) {
          evHandlers.onRoute && evHandlers.onRoute(payload);
        } else if (eventType === USER_EVENT) {
          evHandlers.onUser && evHandlers.onUser(payload);
        } else if (eventType === CLOSE_POPUP_EVENT) {
          popupWindow == null ? void 0 : popupWindow.close();
        }
      }
    };
    window.addEventListener("message", onMessageFn);
  },
  openPopupWindow(url) {
    const top = window.self.outerHeight / 2 + window.self.screenY - POPUP_HEIGHT / 2;
    const left = window.self.outerWidth / 2 + window.self.screenX - POPUP_WIDTH / 2;
    popupWindow = window.open(
      url,
      "targetWindow",
      `toolbar=no,location=no,status=no,menubar=no,width=${POPUP_WIDTH},height=${POPUP_HEIGHT},top=${top},left=${left}`
    );
    if (popupWindow) {
      popupWindow.focus();
      const intervalId = setInterval(() => {
        if (popupWindow == null ? void 0 : popupWindow.closed) {
          clearInterval(intervalId);
          this.postMessage({
            type: WINDOW_EVENT,
            closed: true,
            blocked: false
          });
        }
      }, 1e3);
    } else {
      this.postMessage({
        type: WINDOW_EVENT,
        closed: true,
        blocked: true
      });
    }
  },
  postMessage(data) {
    targetWindow == null ? void 0 : targetWindow.postMessage(data, connectUrl);
  }
};
var src_default = Connect;
export {
  Connect,
  src_default as default
};
//# sourceMappingURL=index.js.map
