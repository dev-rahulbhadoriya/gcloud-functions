const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const AIFBaseData = airtable.base("appAzbzdVDejF1efO");

module.exports = {
  AIFBaseData,
};
