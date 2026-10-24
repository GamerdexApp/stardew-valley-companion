/** Keeps the items whose name or any of the given texts contain the search words. */
export const searchItems = <T extends { name: string }>(
  items: T[],
  query: string,
  texts: (item: T) => (string | null | undefined)[] = () => [],
): T[] => {
  const needle = query.trim().toLowerCase();
  return items.filter((item) =>
    [item.name, ...texts(item)].some((text) =>
      text?.toLowerCase().includes(needle),
    ),
  );
};
