// Construye "SET col1 = $3, col2 = $4" solo con los campos recibidos (para los PATCH).
// Los nombres de columna salen de una lista fija, nunca de lo que envía el cliente.
export function buildSet(data, allowed, firstParam) {
  const columns = allowed.filter((col) => data[col] !== undefined);
  return {
    sql: columns.map((col, i) => `${col} = $${firstParam + i}`).join(', '),
    values: columns.map((col) => data[col]),
  };
}
