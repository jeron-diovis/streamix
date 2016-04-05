import setup from "../src";

describe("error handling", () => {
  let app;

  afterEach(() => {
    app.close();
    app = null;
  });

  // ---

  it("should allow to intercept top-level app errors", () => {
    const onError = sinon.spy(e => "we have a problem");
    app = setup({ onError });

    assert.doesNotThrow(() => app.dispatch());
    assert.equal(onError.callCount, 1, "'onError' handler is not called");
    assert.isTrue(onError.firstCall.returned("we have a problem"));
  });


  it("should not pass store-level errors to app-level handler", () => {
    const onError = sinon.spy();
    app = setup({ onError });
    app.createStore({ foo() { throw new Error("test error"); } });

    assert.doesNotThrow(() => app.dispatch("foo"));
    assert.isFalse(onError.called);
  });


  it("should keep previous state when particular handler throws", () => {
    app = setup({
      defaultStoreUpdateStrategy: function immutableStrategy(handler, state, payload) {
        const newState = Object.create(state);
        handler(newState, payload);
        return newState;
      }
    });

    const initialState = { foo: 0 };

    const store = app.createStore(
      {
        foo: (state, payload) => state.foo += payload,
        bar(state) {
          state.bar = true;
          throw new Error("test error");
        }
      },
      initialState
    );

    const observer = sinon.spy();
    store.onValue(observer);

    app.dispatch("foo", 1);
    app.dispatch("bar");
    app.dispatch("foo", 2);

    const finalState = observer.lastCall.args[0];
    assert.deepEqual(finalState, { foo: 3 });
  });
});