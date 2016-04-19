import { isStream } from "./utils";

export default function combineMiddleware(list) {
  if (list.length === 0) {
    return x => x;
  }
  return list.map(parse).reduce(pipe);
}

// ---

const pipe = (curr, next) => x => next(curr(x));

const parse = middleware => stream => {
  const res = middleware(stream);
  if (!isStream(res)) {
    throw new Error(`[combine middleware] Middleware must return a stream, but got ${res}`);
  }
  return res;
};
