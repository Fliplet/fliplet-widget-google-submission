const saveButton = document.querySelector('.btn[data-push-save]');

const fileInputs = {
  googleServices: document.getElementById('fl-push-google-services-file'),
  serviceAccount: document.getElementById('fl-push-service-account-file'),
};

const fileInputsValidationMessageElements = {
  googleServices: document.getElementById('fl-push-google-services-validation'),
  serviceAccount: document.getElementById('fl-push-service-account-validation'),
};

const uploadTimestampElements = {
  googleServices: document.getElementById('fl-push-google-services-timestamp'),
  serviceAccount: document.getElementById('fl-push-service-account-timestamp'),
};

const renderTimestamps = ({ googleServicesTimestamp, serviceAccountTimestamp }) => {
  if (googleServicesTimestamp) {
    uploadTimestampElements.googleServices.innerHTML = new Date(googleServicesTimestamp).toLocaleString();
  }

  if (serviceAccountTimestamp) {
    uploadTimestampElements.serviceAccount.innerHTML = new Date(serviceAccountTimestamp).toLocaleString();
  }

  if (googleServicesTimestamp && serviceAccountTimestamp) {
    saveButton.removeAttribute('disabled');
  }
}

let previousState = {};

const state = {
  isGoogleServicesFileValid: undefined,
  isServiceAccountFileValid: undefined,
  formData: {},
};

// called from interface.js after fetching the widget instance data
const onLoadPushNotificationData = (data) => {
  previousState = structuredClone(data);
  state.formData = data;
  renderTimestamps(previousState);
}

const FILE_VALIDATION_MESSAGE = {
  SUCCESS: 'File is valid',
  ERROR: 'File is invalid',
};

const SERVICE_ACCUNT_FILE_VALIDATION_MESSAGE = {
  INVALID_JWT: 'Error: the private_key is not associated with the project',
  PERMISSION_DENIED: 'Error: the client does not have proper permission for the project',
  INVALID_GRANT: 'Error: the client_email associated with the project is not found',
  INVALID_PRIVATE_KEY: 'Error: the private_key is invalid',
}

const validateGoogleServicesFile = async (file) => {
  const fileReader = new FileReader();

  const validationMessageElement = fileInputsValidationMessageElements.googleServices;

  fileReader.addEventListener('load', () => {
    const fileContentJSON = JSON.parse(fileReader.result);
    state.isGoogleServicesFileValid = validateGoogleServicesSchema(fileContentJSON);


    validationMessageElement.innerHTML = state.isGoogleServicesFileValid 
      ? FILE_VALIDATION_MESSAGE.SUCCESS
      : FILE_VALIDATION_MESSAGE.ERROR;

    validationMessageElement.classList.toggle('text-danger', !state.isGoogleServicesFileValid );
    validationMessageElement.classList.toggle('text-success', state.isGoogleServicesFileValid );

    if (state.isGoogleServicesFileValid) state.formData.googleServices = fileContentJSON;

    if (!state.isGoogleServicesFileValid || state.isServiceAccountFileValid === false) saveButton.setAttribute('disabled', true);
    else saveButton.removeAttribute('disabled');
  });

  fileReader.readAsText(file);
};

fileInputs.googleServices.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  validateGoogleServicesFile(file);
});

const validateServiceAccountFile = async (file) => {
  const fileReader = new FileReader();

  const validationMessageElement = fileInputsValidationMessageElements.serviceAccount;

  fileReader.addEventListener('load', async () => {
    const fileContentJSON = JSON.parse(fileReader.result);
    const { client_email, project_id, private_key } = fileContentJSON;

    if (!client_email || !project_id || !private_key) {
      state.isServiceAccountFileValid = false;
      validationMessageElement.innerHTML = FILE_VALIDATION_MESSAGE.ERROR;
      validationMessageElement.classList.toggle('text-danger', !state.isServiceAccountFileValid );
      saveButton.setAttribute('disabled', true);

      return;
    }

    const response = await fetch(`/v1/apps/${Fliplet.Env.get('appId')}/notifications/validate-fcm-config`, { method: 'POST', body: JSON.stringify({ client_email, project_id, private_key} )});
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

    validationMessageElement.classList.toggle('text-danger', !state.isServiceAccountFileValid );
    validationMessageElement.classList.toggle('text-success', state.isServiceAccountFileValid );

    if (state.isServiceAccountFileValid) {
      state.formData = {
        ...state.formData,
        client_email,
        project_id,
        private_key
      }
    }

    if (!state.isServiceAccountFileValid || state.isGoogleServicesFileValid === false) saveButton.setAttribute('disabled', true);
    else saveButton.removeAttribute('disabled');
  });

  fileReader.readAsText(file);
}

fileInputs.serviceAccount.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;
  validateServiceAccountFile(file);
});

const savePushData = async () => {
  // TODO: get rid of lodash here
  const googleServicesChanged = !_.isEqual(state.formData.googleServices, previousState.googleServices);
  const serviceAccountChanged = state.formData.client_email !== previousState.client_email || state.formData.project_id !== previousState.project_id || state.formData.private_key !== previousState.private_key;

  if (!googleServicesChanged && !serviceAccountChanged) {
    return;
  }

  if (googleServicesChanged || !previousState.googleServicesTimestamp) {
    state.formData.googleServicesTimestamp = new Date().getTime();
  }
  
  if (serviceAccountChanged || !previousState.serviceAccountTimestamp) {
    state.formData.serviceAccountTimestamp = new Date().getTime();
  }

  await Fliplet.API.request({
    method: 'PUT',
    url: 'v1/widget-instances/com.fliplet.push-notifications?appId=' + Fliplet.Env.get('appId'),
    data: {
      ...state.formData,
      fcm: true,
      gcm: false,
    },
  });

  renderTimestamps(state.formData);
}

saveButton.addEventListener('click', savePushData);