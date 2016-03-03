import Bus from "kefir-bus";

// ---

const noop = () => {};

// ---

function createStoreInternal(events$, handlers = {}, initialState = {}) {
  return events$
    .filter(action => action.type in handlers)
    .scan(
      (state, { type, payload }) => {
        handlers[type](state, payload);
        return state;
      },
      Object.create(initialState)
    )
    .onAny(noop); // ensure stream is activated and ready to accept events
}

// ---

export default function setup() {
  const events$ = new Bus();

  return {
    dispatch(type, payload) {
      // TODO: check that `type` is not empty
      events$.emit({ type, payload });
      // no returned value
    },

    createStore: (...args) => createStoreInternal(events$, ...args)
  }
}