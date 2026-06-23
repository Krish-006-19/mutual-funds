function parseData(body) {
  if (!body) return [];

  const lines = body
    .replace(/\r/g, "")
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const result = [];

  let headers = null;
  let currentCategory = null;
  let currentAMC = null;

  for (const line of lines) {

    if (line.includes("Schemes(")) {
      const match = line.match(/\((.*?)\)/);
      currentCategory = match ? match[1] : line;
      continue;
    }

    if (line.startsWith("Scheme Code") && line.includes(";")) {
      headers = line.split(";");
      continue;
    }

    if (!line.includes(";") && !line.startsWith("Scheme Code")) {
      currentAMC = line;
      continue;
    }

    if (line.includes(";") && headers) {
      const cols = line.split(";");

      if (cols.length < headers.length) continue;

      const obj = {};

      headers.forEach((h, i) => {
        obj[h] = cols[i] || null;
      });

      obj.category = currentCategory;
      obj.amc = currentAMC;

      result.push(obj);
    }
  }

  return result;
}
module.exports = parseData;