import setup from "../src";

describe("store", () => {
  let app;

  beforeEach(() => {
    app = setup();
  });

  afterEach(() => {
    app.close();
    app = null;
  });

  // ---

  it("should create basic store", () => {
    const handler = sinon.spy((state, payload) => state.foo += payload);

    const store = app.createStore(
      { foo: handler },
      { foo: 0 }
    );

    app.dispatch("foo", 1);
    const observer = sinon.spy();
    store.onValue(observer);
    app.dispatch("foo", 2);
    app.dispatch("bar", 10);

    assert.equal(handler.callCount, 2);
    assert.equal(handler.getCall(0).args[1], 1);
    assert.equal(handler.getCall(1).args[1], 2);
    assert.deepEqual(observer.lastCall.args[0], { foo: 3 });
  });

  it("should allow to define mapper stream for particular handler", () => {
    const handler = sinon.spy((state, payload) => state.foo += payload);

    const store = app.createStore(
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
    app.dispatch("foo", 1);
    app.dispatch("foo", 2);
    app.dispatch("foo", 3);

    assert.equal(handler.callCount, 1);
    assert.deepEqual(observer.lastCall.args[0], { foo: 3 });
  });

  describe("update strategies", () => {
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

      const mutableStore = app.createStore(
        handlers,
        mutableInitialState,
        mutableStrategy
      );

      const immutableStore = app.createStore(
        handlers,
        immutableInitialState,
        immutableStrategy
      );

      const mutableObserver = sinon.spy();
      mutableStore.onValue(mutableObserver);

      const immutableObserver = sinon.spy();
      immutableStore.onValue(immutableObserver);

      app.dispatch("foo", 1);
      app.dispatch("foo", 2);

      assert.equal(mutableObserver.lastCall.args[0], mutableInitialState, "Mutable initial state is not changed");
      assert.notEqual(immutableObserver.lastCall.args[0], immutableInitialState, "Immutable initial state is changed");

      assert.deepEqual(mutableObserver.firstCall.args[0], { foo: 3 }, "Mutable state is not shared across handlers calls");
      assert.deepEqual(immutableObserver.firstCall.args[0], { foo: 0 }, "Immutable state is shared across handlers calls");
    });

    it("should allow to set default update strategy for all app stores", () => {
      app = setup({
        defaultStoreUpdateStrategy: function immutableStrategy(handler, state, payload) {
          const newState = Object.create(state);
          handler(newState, payload);
          return newState;
        }
      });

      const initialState = { foo: 0 };

      const store = app.createStore(
        { foo: (state, payload) => state.foo += payload },
        initialState
      );

      const observer = sinon.spy();
      store.onValue(observer);

      app.dispatch("foo", 1);
      app.dispatch("foo", 2);

      const finalState = observer.lastCall.args[0];
      assert.deepEqual(finalState, { foo: 3 });
      assert.notEqual(finalState, initialState);
    });
  });
});
