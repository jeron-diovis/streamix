import {
  combine as $combine,
  pool,
  Stream
} from "kefir";

import combineMiddleware from "./combineMiddleware";

// ---

const noop = () => {};

// ---


export default function createStore(
  actions$,
  reducerInitializers,
  initialState = {},
  { middleware = [] } = {}
) {
  const stateSources = pool();

  const state$ = stateSources
    .scan(
      (prev, next = prev) => next,
      initialState
    )
    .onAny(noop); // activate stream immediately, so store will receive all dispatched actions

  const reducerParams$ = $combine(
    [ actions$.filter(({ type }) => type in reducerInitializers) ],
    // use "passive obs" Kefir feature:
    // state should be always available in reducer,
    // but reducers shouldn't run on state update. Only on action dispatched.
    [ state$.ignoreErrors() ], // ignore errors, because `.combine` does not emit if some of combined streams contains error
    (action, state) => [ state, action ]
  );

  createReducers(
    // whatever happens inside reducer, don't allow for exceptions to ruin app:
    // catch everything and pass to store's errors channel
    // TODO: caught exceptions should not be passed to reducers. Or, maybe, wrap each reducer to `catchErrors` separately
    catchErrors(reducerParams$),
    reducerInitializers,
    combineMiddleware(middleware)
  ).forEach(x => stateSources.plug(x));

  return state$;
}


// ---

function catchErrors(stream$) {
  return stream$.withHandler((emitter, event) => {
    try {
      emitter.emitEvent(event);
    } catch (e) {
      emitter.error(e);
    }
  });
}

function createReducers(params$, initializers, middleware) {
  return Object.keys(initializers).map(actionType => initReducer(
    params$.filter(([ state, { type } ]) => type === actionType),
    initializers[actionType],
    middleware,
    actionType // just for debugging
  ));
}

function initReducer(params$, initializer, middleware, actionType) {
  const reducer = initializer(middleware(params$));

  if (!(reducer instanceof Stream)) {
    throw new Error(`[init reducer '${actionType}'] Initializer should return stream, but got ${reducer}`);
  }

  return reducer;
}
