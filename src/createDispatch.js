export default function createDispatch(emitData, emitError, abortNestedDispatch = true) {
  const stack = [];

  return function dispatch(...args) {
    const action = createAction(...args);

    if (action instanceof Error) {
      emitError(action);
      return;
    }

    const { type: actionType } = action;

    if (actionType == null) {
      emitError(new Error("[dispatch] Action type is empty"));
      return;
    }

    if (stack.length > 0) {
      emitError(new Error(
        `[dispatch] A "dispatch(${actionType})" was called, but "dispatch(${stack[stack.length - 1]})" is already executing.\n`
        + (abortNestedDispatch
          ? `Handling of "dispatch(${actionType})" will be aborted.`
          : "This potentially means circular updates and should be avoided.")
      ));

      if (abortNestedDispatch) {
        return;
      }
    }

    stack.push(actionType);

    try {
      emitData(action);
    } catch (e) {
      emitError(e);
    }

    stack.pop();

    // no returned value
  };
}

// ---

function createAction(first, second) {
  if (first && first.constructor === Object) {
    if (arguments.length > 1) {
      return new Error("[dispatch] If action object is used, no other arguments should be passed");
    }
    return first;
  }

  return { type: first, payload: second };
}