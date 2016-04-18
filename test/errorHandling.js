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
    app = setup({
      appMiddleware: [ $ => $.onError(onError) ]
    });

    assert.doesNotThrow(() => app.dispatch());
    assert.equal(onError.callCount, 1, "'onError' handler is not called");
    assert.isTrue(onError.firstCall.returned("we have a problem"));
  });


  it("should not pass store-level errors to app-level handler", () => {
    const onError = sinon.spy();
    app = setup({
      appMiddleware: [ $ => $.onError(onError) ]
    });
    app.createStore({ foo: $ => $.map(() => { throw new Error("test error"); }) });

    assert.doesNotThrow(() => app.dispatch("foo"));
    assert.isFalse(onError.called);
  });

  describe("transactions", () => {

    beforeEach(() => {
      app = setup();
    });

    describe("should keep previous state when particular handler throws (when using immutable data)", () => {

      it("for single store", () => {
        const store = app.createStore(
          {
            foo: $ => $.map(([ state, payload ]) => ({ ...state, foo: state.foo + payload })),
            bar: $ => $.map(state => {
              state.bar = true;
              throw new Error("test error");
            })
          },
          { foo: 0 }
        );

        const observer = sinon.spy();
        store.onValue(observer);

        app.dispatch("foo", 1);
        app.dispatch("bar");
        app.dispatch("foo", 2);

        assert.equal(observer.callCount, 3);
        assert.deepEqual(observer.lastCall.args[0], { foo: 3 });
      });

      it("for multiple stores", () => {
        const fooObserver = sinon.spy();
        const barObserver = sinon.spy();

        const storeFoo = app.createStore(
          {
            foo: $ => $.map(([ state, payload ]) => {
              if (payload > 1) {
                throw new Error("test error");
              }
              return { ...state, foo: state.foo + payload };
            })
          },
          { foo: 0 }
        ).onValue(fooObserver);

        const storeBar = app.createStore(
          {
            bar: $ => $.map(([ state, payload ]) => ({ ...state, bar: state.bar + payload })),
            foo: $ => $.map(([ state, payload ]) => ({ ...state, foo_bar: state.foo_bar + payload }))
          },
          { bar: 0, foo_bar: 0 }
        ).onValue(barObserver);

        app.dispatch("foo", 1);
        app.dispatch("bar", 2);
        app.dispatch("foo", 3);

        assert.equal(fooObserver.callCount, 2);
        assert.equal(barObserver.callCount, 3);
        assert.deepEqual(fooObserver.lastCall.args[0], { foo: 1 });
        assert.deepEqual(barObserver.lastCall.args[0], { bar: 2, foo_bar: 1 });
      });

    });
  });
});