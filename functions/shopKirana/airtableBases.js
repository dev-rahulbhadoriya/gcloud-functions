const airtable = require("airtable");

airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const shopKiranaInternalBase1 = airtable.base("appW3VOirZwBN36dh");

const shopKiranaInternalBases = {
  1: airtable.base("appW3VOirZwBN36dh"),
};

const shopKiranaAllotmentBase1 = airtable.base("appaNJdbVLC1geu31");
const shopKiranaAllotmentBases = {
  1: airtable.base("appaNJdbVLC1geu31"),
};

module.exports = {
  shopKiranaInternalBase1,
  shopKiranaInternalBases,
  shopKiranaAllotmentBase1,
  shopKiranaAllotmentBases,
};
