import Bus from "kefir-bus";

// ---

const noop = () => {};

// ---

function createStoreInternal(events$, handlers = {}, initialState = {}) {
  // TODO: add update strategy function (last param). Make current strategy a default one.
  // TODO: map filtered events, pass to scanner a handler function instead of event type
  return events$
    .filter(action => action.type in handlers)
    .scan(
      (state, { type, payload }) => {
        handlers[type](state, payload);
        return state;
      },
      initialState
    )
    .onAny(noop); // ensure stream is activated and ready to accept events
}

// ---

export default function setup() {
  const events$ = new Bus();

  return {
    dispatch(type, payload) {
      // TODO: check that `type` is not empty
      // TODO: prevent circular calls
      events$.emit({ type, payload });
      // no returned value
    },

    createStore: (...args) => createStoreInternal(events$, ...args)
  }
}