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
    const fooStore = app.createStore({});
    const fooObserver = sinon.spy();

    const barStore = app.createStore({ foo: $ => $ });
    const barObserver = sinon.spy();

    fooStore.onValue(fooObserver);
    barStore.onValue(barObserver);

    app.dispatch("foo");

    assert.equal(fooObserver.callCount, 1);
    assert.equal(barObserver.callCount, 2);
  });


  it("should process actions dispatched before first subscriber added", () => {
    const handler = sinon.spy(([ state, { payload } ]) => {
      state.foo += payload;
      return state;
    });
    const observer = sinon.spy();

    const store = app.createStore(
      { foo: $ => $.map(handler) },
      { foo: 0 }
    );

    app.dispatch("foo", 1);
    store.onValue(observer);
    app.dispatch("foo", 2);

    assert.equal(handler.callCount, 2);
    assert.deepEqual(observer.lastCall.args[0], { foo: 3 });
  });
});
