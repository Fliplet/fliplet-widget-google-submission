const gcmServerKeyInput = document.getElementById('fl-push-serverKey');
const gcmSenderIdInput = document.getElementById('fl-push-senderId');
const gcmProjectIdInput = document.getElementById('fl-push-projectId');
const gcmTestButton = document.getElementById('fl-push-testConfigButton');
const gcmTestResultMessage = document.getElementById('fl-push-testResultMessage');

const MESSAGE = {
  SUCCESS: 'Success! Push notifications have been configured correctly.',
  SERVER_ERROR: 'Error - notifications have not been configured correctly. Please review <a href="https://help.fliplet.com" target="_blank">https://help.fliplet.com</a> or contact support.',
  INVALID_SENDER_ID: 'Error - notifications have not been configured correctly. Please check if your Firebase sender ID is entered correctly and try again.',
  INVALID_SERVER_KEY: 'Error - notifications have not been configured correctly. Please check if your Firebase server key is entered correctly and try again.',
  FIREBASE_ERROR: 'Error - There is currently an issue relating to Firebase services. Please try again later.',
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

const renderResultMessage = (resultMessage) => {
  if (!resultMessage) {
    gcmTestResultMessage.style.display = 'none';
    gcmTestResultMessage.innerHTML = '';

    return;
  };

  gcmTestResultMessage.style.display = 'block';
  gcmTestResultMessage.innerHTML = resultMessage;

  const success = resultMessage === MESSAGE.SUCCESS;
  gcmTestResultMessage.classList.toggle('text-success', success);
  gcmTestResultMessage.classList.toggle('text-danger', !success);
};

const validateGcmServerKey = async(gcmServerKey) => {
  try {
    const response = await fetch('https://fcm.googleapis.com/fcm/send',
      {
        method: 'POST',
        headers: { Authorization: `key=${gcmServerKey}` },
        body: JSON.stringify({ registration_ids: ['fake_device token'] }) // Use a fake device token to test the server key
      }
    );

    if (response.status === 401) {
      return MESSAGE.INVALID_SERVER_KEY;
    };

    const { results: { 0: errorMessageCode }} = await response.json();

    const message = messageCodesMap[errorMessageCode];

    if (!message) {
      throw new Error('Unknown error code');
    }

    return message;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send message:', error);

    return MESSAGE.SERVER_ERROR;
  }
};

gcmTestButton.addEventListener('click', async() => {
  renderResultMessage(null);

  const gcmServerKey = gcmServerKeyInput.value;
  const resultMessage = await validateGcmServerKey(gcmServerKey);

  renderResultMessage(resultMessage);
});

const toggleGcmTestButton = () => {
  renderResultMessage(null);
  gcmTestButton.disabled = !gcmServerKeyInput.value.length || !gcmSenderIdInput.value.length || !gcmProjectIdInput.value.length;
};

[ gcmServerKeyInput, gcmSenderIdInput, gcmProjectIdInput ].forEach(input => input.addEventListener('input', toggleGcmTestButton));

toggleGcmTestButton();
