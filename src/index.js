import Bus from "kefir-bus";
import createDispatch from "./createDispatch";
import { createStoresFactory } from "./createStore";
import { defaultMutableStrategy } from "./storeUpdateStrategies";

// ---

const defaultOptions = {
  onError(e) {
    throw e;
  },

  abortNestedDispatch: true,
  defaultStoreUpdateStrategy: defaultMutableStrategy
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

    createStore: createStoresFactory(
      actions$.ignoreErrors(), // stores are not interested in top-level app errors
      options.defaultStoreUpdateStrategy
    ),

    close() {
      actions$.end();
    }
  }
}
