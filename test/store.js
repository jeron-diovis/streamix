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

  it("should invoke observer with current state immediately as it added", () => {
    const store = app.createStore({}, { foo: 0 });

    const observer = sinon.spy();
    store.onValue(observer);

    assert.equal(observer.callCount, 1, "Observer is not called on subscription");
    assert.deepEqual(observer.firstCall.args[0], { foo: 0 }, "Observer does not receive current state");
  });


  it("should react to actions only when it has handlers for it", () => {
    const fooStore = app.createStore();
    const fooObserver = sinon.spy();

    const barStore = app.createStore({
      foo() {}
    });
    const barObserver = sinon.spy();

    fooStore.onValue(fooObserver);
    barStore.onValue(barObserver);

    app.dispatch("foo");

    assert.equal(fooObserver.callCount, 1);
    assert.equal(barObserver.callCount, 2);
  });


  it("should process actions dispatched before first subscriber added", () => {
    const handler = sinon.spy((state, payload) => state.foo += payload);
    const observer = sinon.spy();

    const store = app.createStore(
      { foo: handler },
      { foo: 0 }
    );

    app.dispatch("foo", 1);
    store.onValue(observer);
    app.dispatch("foo", 2);

    assert.equal(handler.callCount, 2);
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
    it("should allow to set default strategy for all stores and personal strategy for each particular store", () => {
      app = setup({
        defaultUpdateStrategy: function simpleImmutableStrategy(handler, state, payload) {
          const newState = Object.create(state);
          handler(newState, payload);
          return newState;
        }
      });

      const defaultInitialState = { foo: 0 };

      const defaultObserver = sinon.spy();
      const customObserver = sinon.spy();

      const defaultStore = app.createStore(
        { foo: (state, payload) => state.foo += payload },
        defaultInitialState
      );

      const customStore = app.createStore(
        { foo: (state, payload) => state + payload },
        0,
        (handler, state, payload) => handler(state, payload)
      );

      defaultStore.onValue(defaultObserver);
      customStore.onValue(customObserver);

      app.dispatch("foo", 1);
      app.dispatch("foo", 2);

      const defaultFinalState = defaultObserver.lastCall.args[0];
      const customFinalState = customObserver.lastCall.args[0];

      assert.deepEqual(defaultFinalState, { foo: 3 });
      assert.notEqual(defaultFinalState, defaultInitialState);

      assert.equal(customFinalState, 3);
    });
  });
});
