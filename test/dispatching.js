import setup from "../src";

describe("dispatching", () => {
  let app;

  beforeEach(() => {
    app = setup();
  });

  afterEach(() => {
    app.close();
    app = null;
  });

  // ---

  it("should require non-empty action type", () => {
    assert.throws(() => app.dispatch(),
      /Action type is empty/
    );
  });

  it("should accept FSA as a single param", () => {
    const spy = sinon.spy();

    app.createStore({
      foo: $ => $.map(spy)
    });

    app.dispatch({ type: "foo", payload: 42 });

    assert.isTrue(spy.calledOnce);
    assert.deepEqual(spy.firstCall.args[0][1], { type: "foo", payload: 42 });

    assert.throws(() => app.dispatch({ type: "foo" }, 42),
      /If action object is used, no other arguments should be passed/
    );

    assert.throws(() => app.dispatch({ payload: "42" }),
      /Action type is empty/
    );
  });

  describe("nested dispatching", () => {
    it("should abort processing of nested `dispatch` calls by default", () => {
      const onError = sinon.spy();

      app = setup({
        appMiddleware: [ $ => $.onError(onError) ]
      });

      const barHandler = sinon.spy();

      app.createStore({
        foo: $ => $.map(() => {
          app.dispatch("bar");
        }),
        bar: $ => $.map(barHandler)
      });

      app.dispatch("foo");

      assert.match(onError.firstCall.args[0].message, /"dispatch\(bar\)" was called, but "dispatch\(foo\)" is already executing/);
      assert.isFalse(barHandler.called, "nested dispatch is executed");
    });


    it("should not abort nested `dispatch` calls if explicitly allowed", () => {
      const onError = sinon.spy();

      app = setup({
        appMiddleware: [ $ => $.onError(onError) ],
        abortNestedDispatch: false
      });

      const barHandler = sinon.spy();

      app.createStore({
        foo: $ => $.map(() => {
          app.dispatch("bar");
        }),
        bar: $ => $.map(barHandler)
      });

      app.dispatch("foo");

      assert.match(onError.firstCall.args[0].message, /"dispatch\(bar\)" was called, but "dispatch\(foo\)" is already executing/);
      assert.isTrue(barHandler.called, "nested dispatch is not executed");
    });
  });
});
