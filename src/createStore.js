import { merge as merge$ } from "kefir";
import { defaultMutableStrategy } from "./storeUpdateStrategies";

// ---

const identity = x => x;
const noop = () => {};

// ---

function parseHandler(payloads$, val) {
  const [ initMapper, handler ] = (Array.isArray(val) ? val : [ identity, val ]);
  return initMapper(payloads$).map(payload => ({ payload, handler }));
}

function composeHandlersStream(actions$, handlersMap) {
  return merge$(
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
    composeHandlersStream(actions$.filter(({ type }) => type in handlers), handlers)
    .scan(
      (state, { handler, payload }) => strategy(handler, state, payload),
      initialState
    )
    .onAny(noop) // ensure stream is activated and ready to accept events
  );
}


export function createStoresFactory(
  actions$,
  defaultStrategy = defaultMutableStrategy
) {
  return function storesFactory(
    handlers,
    initialState,
    strategy = defaultStrategy
  ) {
    return createStore(actions$, handlers, initialState, strategy);
  };
}
