const airtable = require("airtable");

airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const attendanceDataInternalBase1 = airtable.base("appNPl6B3Yy1nqd7r");

const attendanceDataInternalBases = {
  1: airtable.base("appNPl6B3Yy1nqd7r"),
};

module.exports = {
  attendanceDataInternalBases,
  attendanceDataInternalBase1,
};
