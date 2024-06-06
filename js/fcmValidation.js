const saveButton = document.querySelector(".btn[data-push-save]");

const fileInputs = {
  googleServices: document.getElementById("fl-push-google-services-file"),
  serviceAccount: document.getElementById("fl-push-service-account-file"),
};

const fileInputsValidationMessageElements = {
  googleServices: document.getElementById("fl-push-google-services-validation"),
  serviceAccount: document.getElementById("fl-push-service-account-validation"),
};

const uploadTimestampElements = {
  googleServices: document.getElementById("fl-push-google-services-timestamp"),
  serviceAccount: document.getElementById("fl-push-service-account-timestamp"),
};

const state = {
  isGoogleServicesFileValid: false,
  isServiceAccountFileValid: false,
};

const FILE_VALIDATION_MESSAGE = {
  SUCCESS: "File is valid",
  ERROR: "File is invalid",
};

const SERVICE_ACCUNT_FILE_VALIDATION_MESSAGE = {
  INVALID_JWT: "Error: the private_key is not associated with the project",
  PERMISSION_DENIED: "Error: the client does not have proper permission for the project",
  INVALID_GRANT: "Error: the client_email associated with the project is not found",
  INVALID_PRIVATE_KEY: "Error: the private_key is invalid",
}

const validateGoogleServicesFile = async (file) => {
  const fileReader = new FileReader();

  const validationMessageElement = fileInputsValidationMessageElements.googleServices;

  fileReader.addEventListener("load", () => {
    const fileContentJSON = JSON.parse(fileReader.result);
    state.isGoogleServicesFileValid = validateGoogleServicesSchema(fileContentJSON);


    validationMessageElement.innerHTML = state.isGoogleServicesFileValid 
      ? FILE_VALIDATION_MESSAGE.SUCCESS
      : FILE_VALIDATION_MESSAGE.ERROR;

    validationMessageElement.classList.toggle("text-danger", !state.isGoogleServicesFileValid );
    validationMessageElement.classList.toggle("text-success", state.isGoogleServicesFileValid );

    if (!state.isGoogleServicesFileValid ) saveButton.setAttribute("disabled", true);
    else if (state.isServiceAccountFileValid) saveButton.removeAttribute("disabled");
  });

  fileReader.readAsText(file);
};

fileInputs.googleServices.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  validateGoogleServicesFile(file);
});

const validateServiceAccountFile = async (file) => {
  const fileReader = new FileReader();

  const validationMessageElement = fileInputsValidationMessageElements.serviceAccount;

  fileReader.addEventListener("load", async () => {
    const fileContentJSON = JSON.parse(fileReader.result);
    const { client_email, project_id, private_key } = fileContentJSON;

    if (!client_email || !project_id || !private_key) {
      state.isServiceAccountFileValid = false;
      validationMessageElement.innerHTML = FILE_VALIDATION_MESSAGE.ERROR;
      validationMessageElement.classList.toggle("text-danger", !state.isServiceAccountFileValid );
      saveButton.setAttribute("disabled", true);

      return;
    }

    const response = await fetch(`/v1/apps/${Fliplet.Env.get("appId")}/notifications/validate-fcm-config`, { method: 'POST', body: JSON.stringify({ client_email, project_id, private_key} )});
    const { message } = await response.json();

    let errorMessage = null;

    if (message.includes('Permission denied on resource project')) {
      errorMessage = SERVICE_ACCUNT_FILE_VALIDATION_MESSAGE.PERMISSION_DENIED;
    }

    if (message.includes('Invalid JWT')) {
      errorMessage = SERVICE_ACCUNT_FILE_VALIDATION_MESSAGE.INVALID_JWT;
    }

    if (message.includes('Invalid grant')) {
      errorMessage = SERVICE_ACCUNT_FILE_VALIDATION_MESSAGE.INVALID_GRANT;
    }

    if (message.includes('PEM routines:')) {
      errorMessage = SERVICE_ACCUNT_FILE_VALIDATION_MESSAGE.INVALID_PRIVATE_KEY;
    }

    state.isServiceAccountFileValid = !errorMessage && message === 'SenderId mismatch';

    validationMessageElement.innerHTML = state.isServiceAccountFileValid
      ? FILE_VALIDATION_MESSAGE.SUCCESS
      : errorMessage || FILE_VALIDATION_MESSAGE.ERROR;

    validationMessageElement.classList.toggle("text-danger", !state.isServiceAccountFileValid );
    validationMessageElement.classList.toggle("text-success", state.isServiceAccountFileValid );

    if (!state.isServiceAccountFileValid ) saveButton.setAttribute("disabled", true);
    else if (state.isGoogleServicesFileValid) saveButton.removeAttribute("disabled");
  });

  fileReader.readAsText(file);
}

fileInputs.serviceAccount.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  validateServiceAccountFile(file);
});