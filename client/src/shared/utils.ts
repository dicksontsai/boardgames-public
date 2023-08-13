// TODO: Share backend code with frontend, then remove this file.

export function renderArray<T>(arr?: Array<T>) {
  if (arr === undefined) {
    return "";
  }
  return `[${arr.join(",")}]`;
}
