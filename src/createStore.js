import Kefir from "kefir";

// ---

const identity = x => x;
const noop = () => {};

// ---

function parseHandler(payloads$, val) {
  const [ initMapper, handler ] = (Array.isArray(val) ? val : [ identity, val ]);
  return initMapper(payloads$).map(payload => ({ payload, handler }));
}

function composeHandlersStream(actions$, handlersMap) {
  return Kefir.merge(
    Object.keys(handlersMap).map(actionType => parseHandler(
      actions$.filter(({ type }) => type === actionType).map(({ payload }) => payload),
      handlersMap[actionType]
    ))
  );
}

// ---

function defaultUpdateStrategy(handler, state, payload) {
  handler(state, payload);
  return state;
}

// ---

export default function createStoreInternal(
  actions$,
  handlers = {},
  initialState = {},
  strategy = defaultUpdateStrategy
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
