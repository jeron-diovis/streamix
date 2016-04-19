import { Stream } from "kefir";

export default function combineMiddleware(list) {
  if (list.length === 0) {
    return x => x;
  }

  return list.map(parse).reduce(pipe);
}

// ---

const pipe = (curr, next) => x => next(curr(x));

function parse(middleware) {
  return function parsedMiddleware(stream) {
    const res = middleware(stream);

    if (!(res instanceof Stream)) {
      throw new Error(`[combine middleware] Middleware must return a stream, but got ${res}`);
    }

    return res;
  }
}
