const { spoorsapi } = require("../utils/apis");
const axios = require("axios");
const cloudsql = require("../utils/cloudSql");

function getAllFields(requestBody, hasFormSection) {
  return new Promise((resp, rej) => {
    try {
      let fields = {};
      let orders = [];
      console.log("HAS ORDERS", hasFormSection);
      console.log("FORM ID", requestBody.form.formId.toString());
      requestBody.fields.forEach((el) => {
        if (el.fieldType == 12 || el.fieldType == 13) {
          if (
            el.fieldDisplayValue.trim() !== "" &&
            el.fieldDisplayValue != -1
          ) {
            let attachmentArray = [
              {
                url: `${spoorsapi.anaxeemediaapi}${el.fieldDisplayValue}`,
              },
            ];
            fields[el.fieldLabel] = attachmentArray;
          }
        } else if (el.fieldType == 19) {
          fields[el.fieldLabel] = el.fieldDisplayValue;
        } else if (el.fieldType == 6) {
          fields[el.fieldLabel] = el.fieldDisplayValue.split(",");
        } else {
          fields[el.fieldLabel] = el.fieldDisplayValue;
        }
      });
      if (hasFormSection) {
        orders = getFormSectionFields(requestBody.sectionFields);
      }
      // console.log("RESP HERE", orders);
      resp({ fields, orders });
    } catch (error) {
      console.log("HERR");
      rej(error);
    }
  });
}

function getFormSectionFields(sections) {
  let sectionFields = {};
  let image = {};
  let arr = [];
  sections.forEach((el) => {
    if (sectionFields.hasOwnProperty(el.sectionSpecId)) {
      if (sectionFields[el.sectionSpecId].hasOwnProperty(el.instanceId)) {
        sectionFields[el.sectionSpecId][el.instanceId].push(el);
      } else {
        sectionFields[el.sectionSpecId][el.instanceId] = [el];
      }
    } else {
      sectionFields[el.sectionSpecId] = {};
      sectionFields[el.sectionSpecId][el.instanceId] = [el];
    }
    if (el.fieldType == 12 || el.fieldType == 13) {
      if (el.fieldDisplayValue.trim() !== "" && el.fieldDisplayValue != -1) {
        let attachmentArray = [
          {
            url: `${spoorsapi.anaxeemediaapi}${el.fieldDisplayValue}`,
          },
        ];
        image[el.fieldLabel] = attachmentArray;
      }
      arr.push(image['42. Extra Photo'][0] || "")
    }
  });
  return consolidateOrders(sectionFields, arr);
}

function consolidateOrders(sectionData, arr) {
  let orders = [];
  for (const secId in sectionData) {
    for (const insId in sectionData[secId]) {
      let order = {};
      sectionData[secId][insId].forEach((el) => {
        order[el.fieldLabel] = el.fieldDisplayValue;
      });
      orders.push(order);
    }
  }
  return arr;
}

function getOrderRecord(inputFields, orders, convert) {
  try {
    if (orders.length === 0 || !orders) {
      return [{ fields: inputFields }];
    }
    if (convert) {
      console.log("HERE");
      let convertedOrders = convertCsv(orders);
      console.log(
        "getOrderRecord",
        JSON.stringify({
          convertedOrders,
          fields: {
            ...inputFields,
            ...convertedOrders,
          },
        })
      );

      return [
        {
          fields: {
            ...inputFields,
            ...convertedOrders,
          },
        },
      ];
    }
    let orderFields = [];
    orders.forEach((el) => {
      orderFields.push({
        fields: {
          ...inputFields,
          ...el,
        },
      });
    });
    return orderFields;
  } catch (err) {
    console.error("GET ORDER RECORS", new Error(err));
  }
}

function convertCsv(sectionFields) {
  console.log("convert", JSON.stringify(sectionFields));
  let csv = {};
  sectionFields.forEach((el) => {
    for (const field in el) {
      if (csv.hasOwnProperty(field)) {
        csv[field] = `${csv[field]}, ${el[field]}`;
      } else {
        csv[field] = `${el[field]}`;
      }
    }
  });
  return csv;
}

function getFormData(formId) {
  return new Promise((resp, rej) => {
    axios
      .get(
        `https://Govind:Govind@drapp.anaxee.com/effortx/api/form/data/${formId}/`
      )
      .then((res) => {
        resp(res.data);
      })
      .catch((err) => {
        rej(err);
      });
  });
}

function processValue(value) {
  let result = ``;
  if (Array.isArray(value)) {
    value.forEach((el) => {
      if (
        Object.prototype.toString.call(el) === "[object Object]" &&
        Object.prototype.toString.call(el.url) === "[object String]"
      ) {
        result = `${result}${el.url},`;
      } else {
        result = `${result}${el},`;
      }
    });
  } else {
    return value;
  }
  return result;
}

function runQuery(query, values) {
  return new Promise((resp, rej) => {
    try {
      cloudsql.query(query, values, (err, result) => {
        if (err) {
          console.log(err);
          rej(err);
        }
        resp(result);
      });
    } catch (error) {
      rej(error);
    }
  });
}

module.exports = {
  getAllFields,
  getOrderRecord,
  getFormData,
  processValue,
  runQuery,
};
