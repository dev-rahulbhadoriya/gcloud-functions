const airtable = require("airtable");

airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const VSTInternalBase1 = airtable.base("appUJ43HYIc187xMs");

const VSTInternalBases = {
  1: airtable.base("appUJ43HYIc187xMs"),
};

module.exports = {
  VSTInternalBase1,
  VSTInternalBases,
};
