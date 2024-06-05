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

const FILE_VALIDATION_MESSAGE = {
  SUCCESS: "File is valid",
  ERROR: "File is invalid",
};

const MESSAGE = {
  SUCCESS: "Success! Push notifications have been configured correctly.",
  SERVER_ERROR:
    'Error - notifications have not been configured correctly. Please review <a href="https://help.fliplet.com" target="_blank">https://help.fliplet.com</a> or contact support.',
  INVALID_SENDER_ID:
    "Error - notifications have not been configured correctly. Please check if your Firebase <strong>sender ID</strong> is entered correctly and try again.",
  INVALID_SERVER_KEY:
    "Error - notifications have not been configured correctly. Please check if your Firebase <strong>server key</strong> is entered correctly and try again.",
  FIREBASE_ERROR:
    "Error - There is currently an issue relating to Firebase services. Please try again later.",
};

const messageCodesMap = {
  InvalidRegistration: MESSAGE.SUCCESS,
  MissingRegistration: MESSAGE.SERVER_ERROR,
  MismatchSenderId: MESSAGE.INVALID_SENDER_ID,
  NotRegistered: MESSAGE.SUCCESS,
  MessageTooBig: MESSAGE.SERVER_ERROR,
  InvalidDataKey: MESSAGE.SERVER_ERROR,
  InvalidTtl: MESSAGE.SERVER_ERROR,
  InternalServerError: MESSAGE.FIREBASE_ERROR,
  Unavailable: MESSAGE.FIREBASE_ERROR,
  DeviceMessageRateExceeded: MESSAGE.FIREBASE_ERROR,
};

const validateGoogleServicesFile = async (file) => {
  const fileReader = new FileReader();

  fileReader.addEventListener("load", () => {
    const fileContentJSON = JSON.parse(fileReader.result);
    const isValid = validateGoogleServicesSchema(fileContentJSON);

    const validationMessageElement =
      fileInputsValidationMessageElements.googleServices;

    validationMessageElement.innerHTML = isValid
      ? FILE_VALIDATION_MESSAGE.SUCCESS
      : FILE_VALIDATION_MESSAGE.ERROR;

    validationMessageElement.classList.toggle("text-danger", !isValid);
    validationMessageElement.classList.toggle("text-success", isValid);
  });

  fileReader.readAsText(file);
};

fileInputs.googleServices.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;
  validateGoogleServicesFile(file);
});
