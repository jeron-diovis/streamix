import {
  constant as $constant,
  pool
} from "kefir";

import createStore from "./createStore";

// ---

const identity = x => x;
const constant = x => () => x;

const returnTrue = constant(true);
const returnFalse$ = constant($constant(false));
const conjAll = ar => ar.every(identity);

// ---

export default function createStoresFactory(
  actions$,
  { middleware = identity } = {}
) {
  const useTransactions = createTransactionsMiddleware(actions$);

  return function storesFactory(reducerInitializers, initialState) {
    return (
      middleware(useTransactions(createStore(actions$, reducerInitializers, initialState)))
        // always call `.toProperty` to force store to have a current state,
        // no matter what middleware does with it
        .toProperty(constant(initialState))
    );
  };
}

// ---

function createTransactionsMiddleware(actions$) {
  let storesCount = 0;
  const storesStateSources = pool();
  const transactions$ = storesStateSources
    // wait for all existing stores
    .bufferWithCount({ valueOf: () => storesCount }) // dynamic buffer size
    // ensure all stores has successfully processed action
    .map(conjAll)
    .toProperty(returnTrue);

  return function transactionsMiddleware(store$) {
    ++storesCount;

    storesStateSources.plug(
      store$
        .map(returnTrue)
        .flatMapErrors(returnFalse$)
        .bufferBy(actions$) // TODO: is it possible to decouple this middleware from actions$ ?
        .map(conjAll)
    );

    return store$
      // flush whenever transaction completed (no matter which store produced it)
      .bufferBy(transactions$)
      // only emit new state if transaction was successful
      .filterBy(transactions$)
      // In array should be 0 or 1 values (i.e. store either processed current action or not).
      // `.flatten` won't emit if array is empty
      .flatten()
  };
}
