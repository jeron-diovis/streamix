import Bus from "kefir-bus";
import createStore from "./createStore";
import createDispatch from "./createDispatch";

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

  const actions$ = new Bus();
  actions$.onError(options.onError);

  return {
    dispatch: createDispatch(
      actions$.emit,
      actions$.error,
      options.abortNestedDispatch
    ),

    createStore: (...args) => createStore(actions$, ...args),

    close() {
      actions$.end();
    }
  }
}
