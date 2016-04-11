import Bus from "kefir-bus";
import createDispatch from "./createDispatch";
import { createStoresFactory } from "./createStore";
import combineMiddleware from "./combineMiddleware";

// ---

const defaultOptions = {
  onError(e) {
    throw e;
  },

  abortNestedDispatch: true,
  appMiddleware: [],
  storeMiddleware: []
};

function subject() {
  const bus = new Bus();
  return {
    emitter: bus,
    stream: bus.changes() // create new stream with bus methods removed
  };
}

// ---

export default function setup(rawOptions = {}) {
  const options = { ...defaultOptions, ...rawOptions };
  const { stream, emitter } = subject();

  const actions$ = combineMiddleware(options.appMiddleware)(stream);

  // TODO: move this logic to middleware, remove `onError` option
  actions$.onError(options.onError);

  return {
    dispatch: createDispatch(
      emitter.emit,
      emitter.error,
      options.abortNestedDispatch
    ),

    createStore: createStoresFactory(
      actions$.ignoreErrors(), // stores are not interested in top-level app errors
      { middleware: combineMiddleware(options.storeMiddleware) }
    ),

    close() {
      emitter.end();
    }
  }
}
