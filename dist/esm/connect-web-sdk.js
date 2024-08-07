// NOTE: Changing this value should be considered a version breaking change!!!
export const IFRAME_ID = 'connectIframe';
export const STYLES_ID = 'connectStyles';
export const PLATFORM_IFRAME = 'iframe';
export const PLATFORM_POPUP = 'web';
export const CONNECT_SDK_VERSION = 'PACKAGE_VERSION';

// NOTE: oauth popup window dimensions
export const POPUP_WIDTH = 600;
export const POPUP_HEIGHT = 600;

// NOTE: connect popup window dimensions
export const CONNECT_POPUP_WIDTH = 520;
export const CONNECT_POPUP_HEIGHT = 720;

// NOTE: available events
export const ACK_EVENT = 'ack';
export const CANCEL_EVENT = 'cancel';
export const URL_EVENT = 'url';
export const DONE_EVENT = 'done';
export const ERROR_EVENT = 'error';
export const PING_EVENT = 'ping';
export const WINDOW_EVENT = 'window';
export const ROUTE_EVENT = 'route';
export const USER_EVENT = 'user';
export const CLOSE_POPUP_EVENT = 'closePopup';
import { IFRAME_ID, POPUP_WIDTH, POPUP_HEIGHT, CONNECT_POPUP_HEIGHT, CONNECT_POPUP_WIDTH, ACK_EVENT, CANCEL_EVENT, URL_EVENT, DONE_EVENT, ERROR_EVENT, PING_EVENT, WINDOW_EVENT, ROUTE_EVENT, USER_EVENT, STYLES_ID, CONNECT_SDK_VERSION, CLOSE_POPUP_EVENT, PLATFORM_POPUP, PLATFORM_IFRAME } from './constants';
let evHandlers;
let onMessageFn;
let connectUrl;
let iframe;
let metaEl;
let targetWindow;
let connectOrigin;
let popupWindow;
const defaultEventHandlers = {
  onLoad: () => {},
  onUser: event => {},
  onRoute: event => {}
};
export const Connect = {
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
    iframe = undefined;
    metaEl = undefined;
    window.removeEventListener('message', onMessageFn);
  },
  launch(url, eventHandlers) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    connectUrl = url;
    evHandlers = {
      ...defaultEventHandlers,
      ...eventHandlers
    };
    connectOrigin = new URL(connectUrl).origin;
    if (options.popup) {
      const defaultPopupOptions = {
        toolbar: 'no',
        location: 'no',
        status: 'no',
        menubar: 'no',
        width: CONNECT_POPUP_HEIGHT,
        height: CONNECT_POPUP_WIDTH,
        top: window.self.outerHeight / 2 + window.self.screenY - CONNECT_POPUP_HEIGHT / 2,
        left: window.self.outerWidth / 2 + window.self.screenX - CONNECT_POPUP_WIDTH / 2
      };
      const popupOptions = {
        ...defaultPopupOptions,
        ...options.popupOptions
      };
      const popupWindow = window.open(connectUrl, 'targetWindow', "toolbar=".concat(defaultPopupOptions.toolbar, ",location=").concat(defaultPopupOptions.location, ",status=").concat(defaultPopupOptions.status, ",menubar=").concat(defaultPopupOptions.menubar, ",width=").concat(popupOptions.width, ",height=").concat(popupOptions.height, ",top=").concat(popupOptions.top, ",left=").concat(popupOptions.left));
      if (!popupWindow) {
        evHandlers.onError({
          reason: 'error',
          code: 1403
        });
      } else {
        targetWindow = popupWindow;
        popupWindow.focus();
        this.initPostMessage(options);
        evHandlers.onLoad && evHandlers.onLoad();
      }
      return popupWindow;
    } else {
      if (iframe && iframe.parentNode) {
        throw new Error('You must destroy the iframe before you can open a new one. Call "destroy()"');
      }
      if (!document.getElementById(STYLES_ID)) {
        const style = document.createElement('style');
        style.id = STYLES_ID;
        style.type = 'text/css';
        style.innerHTML = "#".concat(IFRAME_ID, " {\n          position: absolute;\n          left: 0;\n          top: 0;\n          width: 100%;\n          height: 100%;\n          z-index: 10;\n          background: rgba(0,0,0,0.8);\n        }");
        document.getElementsByTagName('head')[0].appendChild(style);
      }
      let metaArray = document.querySelectorAll('meta[name="viewport"]');
      if (metaArray.length === 0) {
        metaEl = document.createElement('meta');
        metaEl.setAttribute('name', 'viewport');
        metaEl.setAttribute('content', 'initial-scale=1');
        document.head.appendChild(metaEl);
      }
      iframe = document.createElement('iframe');
      iframe.src = connectUrl;
      iframe.setAttribute('id', IFRAME_ID);
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
        const parentEl = !!options.selector ? document.querySelector(options.selector) : document.body;
        if (parentEl) {
          parentEl.appendChild(iframe);
        } else {
          console.warn("Couldn't find any elements matching \"".concat(options.selector, "\", appending \"iframe\" to \"body\" instead."));
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
    // NOTE: ping connect until it responds
    const intervalId = setInterval(() => {
      const data = {
        type: PING_EVENT,
        selector: options.selector,
        sdkVersion: CONNECT_SDK_VERSION,
        platform: "".concat(options.popup ? PLATFORM_POPUP : PLATFORM_IFRAME)
      };
      if (options.redirectUrl) data['redirectUrl'] = options.redirectUrl;
      this.postMessage(data);
    }, 1000);
    onMessageFn = event => {
      const payload = event.data.data;
      const eventType = event.data.type;
      // NOTE: make sure it's Connect and not a bad actor
      if (event.origin === connectOrigin) {
        // NOTE: actively pinging connect while it's displayed in a popup allows us to recover the
        // session if the user refreshes the popup window
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
          var _popupWindow;
          (_popupWindow = popupWindow) === null || _popupWindow === void 0 || _popupWindow.close();
        }
      }
    };
    window.addEventListener('message', onMessageFn);
  },
  openPopupWindow(url) {
    const top = window.self.outerHeight / 2 + window.self.screenY - POPUP_HEIGHT / 2;
    const left = window.self.outerWidth / 2 + window.self.screenX - POPUP_WIDTH / 2;
    popupWindow = window.open(url, 'targetWindow', "toolbar=no,location=no,status=no,menubar=no,width=".concat(POPUP_WIDTH, ",height=").concat(POPUP_HEIGHT, ",top=").concat(top, ",left=").concat(left));
    if (popupWindow) {
      popupWindow.focus();
      const intervalId = setInterval(() => {
        var _popupWindow2;
        // clear itself if window no longer exists or has been closed
        if ((_popupWindow2 = popupWindow) !== null && _popupWindow2 !== void 0 && _popupWindow2.closed) {
          // window closed, notify connect
          clearInterval(intervalId);
          this.postMessage({
            type: WINDOW_EVENT,
            closed: true,
            blocked: false
          });
        }
      }, 1000);
    } else {
      this.postMessage({
        type: WINDOW_EVENT,
        closed: true,
        blocked: true
      });
    }
  },
  postMessage(data) {
    var _targetWindow;
    (_targetWindow = targetWindow) === null || _targetWindow === void 0 || _targetWindow.postMessage(data, connectUrl);
  }
};

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29ubmVjdC13ZWItc2RrLmpzIiwibmFtZXMiOlsiSUZSQU1FX0lEIiwiU1RZTEVTX0lEIiwiUExBVEZPUk1fSUZSQU1FIiwiUExBVEZPUk1fUE9QVVAiLCJDT05ORUNUX1NES19WRVJTSU9OIiwiUE9QVVBfV0lEVEgiLCJQT1BVUF9IRUlHSFQiLCJDT05ORUNUX1BPUFVQX1dJRFRIIiwiQ09OTkVDVF9QT1BVUF9IRUlHSFQiLCJBQ0tfRVZFTlQiLCJDQU5DRUxfRVZFTlQiLCJVUkxfRVZFTlQiLCJET05FX0VWRU5UIiwiRVJST1JfRVZFTlQiLCJQSU5HX0VWRU5UIiwiV0lORE9XX0VWRU5UIiwiUk9VVEVfRVZFTlQiLCJVU0VSX0VWRU5UIiwiQ0xPU0VfUE9QVVBfRVZFTlQiLCJJRlJBTUVfSUQiLCJQT1BVUF9XSURUSCIsIlBPUFVQX0hFSUdIVCIsIkNPTk5FQ1RfUE9QVVBfSEVJR0hUIiwiQ09OTkVDVF9QT1BVUF9XSURUSCIsIkFDS19FVkVOVCIsIkNBTkNFTF9FVkVOVCIsIlVSTF9FVkVOVCIsIkRPTkVfRVZFTlQiLCJFUlJPUl9FVkVOVCIsIlBJTkdfRVZFTlQiLCJXSU5ET1dfRVZFTlQiLCJST1VURV9FVkVOVCIsIlVTRVJfRVZFTlQiLCJTVFlMRVNfSUQiLCJDT05ORUNUX1NES19WRVJTSU9OIiwiQ0xPU0VfUE9QVVBfRVZFTlQiLCJQTEFURk9STV9QT1BVUCIsIlBMQVRGT1JNX0lGUkFNRSIsImV2SGFuZGxlcnMiLCJvbk1lc3NhZ2VGbiIsImNvbm5lY3RVcmwiLCJpZnJhbWUiLCJtZXRhRWwiLCJ0YXJnZXRXaW5kb3ciLCJjb25uZWN0T3JpZ2luIiwicG9wdXBXaW5kb3ciLCJkZWZhdWx0RXZlbnRIYW5kbGVycyIsIm9uTG9hZCIsIm9uVXNlciIsImV2ZW50Iiwib25Sb3V0ZSIsIkNvbm5lY3QiLCJkZXN0cm95IiwicGFyZW50Tm9kZSIsInJlbW92ZUNoaWxkIiwiY2xvc2UiLCJ1bmRlZmluZWQiLCJ3aW5kb3ciLCJyZW1vdmVFdmVudExpc3RlbmVyIiwibGF1bmNoIiwidXJsIiwiZXZlbnRIYW5kbGVycyIsIm9wdGlvbnMiLCJhcmd1bWVudHMiLCJsZW5ndGgiLCJVUkwiLCJvcmlnaW4iLCJwb3B1cCIsImRlZmF1bHRQb3B1cE9wdGlvbnMiLCJ0b29sYmFyIiwibG9jYXRpb24iLCJzdGF0dXMiLCJtZW51YmFyIiwid2lkdGgiLCJoZWlnaHQiLCJ0b3AiLCJzZWxmIiwib3V0ZXJIZWlnaHQiLCJzY3JlZW5ZIiwibGVmdCIsIm91dGVyV2lkdGgiLCJzY3JlZW5YIiwicG9wdXBPcHRpb25zIiwib3BlbiIsImNvbmNhdCIsIm9uRXJyb3IiLCJyZWFzb24iLCJjb2RlIiwiZm9jdXMiLCJpbml0UG9zdE1lc3NhZ2UiLCJFcnJvciIsImRvY3VtZW50IiwiZ2V0RWxlbWVudEJ5SWQiLCJzdHlsZSIsImNyZWF0ZUVsZW1lbnQiLCJpZCIsInR5cGUiLCJpbm5lckhUTUwiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsImFwcGVuZENoaWxkIiwibWV0YUFycmF5IiwicXVlcnlTZWxlY3RvckFsbCIsInNldEF0dHJpYnV0ZSIsImhlYWQiLCJzcmMiLCJvdmVybGF5Iiwibm9kZSIsInBhcmVudEVsIiwic2VsZWN0b3IiLCJxdWVyeVNlbGVjdG9yIiwiYm9keSIsImNvbnNvbGUiLCJ3YXJuIiwib25sb2FkIiwiY29udGVudFdpbmRvdyIsImludGVydmFsSWQiLCJzZXRJbnRlcnZhbCIsImRhdGEiLCJzZGtWZXJzaW9uIiwicGxhdGZvcm0iLCJyZWRpcmVjdFVybCIsInBvc3RNZXNzYWdlIiwicGF5bG9hZCIsImV2ZW50VHlwZSIsImNsZWFySW50ZXJ2YWwiLCJvcGVuUG9wdXBXaW5kb3ciLCJvbkRvbmUiLCJvbkNhbmNlbCIsIl9wb3B1cFdpbmRvdyIsImFkZEV2ZW50TGlzdGVuZXIiLCJfcG9wdXBXaW5kb3cyIiwiY2xvc2VkIiwiYmxvY2tlZCIsIl90YXJnZXRXaW5kb3ciXSwic291cmNlcyI6WyIuLi8uLi9zcmMvY29uc3RhbnRzLnRzIiwiLi4vLi4vc3JjL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIE5PVEU6IENoYW5naW5nIHRoaXMgdmFsdWUgc2hvdWxkIGJlIGNvbnNpZGVyZWQgYSB2ZXJzaW9uIGJyZWFraW5nIGNoYW5nZSEhIVxuZXhwb3J0IGNvbnN0IElGUkFNRV9JRCA9ICdjb25uZWN0SWZyYW1lJztcbmV4cG9ydCBjb25zdCBTVFlMRVNfSUQgPSAnY29ubmVjdFN0eWxlcyc7XG5leHBvcnQgY29uc3QgUExBVEZPUk1fSUZSQU1FID0gJ2lmcmFtZSc7XG5leHBvcnQgY29uc3QgUExBVEZPUk1fUE9QVVAgPSAnd2ViJztcbmV4cG9ydCBjb25zdCBDT05ORUNUX1NES19WRVJTSU9OID0gJ1BBQ0tBR0VfVkVSU0lPTic7XG5cbi8vIE5PVEU6IG9hdXRoIHBvcHVwIHdpbmRvdyBkaW1lbnNpb25zXG5leHBvcnQgY29uc3QgUE9QVVBfV0lEVEggPSA2MDA7XG5leHBvcnQgY29uc3QgUE9QVVBfSEVJR0hUID0gNjAwO1xuXG4vLyBOT1RFOiBjb25uZWN0IHBvcHVwIHdpbmRvdyBkaW1lbnNpb25zXG5leHBvcnQgY29uc3QgQ09OTkVDVF9QT1BVUF9XSURUSCA9IDUyMDtcbmV4cG9ydCBjb25zdCBDT05ORUNUX1BPUFVQX0hFSUdIVCA9IDcyMDtcblxuLy8gTk9URTogYXZhaWxhYmxlIGV2ZW50c1xuZXhwb3J0IGNvbnN0IEFDS19FVkVOVCA9ICdhY2snO1xuZXhwb3J0IGNvbnN0IENBTkNFTF9FVkVOVCA9ICdjYW5jZWwnO1xuZXhwb3J0IGNvbnN0IFVSTF9FVkVOVCA9ICd1cmwnO1xuZXhwb3J0IGNvbnN0IERPTkVfRVZFTlQgPSAnZG9uZSc7XG5leHBvcnQgY29uc3QgRVJST1JfRVZFTlQgPSAnZXJyb3InO1xuZXhwb3J0IGNvbnN0IFBJTkdfRVZFTlQgPSAncGluZyc7XG5leHBvcnQgY29uc3QgV0lORE9XX0VWRU5UID0gJ3dpbmRvdyc7XG5leHBvcnQgY29uc3QgUk9VVEVfRVZFTlQgPSAncm91dGUnO1xuZXhwb3J0IGNvbnN0IFVTRVJfRVZFTlQgPSAndXNlcic7XG5leHBvcnQgY29uc3QgQ0xPU0VfUE9QVVBfRVZFTlQgPSAnY2xvc2VQb3B1cCc7XG4iLCJpbXBvcnQge1xuICBJRlJBTUVfSUQsXG4gIFBPUFVQX1dJRFRILFxuICBQT1BVUF9IRUlHSFQsXG4gIENPTk5FQ1RfUE9QVVBfSEVJR0hULFxuICBDT05ORUNUX1BPUFVQX1dJRFRILFxuICBBQ0tfRVZFTlQsXG4gIENBTkNFTF9FVkVOVCxcbiAgVVJMX0VWRU5ULFxuICBET05FX0VWRU5ULFxuICBFUlJPUl9FVkVOVCxcbiAgUElOR19FVkVOVCxcbiAgV0lORE9XX0VWRU5ULFxuICBST1VURV9FVkVOVCxcbiAgVVNFUl9FVkVOVCxcbiAgU1RZTEVTX0lELFxuICBDT05ORUNUX1NES19WRVJTSU9OLFxuICBDTE9TRV9QT1BVUF9FVkVOVCxcbiAgUExBVEZPUk1fUE9QVVAsXG4gIFBMQVRGT1JNX0lGUkFNRSxcbn0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5sZXQgZXZIYW5kbGVyczogQ29ubmVjdEV2ZW50SGFuZGxlcnM7XG5sZXQgb25NZXNzYWdlRm46IGFueTtcbmxldCBjb25uZWN0VXJsOiBzdHJpbmc7XG5sZXQgaWZyYW1lOiBhbnk7XG5sZXQgbWV0YUVsOiBhbnk7XG5sZXQgdGFyZ2V0V2luZG93OiBXaW5kb3c7XG5sZXQgY29ubmVjdE9yaWdpbjogc3RyaW5nO1xubGV0IHBvcHVwV2luZG93OiBXaW5kb3cgfCBudWxsO1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RFdmVudEhhbmRsZXJzIHtcbiAgb25Eb25lOiAoZXZlbnQ6IENvbm5lY3REb25lRXZlbnQpID0+IHZvaWQ7XG4gIG9uQ2FuY2VsOiAoZXZlbnQ6IENvbm5lY3RDYW5jZWxFdmVudCkgPT4gdm9pZDtcbiAgb25FcnJvcjogKGV2ZW50OiBDb25uZWN0RXJyb3JFdmVudCkgPT4gdm9pZDtcbiAgb25Sb3V0ZT86IChldmVudDogQ29ubmVjdFJvdXRlRXZlbnQpID0+IHZvaWQ7XG4gIG9uVXNlcj86IChldmVudDogYW55KSA9PiB2b2lkO1xuICBvbkxvYWQ/OiAoKSA9PiB2b2lkO1xufVxuXG5jb25zdCBkZWZhdWx0RXZlbnRIYW5kbGVyczogYW55ID0ge1xuICBvbkxvYWQ6ICgpID0+IHt9LFxuICBvblVzZXI6IChldmVudDogYW55KSA9PiB7fSxcbiAgb25Sb3V0ZTogKGV2ZW50OiBDb25uZWN0Um91dGVFdmVudCkgPT4ge30sXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIENvbm5lY3RQcm9wcyB7XG4gIGNvbm5lY3RVcmw6IHN0cmluZztcbiAgZXZlbnRIYW5kbGVyczogQ29ubmVjdEV2ZW50SGFuZGxlcnM7XG4gIGxpbmtpbmdVcmk/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdENhbmNlbEV2ZW50IHtcbiAgY29kZTogbnVtYmVyO1xuICByZWFzb246IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDb25uZWN0RXJyb3JFdmVudCB7XG4gIGNvZGU6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdERvbmVFdmVudCB7XG4gIGNvZGU6IG51bWJlcjtcbiAgcmVhc29uOiBzdHJpbmc7XG4gIHJlcG9ydERhdGE6IFtcbiAgICB7XG4gICAgICBwb3J0Zm9saW9JZDogc3RyaW5nO1xuICAgICAgdHlwZTogc3RyaW5nO1xuICAgICAgcmVwb3J0SWQ6IHN0cmluZztcbiAgICB9XG4gIF07XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdFJvdXRlRXZlbnQge1xuICBzY3JlZW46IHN0cmluZztcbiAgcGFyYW1zOiBhbnk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29ubmVjdE9wdGlvbnMge1xuICBzZWxlY3Rvcj86IHN0cmluZztcbiAgbm9kZT86IE5vZGU7XG4gIG92ZXJsYXk/OiBzdHJpbmc7XG4gIHBvcHVwPzogYm9vbGVhbjtcbiAgcG9wdXBPcHRpb25zPzogUG9wdXBPcHRpb25zO1xuICByZWRpcmVjdFVybD86IHN0cmluZztcbn1cblxuZXhwb3J0IGludGVyZmFjZSBQb3B1cE9wdGlvbnMge1xuICB3aWR0aD86IG51bWJlcjtcbiAgaGVpZ2h0PzogbnVtYmVyO1xuICB0b3A/OiBudW1iZXI7XG4gIGxlZnQ/OiBudW1iZXI7XG59XG5cbmludGVyZmFjZSBDb25uZWN0IHtcbiAgZGVzdHJveTogKCkgPT4gdm9pZDtcbiAgbGF1bmNoOiAoXG4gICAgdXJsOiBzdHJpbmcsXG4gICAgZXZlbnRIYW5kbGVyczogQ29ubmVjdEV2ZW50SGFuZGxlcnMsXG4gICAgb3B0aW9ucz86IENvbm5lY3RPcHRpb25zXG4gICkgPT4gV2luZG93IHwgbnVsbCB8IHZvaWQ7XG4gIGluaXRQb3N0TWVzc2FnZTogKG9wdGlvbnM6IENvbm5lY3RPcHRpb25zKSA9PiB2b2lkO1xuICBvcGVuUG9wdXBXaW5kb3c6ICh1cmw6IHN0cmluZykgPT4gdm9pZDtcbiAgcG9zdE1lc3NhZ2U6IChldmVudDogYW55KSA9PiB2b2lkO1xufVxuXG5leHBvcnQgY29uc3QgQ29ubmVjdDogQ29ubmVjdCA9IHtcbiAgZGVzdHJveSgpIHtcbiAgICBpZiAoaWZyYW1lICYmIGlmcmFtZS5wYXJlbnROb2RlKSB7XG4gICAgICBpZnJhbWUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgIH1cblxuICAgIGlmIChtZXRhRWwgJiYgbWV0YUVsLnBhcmVudE5vZGUpIHtcbiAgICAgIG1ldGFFbC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG1ldGFFbCk7XG4gICAgfVxuXG4gICAgaWYgKCFpZnJhbWUgJiYgdGFyZ2V0V2luZG93KSB7XG4gICAgICB0YXJnZXRXaW5kb3cuY2xvc2UoKTtcbiAgICB9XG5cbiAgICBpZnJhbWUgPSB1bmRlZmluZWQ7XG4gICAgbWV0YUVsID0gdW5kZWZpbmVkO1xuXG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1lc3NhZ2VGbik7XG4gIH0sXG5cbiAgbGF1bmNoKFxuICAgIHVybDogc3RyaW5nLFxuICAgIGV2ZW50SGFuZGxlcnM6IENvbm5lY3RFdmVudEhhbmRsZXJzLFxuICAgIG9wdGlvbnM6IENvbm5lY3RPcHRpb25zID0ge31cbiAgKSB7XG4gICAgY29ubmVjdFVybCA9IHVybDtcbiAgICBldkhhbmRsZXJzID0geyAuLi5kZWZhdWx0RXZlbnRIYW5kbGVycywgLi4uZXZlbnRIYW5kbGVycyB9O1xuICAgIGNvbm5lY3RPcmlnaW4gPSBuZXcgVVJMKGNvbm5lY3RVcmwpLm9yaWdpbjtcblxuICAgIGlmIChvcHRpb25zLnBvcHVwKSB7XG4gICAgICBjb25zdCBkZWZhdWx0UG9wdXBPcHRpb25zID0ge1xuICAgICAgICB0b29sYmFyOiAnbm8nLFxuICAgICAgICBsb2NhdGlvbjogJ25vJyxcbiAgICAgICAgc3RhdHVzOiAnbm8nLFxuICAgICAgICBtZW51YmFyOiAnbm8nLFxuICAgICAgICB3aWR0aDogQ09OTkVDVF9QT1BVUF9IRUlHSFQsXG4gICAgICAgIGhlaWdodDogQ09OTkVDVF9QT1BVUF9XSURUSCxcbiAgICAgICAgdG9wOlxuICAgICAgICAgIHdpbmRvdy5zZWxmLm91dGVySGVpZ2h0IC8gMiArXG4gICAgICAgICAgd2luZG93LnNlbGYuc2NyZWVuWSAtXG4gICAgICAgICAgQ09OTkVDVF9QT1BVUF9IRUlHSFQgLyAyLFxuICAgICAgICBsZWZ0OlxuICAgICAgICAgIHdpbmRvdy5zZWxmLm91dGVyV2lkdGggLyAyICtcbiAgICAgICAgICB3aW5kb3cuc2VsZi5zY3JlZW5YIC1cbiAgICAgICAgICBDT05ORUNUX1BPUFVQX1dJRFRIIC8gMixcbiAgICAgIH07XG4gICAgICBjb25zdCBwb3B1cE9wdGlvbnMgPSB7IC4uLmRlZmF1bHRQb3B1cE9wdGlvbnMsIC4uLm9wdGlvbnMucG9wdXBPcHRpb25zIH07XG4gICAgICBjb25zdCBwb3B1cFdpbmRvdyA9IHdpbmRvdy5vcGVuKFxuICAgICAgICBjb25uZWN0VXJsLFxuICAgICAgICAndGFyZ2V0V2luZG93JyxcbiAgICAgICAgYHRvb2xiYXI9JHtkZWZhdWx0UG9wdXBPcHRpb25zLnRvb2xiYXJ9LGxvY2F0aW9uPSR7ZGVmYXVsdFBvcHVwT3B0aW9ucy5sb2NhdGlvbn0sc3RhdHVzPSR7ZGVmYXVsdFBvcHVwT3B0aW9ucy5zdGF0dXN9LG1lbnViYXI9JHtkZWZhdWx0UG9wdXBPcHRpb25zLm1lbnViYXJ9LHdpZHRoPSR7cG9wdXBPcHRpb25zLndpZHRofSxoZWlnaHQ9JHtwb3B1cE9wdGlvbnMuaGVpZ2h0fSx0b3A9JHtwb3B1cE9wdGlvbnMudG9wfSxsZWZ0PSR7cG9wdXBPcHRpb25zLmxlZnR9YFxuICAgICAgKTtcblxuICAgICAgaWYgKCFwb3B1cFdpbmRvdykge1xuICAgICAgICBldkhhbmRsZXJzLm9uRXJyb3IoeyByZWFzb246ICdlcnJvcicsIGNvZGU6IDE0MDMgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0YXJnZXRXaW5kb3cgPSBwb3B1cFdpbmRvdztcbiAgICAgICAgcG9wdXBXaW5kb3cuZm9jdXMoKTtcbiAgICAgICAgdGhpcy5pbml0UG9zdE1lc3NhZ2Uob3B0aW9ucyk7XG4gICAgICAgIGV2SGFuZGxlcnMub25Mb2FkICYmIGV2SGFuZGxlcnMub25Mb2FkKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBwb3B1cFdpbmRvdztcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGlmcmFtZSAmJiBpZnJhbWUucGFyZW50Tm9kZSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ1lvdSBtdXN0IGRlc3Ryb3kgdGhlIGlmcmFtZSBiZWZvcmUgeW91IGNhbiBvcGVuIGEgbmV3IG9uZS4gQ2FsbCBcImRlc3Ryb3koKVwiJ1xuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFNUWUxFU19JRCkpIHtcbiAgICAgICAgY29uc3Qgc3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgICAgICBzdHlsZS5pZCA9IFNUWUxFU19JRDtcbiAgICAgICAgc3R5bGUudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgICAgIHN0eWxlLmlubmVySFRNTCA9IGAjJHtJRlJBTUVfSUR9IHtcbiAgICAgICAgICBwb3NpdGlvbjogYWJzb2x1dGU7XG4gICAgICAgICAgbGVmdDogMDtcbiAgICAgICAgICB0b3A6IDA7XG4gICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgaGVpZ2h0OiAxMDAlO1xuICAgICAgICAgIHotaW5kZXg6IDEwO1xuICAgICAgICAgIGJhY2tncm91bmQ6IHJnYmEoMCwwLDAsMC44KTtcbiAgICAgICAgfWA7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF0uYXBwZW5kQ2hpbGQoc3R5bGUpO1xuICAgICAgfVxuXG4gICAgICBsZXQgbWV0YUFycmF5ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnbWV0YVtuYW1lPVwidmlld3BvcnRcIl0nKTtcbiAgICAgIGlmIChtZXRhQXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIG1ldGFFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ21ldGEnKTtcbiAgICAgICAgbWV0YUVsLnNldEF0dHJpYnV0ZSgnbmFtZScsICd2aWV3cG9ydCcpO1xuICAgICAgICBtZXRhRWwuc2V0QXR0cmlidXRlKCdjb250ZW50JywgJ2luaXRpYWwtc2NhbGU9MScpO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKG1ldGFFbCk7XG4gICAgICB9XG5cbiAgICAgIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuXG4gICAgICBpZnJhbWUuc3JjID0gY29ubmVjdFVybDtcbiAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2lkJywgSUZSQU1FX0lEKTtcbiAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2ZyYW1lYm9yZGVyJywgJzAnKTtcbiAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3Njcm9sbGluZycsICdubycpO1xuICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsICdMYXVuY2hpbmcgTW9kYWwnKTtcbiAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3RpdGxlJywgJ0xhdW5jaGluZyBNb2RhbCcpO1xuXG4gICAgICAvLyBOT1RFOiB1cGRhdGUgb3ZlcmxheVxuICAgICAgaWYgKG9wdGlvbnMub3ZlcmxheSkge1xuICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzdHlsZScsIGBiYWNrZ3JvdW5kOiAke29wdGlvbnMub3ZlcmxheX07YCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLm5vZGUpIHtcbiAgICAgICAgb3B0aW9ucy5ub2RlLmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBOT1RFOiBhdHRhY2ggdG8gc2VsZWN0b3IgaWYgc3BlY2lmaWVkXG4gICAgICAgIGNvbnN0IHBhcmVudEVsID0gISFvcHRpb25zLnNlbGVjdG9yXG4gICAgICAgICAgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG9wdGlvbnMuc2VsZWN0b3IpXG4gICAgICAgICAgOiBkb2N1bWVudC5ib2R5O1xuICAgICAgICBpZiAocGFyZW50RWwpIHtcbiAgICAgICAgICBwYXJlbnRFbC5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUud2FybihcbiAgICAgICAgICAgIGBDb3VsZG4ndCBmaW5kIGFueSBlbGVtZW50cyBtYXRjaGluZyBcIiR7b3B0aW9ucy5zZWxlY3Rvcn1cIiwgYXBwZW5kaW5nIFwiaWZyYW1lXCIgdG8gXCJib2R5XCIgaW5zdGVhZC5gXG4gICAgICAgICAgKTtcbiAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWZyYW1lLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgICAgdGFyZ2V0V2luZG93ID0gaWZyYW1lLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgIHRoaXMuaW5pdFBvc3RNZXNzYWdlKG9wdGlvbnMpO1xuICAgICAgICBldkhhbmRsZXJzLm9uTG9hZCAmJiBldkhhbmRsZXJzLm9uTG9hZCgpO1xuICAgICAgfTtcblxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9LFxuXG4gIGluaXRQb3N0TWVzc2FnZShvcHRpb25zOiBDb25uZWN0T3B0aW9ucykge1xuICAgIC8vIE5PVEU6IHBpbmcgY29ubmVjdCB1bnRpbCBpdCByZXNwb25kc1xuICAgIGNvbnN0IGludGVydmFsSWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0ge1xuICAgICAgICB0eXBlOiBQSU5HX0VWRU5ULFxuICAgICAgICBzZWxlY3Rvcjogb3B0aW9ucy5zZWxlY3RvcixcbiAgICAgICAgc2RrVmVyc2lvbjogQ09OTkVDVF9TREtfVkVSU0lPTixcbiAgICAgICAgcGxhdGZvcm06IGAke29wdGlvbnMucG9wdXAgPyBQTEFURk9STV9QT1BVUCA6IFBMQVRGT1JNX0lGUkFNRX1gLFxuICAgICAgfTtcbiAgICAgIGlmIChvcHRpb25zLnJlZGlyZWN0VXJsKSBkYXRhWydyZWRpcmVjdFVybCddID0gb3B0aW9ucy5yZWRpcmVjdFVybDtcblxuICAgICAgdGhpcy5wb3N0TWVzc2FnZShkYXRhKTtcbiAgICB9LCAxMDAwKTtcblxuICAgIG9uTWVzc2FnZUZuID0gKGV2ZW50OiBhbnkpID0+IHtcbiAgICAgIGNvbnN0IHBheWxvYWQgPSBldmVudC5kYXRhLmRhdGE7XG4gICAgICBjb25zdCBldmVudFR5cGUgPSBldmVudC5kYXRhLnR5cGU7XG4gICAgICAvLyBOT1RFOiBtYWtlIHN1cmUgaXQncyBDb25uZWN0IGFuZCBub3QgYSBiYWQgYWN0b3JcbiAgICAgIGlmIChldmVudC5vcmlnaW4gPT09IGNvbm5lY3RPcmlnaW4pIHtcbiAgICAgICAgLy8gTk9URTogYWN0aXZlbHkgcGluZ2luZyBjb25uZWN0IHdoaWxlIGl0J3MgZGlzcGxheWVkIGluIGEgcG9wdXAgYWxsb3dzIHVzIHRvIHJlY292ZXIgdGhlXG4gICAgICAgIC8vIHNlc3Npb24gaWYgdGhlIHVzZXIgcmVmcmVzaGVzIHRoZSBwb3B1cCB3aW5kb3dcbiAgICAgICAgaWYgKGV2ZW50VHlwZSA9PT0gQUNLX0VWRU5UICYmICFvcHRpb25zLnBvcHVwKSB7XG4gICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbElkKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IFVSTF9FVkVOVCkge1xuICAgICAgICAgIHRoaXMub3BlblBvcHVwV2luZG93KGV2ZW50LmRhdGEudXJsKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IERPTkVfRVZFTlQpIHtcbiAgICAgICAgICBldkhhbmRsZXJzLm9uRG9uZShwYXlsb2FkKTtcbiAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IENBTkNFTF9FVkVOVCkge1xuICAgICAgICAgIGV2SGFuZGxlcnMub25DYW5jZWwocGF5bG9hZCk7XG4gICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXZlbnRUeXBlID09PSBFUlJPUl9FVkVOVCkge1xuICAgICAgICAgIGV2SGFuZGxlcnMub25FcnJvcihwYXlsb2FkKTtcbiAgICAgICAgICB0aGlzLmRlc3Ryb3koKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IFJPVVRFX0VWRU5UKSB7XG4gICAgICAgICAgZXZIYW5kbGVycy5vblJvdXRlICYmIGV2SGFuZGxlcnMub25Sb3V0ZShwYXlsb2FkKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IFVTRVJfRVZFTlQpIHtcbiAgICAgICAgICBldkhhbmRsZXJzLm9uVXNlciAmJiBldkhhbmRsZXJzLm9uVXNlcihwYXlsb2FkKTtcbiAgICAgICAgfSBlbHNlIGlmIChldmVudFR5cGUgPT09IENMT1NFX1BPUFVQX0VWRU5UKSB7XG4gICAgICAgICAgcG9wdXBXaW5kb3c/LmNsb3NlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBvbk1lc3NhZ2VGbik7XG4gIH0sXG5cbiAgb3BlblBvcHVwV2luZG93KHVybDogc3RyaW5nKSB7XG4gICAgY29uc3QgdG9wID1cbiAgICAgIHdpbmRvdy5zZWxmLm91dGVySGVpZ2h0IC8gMiArIHdpbmRvdy5zZWxmLnNjcmVlblkgLSBQT1BVUF9IRUlHSFQgLyAyO1xuICAgIGNvbnN0IGxlZnQgPVxuICAgICAgd2luZG93LnNlbGYub3V0ZXJXaWR0aCAvIDIgKyB3aW5kb3cuc2VsZi5zY3JlZW5YIC0gUE9QVVBfV0lEVEggLyAyO1xuICAgIHBvcHVwV2luZG93ID0gd2luZG93Lm9wZW4oXG4gICAgICB1cmwsXG4gICAgICAndGFyZ2V0V2luZG93JyxcbiAgICAgIGB0b29sYmFyPW5vLGxvY2F0aW9uPW5vLHN0YXR1cz1ubyxtZW51YmFyPW5vLHdpZHRoPSR7UE9QVVBfV0lEVEh9LGhlaWdodD0ke1BPUFVQX0hFSUdIVH0sdG9wPSR7dG9wfSxsZWZ0PSR7bGVmdH1gXG4gICAgKTtcblxuICAgIGlmIChwb3B1cFdpbmRvdykge1xuICAgICAgcG9wdXBXaW5kb3cuZm9jdXMoKTtcbiAgICAgIGNvbnN0IGludGVydmFsSWQgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgIC8vIGNsZWFyIGl0c2VsZiBpZiB3aW5kb3cgbm8gbG9uZ2VyIGV4aXN0cyBvciBoYXMgYmVlbiBjbG9zZWRcbiAgICAgICAgaWYgKHBvcHVwV2luZG93Py5jbG9zZWQpIHtcbiAgICAgICAgICAvLyB3aW5kb3cgY2xvc2VkLCBub3RpZnkgY29ubmVjdFxuICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWxJZCk7XG4gICAgICAgICAgdGhpcy5wb3N0TWVzc2FnZSh7XG4gICAgICAgICAgICB0eXBlOiBXSU5ET1dfRVZFTlQsXG4gICAgICAgICAgICBjbG9zZWQ6IHRydWUsXG4gICAgICAgICAgICBibG9ja2VkOiBmYWxzZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSwgMTAwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMucG9zdE1lc3NhZ2Uoe1xuICAgICAgICB0eXBlOiBXSU5ET1dfRVZFTlQsXG4gICAgICAgIGNsb3NlZDogdHJ1ZSxcbiAgICAgICAgYmxvY2tlZDogdHJ1ZSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICBwb3N0TWVzc2FnZShkYXRhOiBhbnkpIHtcbiAgICB0YXJnZXRXaW5kb3c/LnBvc3RNZXNzYWdlKGRhdGEsIGNvbm5lY3RVcmwpO1xuICB9LFxufTtcbiJdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQSxPQUFPLE1BQU1BLFNBQVMsR0FBRyxlQUFlO0FBQ3hDLE9BQU8sTUFBTUMsU0FBUyxHQUFHLGVBQWU7QUFDeEMsT0FBTyxNQUFNQyxlQUFlLEdBQUcsUUFBUTtBQUN2QyxPQUFPLE1BQU1DLGNBQWMsR0FBRyxLQUFLO0FBQ25DLE9BQU8sTUFBTUMsbUJBQW1CLEdBQUcsaUJBQWlCOztBQUVwRDtBQUNBLE9BQU8sTUFBTUMsV0FBVyxHQUFHLEdBQUc7QUFDOUIsT0FBTyxNQUFNQyxZQUFZLEdBQUcsR0FBRzs7QUFFL0I7QUFDQSxPQUFPLE1BQU1DLG1CQUFtQixHQUFHLEdBQUc7QUFDdEMsT0FBTyxNQUFNQyxvQkFBb0IsR0FBRyxHQUFHOztBQUV2QztBQUNBLE9BQU8sTUFBTUMsU0FBUyxHQUFHLEtBQUs7QUFDOUIsT0FBTyxNQUFNQyxZQUFZLEdBQUcsUUFBUTtBQUNwQyxPQUFPLE1BQU1DLFNBQVMsR0FBRyxLQUFLO0FBQzlCLE9BQU8sTUFBTUMsVUFBVSxHQUFHLE1BQU07QUFDaEMsT0FBTyxNQUFNQyxXQUFXLEdBQUcsT0FBTztBQUNsQyxPQUFPLE1BQU1DLFVBQVUsR0FBRyxNQUFNO0FBQ2hDLE9BQU8sTUFBTUMs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