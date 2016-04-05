import Bus from "kefir-bus";
import createStore from "./createStore";

// ---

const defaultOptions = {
  onError(e) {
    throw e;
  },

  abortNestedDispatch: true
};

// ---

export default function setup(rawOptions = {}) {
  const options = { ...defaultOptions, ...rawOptions };

  const events$ = new Bus();
  events$.onError(options.onError);

  let dispatching;

  return {
    dispatch(type, payload) {
      if (type == null) {
        events$.error(new Error("[dispatch] Action type is empty"));
        return;
      }

      if (dispatching) {
        events$.error(new Error(
          `[dispatch] A "dispatch(${type})" was called, but "dispatch(${dispatching})" is already executing.\n`
          + (options.abortNestedDispatch
            ? `Handling of "dispatch(${type})" is aborted.`
            : `This potentially means circular updates and should be avoided.`)
        ));

        if (options.abortNestedDispatch) {
          return;
        }
      }

      dispatching = type;

      try {
        events$.emit({ type, payload });
      } catch (e) {
        events$.error(e);
      } finally {
        dispatching = null;
      }
      // no returned value
    },

    createStore: (...args) => createStore(events$, ...args),

    close() {
      events$.end();
    }
  }
}