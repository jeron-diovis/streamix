export default function createDispatch(emitData, emitError, abortNestedDispatch = true) {
  let dispatching;

  return function dispatch(actionType, payload) {
    if (actionType == null) {
      emitError(new Error("[dispatch] Action type is empty"));
      return;
    }

    if (dispatching) {
      emitError(new Error(
        `[dispatch] A "dispatch(${actionType})" was called, but "dispatch(${dispatching})" is already executing.\n`
        + (abortNestedDispatch
          ? `Handling of "dispatch(${actionType})" will be aborted.`
          : `This potentially means circular updates and should be avoided.`)
      ));

      if (abortNestedDispatch) {
        return;
      }
    }

    dispatching = actionType;

    try {
      emitData({ type: actionType, payload });
    } catch (e) {
      emitError(e);
    } finally {
      dispatching = null;
    }

    // no returned value
  };
}
