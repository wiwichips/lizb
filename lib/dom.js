/**
 * Small library for interacting with frontend web apis / html / dom.
 */

/////////////////////////////////////////////////////////////////////

/**
 * (dom/query "#my-id") # returns first matching element
 */
function dom_query(cssQuery) { 
  return document.querySelector(cssQuery);
}

/**
 * (dom/id "my-id") # get document element by id
 */
function dom_id(id) {
  return document.getElementById(id);
}

/////////////////////////////////////////////////////////////////////

// helper
function assertEventTarget(element, fname) {
  if (!element || typeof element.addEventListener !== "function") {
    throw new TypeError(`${fname}: element is not an EventTarget (no addEventListener)`);
  }
}

/**
 * (dom/on element event-name callback-function)
 * Wrapper for `element.addEventListener(eventName, callbackFunction)`
 * returns element passed.
 */
function dom_on(element, eventName, callback, options) {
  assertEventTarget(element, "dom/on");

  element.addEventListener(String(eventName), callback, options);
  return element;
}

/**
 * (dom/off element event-name callback)
 * Wrapper for `element.removeEventListener(eventName, callback)`
 * returns element passed.
 */
function dom_off(element, eventName, callback, options) {
  assertEventTarget(element, "dom/off");

  element.removeEventListener(String(eventName), callback, options);
  return element;
}

/**
 * (dom/once element event-name callback)
 */
function dom_once(element, eventName, callback, options) {
  return dom_on(element, eventName, callback, { ...(options ?? {}), once: true });
}

/////////////////////////////////////////////////////////////////////

export {
  dom_query as query,
  dom_id    as id,
  dom_on    as on,
  dom_off   as off,
  dom_once  as once,
};
;
