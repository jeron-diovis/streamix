import setup from "../src";

let dispatch, createStore;

describe("error handling", () => {
  describe("with onError handler", () => {
    beforeEach(() => {
      ({ dispatch, createStore } = setup({
        onError(e) {
          throw e;
        }
      }));

      createStore({ foo() { throw new Error("test error"); } });
    });

    it("should catch errors and pass to onError handler", () => {
      assert.throws(() => dispatch("foo"),
        /test error/
      );
    });

    it("should require non-empty action type", () => {
      assert.throws(() => dispatch(),
        /Action type is empty/
      );
    });
  });

  describe("without onError handler", () => {
    beforeEach(() => {
      ({ dispatch, createStore } = setup());
    });

    it("should swallow errors silently", () => {
      assert.doesNotThrow(() => dispatch("foo"));
    });
  });
});