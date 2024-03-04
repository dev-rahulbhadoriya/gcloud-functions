const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const ts_sheet1Base = airtable.base("appZgacNbVddBsAYT");

const tsbase = {
  1: airtable.base("appZgacNbVddBsAYT"),

};
module.exports = {
  ts_sheet1Base,
  tsbase,
};
