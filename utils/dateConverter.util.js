function convertDate(date) {
  const monthMap = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };

  const [day, month, year] = date.split("-");
  return `${day}-${monthMap[month.toLowerCase()]}-${year}`;
}

module.exports = convertDate;