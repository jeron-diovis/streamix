import setup from "../src";

let dispatch, createStore;

describe("error handling", () => {
  describe("without onError handler", () => {
    beforeEach(() => {
      ({ dispatch, createStore } = setup());

      createStore({ foo() { throw new Error("test error"); } });
    });

    it("should throw errors by default", () => {
      assert.throws(() => dispatch("foo"), /test error/);
    });
  });


  describe("with onError handler", () => {
    let onError;

    beforeEach(() => {
      onError = sinon.spy(e => "we have a problem");

      ({ dispatch, createStore } = setup({ onError }));

      createStore({ foo() { throw new Error("test error"); } });
    });

    it("should catch errors and pass to onError handler", () => {
      assert.doesNotThrow(() => dispatch("foo"));
      assert.equal(onError.callCount, 1);
      assert.isTrue(onError.firstCall.returned("we have a problem"));
    });
  });
});