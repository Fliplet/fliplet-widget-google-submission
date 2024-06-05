// This is simple schema validation for the input data

const googleServicesSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  properties: {
    project_info: {
      type: "object",
      properties: {
        project_number: { type: "string" },
        project_id: { type: "string" },
        storage_bucket: { type: "string" },
      },
      required: ["project_number", "project_id", "storage_bucket"],
    },
    client: {
      type: "array",
      items: {
        type: "object",
        properties: {
          client_info: {
            type: "object",
            properties: {
              mobilesdk_app_id: { type: "string" },
              android_client_info: {
                type: "object",
                properties: {
                  package_name: { type: "string" },
                },
                required: ["package_name"],
              },
            },
            required: ["mobilesdk_app_id", "android_client_info"],
          },
          oauth_client: {
            type: "array",
            items: { type: "object" },
          },
          api_key: {
            type: "array",
            items: {
              type: "object",
              properties: {
                current_key: { type: "string" },
              },
              required: ["current_key"],
            },
          },
          services: {
            type: "object",
            properties: {
              appinvite_service: {
                type: "object",
                properties: {
                  other_platform_oauth_client: {
                    type: "array",
                    items: { type: "object" },
                  },
                },
                required: ["other_platform_oauth_client"],
              },
            },
            required: ["appinvite_service"],
          },
        },
        required: ["client_info", "oauth_client", "api_key", "services"],
      },
    },
    configuration_version: { type: "string" },
  },
  required: ["project_info", "client", "configuration_version"],
};

const validateSchema = (schema, data) => {
  const validateType = (value, type) => {
    if (type === "array") return Array.isArray(value);
    if (type === "object")
      return value && typeof value === "object" && !Array.isArray(value);
    return typeof value === type;
  };

  const validateObject = (schema, data) => {
    if (!validateType(data, schema.type)) return false;

    for (const key of schema.required) {
      if (!(key in data)) return false;
    }

    for (const key in data) {
      if (schema.properties[key]) {
        if (!validateType(data[key], schema.properties[key].type)) return false;
        if (schema.properties[key].type === "object") {
          if (!validateObject(schema.properties[key], data[key])) return false;
        }
        if (schema.properties[key].type === "array") {
          if (
            !data[key].every((item) =>
              validateObject(schema.properties[key].items, item)
            )
          )
            return false;
        }
      }
    }

    return true;
  };

  return validateObject(schema, data);
};

const validateGoogleServicesSchema = (data) => {
  return validateSchema(googleServicesSchema, data);
};
