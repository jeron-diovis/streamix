import Bus from "kefir-bus";

// ---

const noop = () => {};

// ---

function defaultUpdateStrategy(handler, state, payload) {
  handler(state, payload);
  return state;
}

// ---

function createStoreInternal(
  events$,
  handlers = {},
  initialState = {},
  strategy = defaultUpdateStrategy
) {
  return events$
    .filter(action => action.type in handlers)
    .scan(
      (state, { type, payload }) => strategy(handlers[type], state, payload),
      initialState
    )
    .onAny(noop); // ensure stream is activated and ready to accept events
}

// ---

export default function setup(options = {}) {
  const events$ = new Bus();

  if (options.onError) {
    events$.onError(options.onError);
  }

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

    createStore: (...args) => createStoreInternal(events$, ...args)
  }
}