import Bus from "kefir-bus";
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
  const errors$ = new Bus();
  return (
    composeHandlersStream(actions$.filter(({ type }) => type in handlers), handlers)
    .scan(
      (state, { handler, payload }) => {
        try {
          return strategy(handler, state, payload);
        } catch (e) {
          // .scan should not return errors, because it will reset it's state
          // @link https://github.com/rpominov/kefir/blob/c7870c6289d15a6037d8f0470229f03b04a23e56/src%2Fone-source%2Fscan.js#L22-L23
          errors$.error(e);
          return state;
        }
      },
      initialState
    )
    .merge(errors$)
    .toProperty() // store always has a current value
    .onAny(noop) // activate stream immediately, so store will receive all dispatched actions
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
