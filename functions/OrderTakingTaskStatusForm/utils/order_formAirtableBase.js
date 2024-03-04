const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const orderTaskformBase = airtable.base("app9yXcTkagawkpWK");

module.exports = {
    orderTaskformBase,
};