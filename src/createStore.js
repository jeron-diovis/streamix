import {
  combine as $combine,
  constant as $constant,
  pool,
  Stream
} from "kefir";

// ---

const noop = () => {};
const identity = x => x;
const constant = x => () => x;

const returnTrue = constant(true);
const returnFalse$ = constant($constant(false));
const conjAll = ar => ar.every(identity);

// ---

function initReducer(params$, initializer, actionType) {
  const reducer = initializer(params$);

  if (!(reducer instanceof Stream)) {
    throw new Error(`[init reducer '${actionType}'] Initializer should return stream, but got ${reducer}`);
  }

  return reducer;
}


function createReducers(params$, initializers) {
  return Object.keys(initializers).map(actionType => initReducer(
    params$
      .filter(([ state, { type } ]) => type === actionType)
      // TODO: leaving just payload is not compatible with Standard Flux Actions. Need to deal with `error` and `meta` props.
      .map(([ state, { payload } ]) => [ state, payload ]),
    initializers[actionType],
    actionType // just for debugging
  ));
}

function catchErrors(stream$) {
  return stream$.withHandler((emitter, event) => {
    try {
      emitter.emitEvent(event);
    } catch (e) {
      emitter.error(e);
    }
  });
}

// ---

export default function createStore(
  actions$,
  handlers,
  initialState = {}
) {
  const stateSources = pool();

  const state$ = stateSources
    .scan(
      (prev, next = prev) => next,
      initialState
    )
    .onAny(noop); // activate stream immediately, so store will receive all dispatched actions

  const reducerParams$ = $combine(
    [ actions$.filter(({ type }) => type in handlers) ],
    // use "passive obs" Kefir feature:
    // state should be always available in reducer,
    // but reducers shouldn't run on state update. Only on action dispatched.
    [ state$.ignoreErrors() ], // ignore errors, because `.combine` does not emit if some of combined streams contains error
    (action, state) => [ state, action ]
  );

  createReducers(
    // whatever happens inside reducer, don't allow for exceptions to ruin app:
    // catch everything and pass to store's errors channel
    catchErrors(reducerParams$),
    handlers
  ).forEach(x => stateSources.plug(x));

  return state$;
}


export function createStoresFactory(
  actions$,
  { middleware = identity } = {}
) {
  const useTransactions = createTransactionsMiddleware(actions$);

  return function storesFactory(
    handlers,
    initialState
  ) {
    return (
      middleware(useTransactions(createStore(actions$, handlers, initialState)))
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
