const airtable = require("airtable");
airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: "airtable_api_key",
});

const tractorSathiBase = {
  Haryana: airtable.base("appaXQVaT8W8CQwcO"),
  Bihar: airtable.base("appQRRI7N67OIQWsg"),
  "Uttar Pradesh1": airtable.base("appcxXqAF922WpMbf"),
  "Uttar Pradesh": airtable.base("appa0k5jJ9i6sbn8v"),
  Rajasthan: airtable.base("appE3ZmX6zDHo0Z4W"),
  Gujarat: airtable.base("appN2Gk6fmIqvT7yU"),
  "Madhya Pradesh1": airtable.base("appks3YBNpUcOrU8J"),
  "Madhya Pradesh": airtable.base("appSMIvbeQHqzuk5n"),
  Uttarakhand1: airtable.base("appcxXqAF922WpMbf"),
  Uttarakhand: airtable.base("appa0k5jJ9i6sbn8v"),
};

const tractorSathiCustomer = airtable.base("appb3bI4OZWfeAZ1x");

const mybase = airtable.base("app8uUX8mbXIabvk6");
const runnerIssue = airtable.base("apprAMFUrKuvnnOUb");
const techBase = airtable.base("appybRBnDbjhPnwvq");

const tractorSathiCustomerBase = {
  Rajasthan: airtable.base("appk7AJ84VYrJJQ12"),
};

module.exports = {
  tractorSathiBase,
  mybase,
  tractorSathiCustomer,
  runnerIssue,
  techBase,
  tractorSathiCustomerBase,
};
