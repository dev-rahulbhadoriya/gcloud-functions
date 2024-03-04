const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const vyaparDataBase1 = airtable.base("apphrPeYldc3OKLNU");
//const vyaparDataBase2 =  airtable.base("appzXhDhUVYR3VJlr");

//misscall base airtable
const misscallbase = airtable.base("app8uUX8mbXIabvk6");

const vyparDataAirtableBases =  {
  1: airtable.base("apphrPeYldc3OKLNU"),
}
module.exports = {
  vyaparDataBase1,
  misscallbase,
  vyparDataAirtableBases
};
