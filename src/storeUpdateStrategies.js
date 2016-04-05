export function defaultMutableStrategy(handler, state, payload) {
  handler(state, payload);
  return state;
}
