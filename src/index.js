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

export default function setup() {
  const events$ = new Bus();

  return {
    dispatch(type, payload) {
      if (type == null) {
        throw new Error("[dispatch] Action type is empty");
      }

      // TODO: prevent circular calls
      events$.emit({ type, payload });
      // no returned value
    },

    createStore: (...args) => createStoreInternal(events$, ...args)
  }
}