import setup from "../src";

describe("error handling", () => {
  let app;

  afterEach(() => {
    app.close();
    app = null;
  });

  // ---

  describe("without onError handler", () => {
    beforeEach(() => {
      app = setup();
      app.createStore({ foo() { throw new Error("test error"); } });
    });

    it("should throw errors by default", () => {
      assert.throws(() => app.dispatch("foo"), /test error/);
    });
  });


  describe("with onError handler", () => {
    let onError;

    beforeEach(() => {
      onError = sinon.spy(e => "we have a problem");
      app = setup({ onError });

      app.createStore({ foo() { throw new Error("test error"); } });
    });

    it("should catch errors and pass to onError handler", () => {
      assert.doesNotThrow(() => app.dispatch("foo"));
      assert.equal(onError.callCount, 1);
      assert.isTrue(onError.firstCall.returned("we have a problem"));
    });
  });
});