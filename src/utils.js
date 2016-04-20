import { Observable } from "kefir";

export const noop = () => {};
export const identity = x => x;
export const constant = x => () => x;
export const isStream = x => x instanceof Observable;
