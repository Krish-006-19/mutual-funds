function parseData(body) {
  if (!body) return [];

  const rows = body.replace(/\r?\n/g, "\n").trim().split("\n");
  if (rows.length < 2) return [];

  const headers = rows[0].split(";");
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => row.split(";"))
    .filter((cols) => cols.length === 6)
    .map((cols) => {
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = cols[idx];
      });
      return obj;
    });
}

module.exports = parseData;