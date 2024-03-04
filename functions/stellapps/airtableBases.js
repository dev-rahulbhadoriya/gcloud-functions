const airtable = require("airtable");

airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const stellappsInternalBase1 = airtable.base("appMNLYez7jWnzTkY");

const stellappsInternalBases = {
  1: airtable.base("appMNLYez7jWnzTkY"),
};

module.exports = {
  stellappsInternalBase1,
  stellappsInternalBases,
};
