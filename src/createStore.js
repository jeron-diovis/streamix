import { merge as $merge, constant as $constant, pool } from "kefir";
import { defaultMutableStrategy } from "./storeUpdateStrategies";

// ---

const noop = () => {};
const identity = x => x;
const constant = x => () => x;

const returnTrue = constant(true);
const returnFalse$ = constant($constant(false));
const conjAll = ar => ar.every(identity);

// ---

function parseHandler(payloads$, val) {
  const [ initMapper, handler ] = (Array.isArray(val) ? val : [ identity, val ]);
  return initMapper(payloads$).map(payload => ({ payload, handler }));
}


function composeHandlersStream(actions$, handlersMap) {
  return $merge(
    Object.keys(handlersMap).map(actionType => parseHandler(
      actions$.filter(({ type }) => type === actionType).map(({ payload }) => payload),
      handlersMap[actionType]
    ))
  );
}

// ---

export default function createStore(
  actions$,
  handlers = {},
  initialState = {},
  strategy = defaultMutableStrategy
) {
  return (
    composeHandlersStream(
      actions$.filter(({ type }) => type in handlers),
      handlers
    )
    .scan(
      ({ state, error }, { handler, payload }) => {
        try {
          return {
            state: strategy(handler, state, payload),
            error: null
          };
        } catch (error) {
          return { state, error };
        }
      },
      { state: initialState, error: null }
    )
    // same can be done via `.flatMap`, but why need to instantiate new stream on each event?
    .withHandler((emitter, event) => {
      if (event.type === "end") {
        emitter.end();
      } else {
        const { state, error } = event.value;
        error == null ? emitter.emit(state) : emitter.error(error);
      }
    })
    .onAny(noop) // activate stream immediately, so store will receive all dispatched actions
  );
}


export function createStoresFactory(
  actions$,
  {
    middleware = identity,
    defaultUpdateStrategy = defaultMutableStrategy
  } = {}
) {
  const useTransactions = createTransactionsMiddleware(actions$);

  return function storesFactory(
    handlers,
    initialState,
    strategy = defaultUpdateStrategy
  ) {
    return (
      middleware(useTransactions(createStore(actions$, handlers, initialState, strategy)))
        // always call `.toProperty` to force store to have a current state,
        // no matter what middleware does with it
        .toProperty(constant(initialState))
    );
  };
}

// ---

function createTransactionsMiddleware(actions$) {
  let storesCount = 0;
  const storesPool$ = pool();
  const transactions$ = storesPool$
    // wait for all existing stores
    .bufferWithCount({ valueOf: () => storesCount }) // dynamic buffer size
    // ensure all stores has successfully processed action
    .map(conjAll)
    .toProperty(returnTrue);

  return function transactionsMiddleware(store$) {
    ++storesCount;

    storesPool$.plug(
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
