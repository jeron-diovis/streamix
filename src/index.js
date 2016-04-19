import Bus from "kefir-bus";
import createDispatch from "./createDispatch";
import createStoresFactory from "./createStoresFactory";
import combineMiddleware from "./combineMiddleware";

// ---

const defaultErrorHandler = $ => $.onError(e => { throw e; });

const defaultOptions = {
  appMiddleware: [ defaultErrorHandler ],
  storeMiddleware: [],
  reducerMiddleware: [],
  abortNestedDispatch: true
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

  return {
    dispatch: createDispatch(
      emitter.emit,
      emitter.error,
      options.abortNestedDispatch
    ),

    createStore: createStoresFactory(
      actions$.ignoreErrors(), // stores are not interested in top-level app errors
      {
        storeMiddleware: options.storeMiddleware,
        reducerMiddleware: options.reducerMiddleware
      }
    ),

    close() {
      emitter.end();
    }
  }
}
