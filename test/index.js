import setup from "../src";

let dispatch, createStore;

beforeEach(() => {
  ({ dispatch, createStore } = setup());
});

it("should create basic store", () => {
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
  assert.deepEqual(observer.lastCall.args[0], { foo: 3 });
});

it("should allow custom update strategy for particular store", () => {
  const handler = sinon.spy((state, payload) => state.foo += payload);

  function mutableStrategy(handler, state, payload) {
    handler(state, payload);
    return state;
  }

  function immutableStrategy(handler, state, payload) {
    const newState = Object.create(state);
    handler(newState, payload);
    return newState;
  }

  const handlers = { foo: handler };

  const mutableInitialState = { foo: 0 };
  const immutableInitialState = { ...mutableInitialState };

  const mutableStore = createStore(
    handlers,
    mutableInitialState,
    mutableStrategy
  );

  const immutableStore = createStore(
    handlers,
    immutableInitialState,
    immutableStrategy
  );

  const mutableObserver = sinon.spy();
  mutableStore.onValue(mutableObserver);

  const immutableObserver = sinon.spy();
  immutableStore.onValue(immutableObserver);

  dispatch("foo", 1);
  dispatch("foo", 2);

  assert.equal(mutableObserver.lastCall.args[0], mutableInitialState, "Mutable initial state is not changed");
  assert.notEqual(immutableObserver.lastCall.args[0], immutableInitialState, "Immutable initial state is changed");

  assert.deepEqual(mutableObserver.firstCall.args[0], { foo: 3 }, "Mutable state is not shared across handlers calls");
  assert.deepEqual(immutableObserver.firstCall.args[0], { foo: 0 }, "Immutable state is shared across handlers calls");
});


it("should allow to define mapper stream for particular handler", () => {
  const handler = sinon.spy((state, payload) => state.foo += payload);

  const store = createStore(
    {
      foo: [
        $ => $.filter(x => x > 2),
        handler
      ]
    },
    { foo: 0 }
  );

  const observer = sinon.spy();
  store.onValue(observer);
  dispatch("foo", 1);
  dispatch("foo", 2);
  dispatch("foo", 3);

  assert.equal(handler.callCount, 1);
  assert.deepEqual(observer.lastCall.args[0], { foo: 3 });
});