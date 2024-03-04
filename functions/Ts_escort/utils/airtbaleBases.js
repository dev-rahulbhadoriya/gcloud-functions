const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const TSEscortsLeadBases1 = airtable.base("appZgacNbVddBsAYT");

//misscall base airtable
const misscallbase = airtable.base("app8uUX8mbXIabvk6");

const TSEscortsLeadBases = {
  1: airtable.base("appZgacNbVddBsAYT"),
};
module.exports = {
  TSEscortsLeadBases1,
  misscallbase,
  TSEscortsLeadBases,
};
