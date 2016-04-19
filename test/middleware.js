import setup from "../src";

describe("middleware", () => {
  let app;


  describe("for app", () => {

    afterEach(() => {
      app.close();
      app = null;
    });

    it("should use 'appMiddleware' option to patch actions stream", () => {
      const spy = sinon.spy();

      app = setup({
        appMiddleware: [
          $ => $.onValue(spy)
        ]
      });

      app.dispatch("foo");

      assert.equal(spy.callCount, 1, "spy from app middleware was not called");
    });
  });

  describe("for stores", () => {

    afterEach(() => {
      app.close();
      app = null;
    });

    it("should use 'storeMiddleware' option to patch store output stream", () => {
      const spy = sinon.spy();

      app = setup({
        storeMiddleware: [
          $ => $.onError(spy)
        ]
      });

      app.createStore({
        foo: $ => $.map(() => { throw new Error("test error"); })
      });

      app.dispatch("foo");

      assert.equal(spy.callCount, 1, "spy from store middleware was not called");
    });


    it("should use 'reducerMiddleware' option to patch each store's reducer input stream", () => {
      const fooSpy = sinon.spy();
      const barSpy = sinon.spy();

      app = setup({
        reducerMiddleware: [
          $ => $.map(([ state, { payload } ]) => payload)
        ]
      });

      app.createStore({
        foo: $ => $.onValue(fooSpy),
        bar: $ => $.onValue(barSpy)
      });

      app.dispatch("foo", 1);
      app.dispatch("bar", 2);

      assert.isTrue(fooSpy.calledWithExactly(1));
      assert.isTrue(barSpy.calledWithExactly(2));
    });


    it("should concat 'reducerMiddleware' array from stores factory with own 'middleware' array for particular store", () => {
      const spy = sinon.spy();

      app = setup({
        reducerMiddleware: [
          $ => $.map(([ state, { payload } ]) => payload)
        ]
      });

      app.createStore(
        { foo: $ => $.onValue(spy) },
        undefined,
        { middleware: [ $ => $.map(x => x * 2) ] }
      );

      app.dispatch("foo", 42);

      assert.isTrue(spy.calledWithExactly(84));
    });


    it("should ensure that store always has a current value", () => {
      const spy = sinon.spy();

      app = setup({
        storeMiddleware: [
          $ => $.changes()
        ]
      });

      const store = app.createStore({ foo: $ => $ });

      app.dispatch("foo");

      store.onValue(spy);
      store.onValue(spy);

      assert.equal(spy.callCount, 2, "store is not a property");
    });

  });

  it("should require middleware to return a stream", () => {
    assert.throws(
      () => {
        setup({
          appMiddleware: [
            $ => 42
          ]
        })
      },
      /Middleware must return a stream/
    );
  });
});
