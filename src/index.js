import Bus from "kefir-bus";
import createStore from "./createStore";

// ---

function defaultErrorHandler(e) {
  throw e;
}

// ---

export default function setup(options = {}) {
  const events$ = new Bus();

  events$.onError(options.onError || defaultErrorHandler);

  return {
    dispatch(type, payload) {
      if (type == null) {
        events$.error(new Error("[dispatch] Action type is empty"));
        return;
      }

      // TODO: prevent circular calls
      try {
        events$.emit({ type, payload });
      } catch (e) {
        events$.error(e);
      }
      // no returned value
    },

    createStore: (...args) => createStore(events$, ...args)
  }
}