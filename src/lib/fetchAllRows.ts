// Loads every row past the 1000-row server limit by paging with range().
export async function fetchAllRows<T = any>(build: () => any, pageSize = 1000): Promise<{ data: T[]; error: any }> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await build().range(from, from + pageSize - 1);
    if (error) return { data: rows, error };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) break;
  }
  return { data: rows, error: null };
}
