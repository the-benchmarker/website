import { decodeDelimitedArray, encodeDelimitedArray } from "use-query-params";

export const CommaArrayParam = {
  encode: (array: string[] | null | undefined) =>
    encodeDelimitedArray(array, ","),

  decode: (arrayStr: string | (string | null)[] | null | undefined) =>
    decodeDelimitedArray(arrayStr, ","),
};
