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

  assert.equal(handler.callCount, 2);
  assert.equal(handler.getCall(0).args[1], 1);
  assert.equal(handler.getCall(1).args[1], 2);
});
