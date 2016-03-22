import setup from "../src";

let dispatch, createStore;

beforeEach(() => {
  ({ dispatch, createStore } = setup());
});

it("should create store", () => {
  const handler = sinon.spy((state, payload) => state.foo += payload);

  const store = createStore(
    { foo: handler },
    { foo: 0 }
  );

  dispatch("foo", 1);
  const observer = sinon.spy();
  store.onValue(observer);
  dispatch("foo", 2);
  dispatch("bar", 10);

  const listener = sinon.spy();
  store.onValue(listener);

  assert.equal(handler.callCount, 2);
  assert.equal(handler.getCall(0).args[1], 1);
  assert.equal(handler.getCall(1).args[1], 2);
  assert.deepEqual(listener.getCall(0).args[0], { foo: 3 });
});


it("should require non-empty action type", () => {
  assert.throws(
    () => dispatch(),
    /Action type is empty/
  )
});