const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const TSLeadData1 = airtable.base("appBVe77pqkKL8I5Z");
const TsLeadData2 =  airtable.base("appzXhDhUVYR3VJlr");

//misscall base airtable
const misscallbase = airtable.base("app8uUX8mbXIabvk6");

const TSAirtableBases =  {
  1: airtable.base("appBVe77pqkKL8I5Z"),
  2: airtable.base("appzXhDhUVYR3VJlr"),
}
module.exports = {
  TSLeadData1,
  misscallbase,
  TsLeadData2,
  TSAirtableBases
};
