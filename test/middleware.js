import setup from "../src";

describe("middleware", () => {
  let app;


  describe("for app", () => {

    afterEach(() => {
      app.close();
      app = null;
    });

    it("should use 'appMiddleware' option", () => {
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

    it("should use 'storeMiddleware' option", () => {
      const spy = sinon.spy();

      app = setup({
        storeMiddleware: [
          $ => {
            $.onError(spy);
            // don't return
          }
        ]
      });

      app.createStore({
        foo() { throw new Error("test error"); }
      });

      app.dispatch("foo");

      assert.equal(spy.callCount, 1, "spy from store middleware was not called");
    });

    it("should ensure that store always has a current value", () => {
      const spy = sinon.spy();

      app = setup({
        storeMiddleware: [
          $ => $.changes()
        ]
      });

      const store = app.createStore({
        foo() {}
      });

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
      /Middleware must return either stream or undefined/
    );
  });

  it("should use source stream if middleware returns undefined", () => {
    assert.doesNotThrow(
      () => {
        app = setup({
          appMiddleware: [
            $ => {}
          ]
        });
      }
    );

    // everything should still work,
    // even though nothing middleware has returned nothing instead of actions stream
    const spy = sinon.spy();
    app.createStore({ foo() {} }).onValue(spy);
    app.dispatch("foo");
    assert.equal(spy.callCount, 2);
  });
});
