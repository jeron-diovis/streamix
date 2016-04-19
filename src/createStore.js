import { combine as $combine, pool } from "kefir";
import { isStream, noop } from "./utils";
import combineMiddleware from "./combineMiddleware";

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
    reducerParams$,
    reducerInitializers,
    combineMiddleware(middleware)
  ).forEach(x => stateSources.plug(x));

  return state$;
}


// ---

function createReducers(params$, initializers, middleware) {
  return Object.keys(initializers).map(actionType => initReducer(
    params$.filter(([ state, { type } ]) => type === actionType),
    initializers[actionType],
    middleware,
    actionType // just for debugging
  ));
}

function initReducer(params$, initializer, middleware, actionType) {
  // Whatever happens inside reducer, don't allow for exceptions to ruin app.
  // So catch everything and pass to errors channel
  const reducer = initializer(middleware(catchErrors(params$)));

  if (!isStream(reducer)) {
    throw new Error(`[init reducer '${actionType}'] Initializer should return stream, but got ${reducer}`);
  }

  return reducer;
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
