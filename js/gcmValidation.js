const gcmServerKeyInput = document.getElementById('fl-push-serverKey');
const gcmTestButton = document.getElementById('fl-push-testConfigButton');

const gcmTestSuccessMessage = document.getElementById('fl-push-testSuccessMessage');
const gcmTestErrorMessage = document.getElementById('fl-push-testErrorMessage');

const  validateGcmServerKey = async(gcmServerKey) => {
  try {
    const response = await fetch(
      'https://fcm.googleapis.com/fcm/send',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${gcmServerKey}`
        },
        body: JSON.stringify({
          registration_ids: ['fake_device token'] // Use a non-real token
        })
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid GCM Server Key');
      }

      throw new Error(`Sending failed with status: ${response.status}`);
    }

    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to send message:', error);

    return false;
  }
}

gcmTestButton.addEventListener('click', async() => {
  gcmTestErrorMessage.style.display = 'none';
  gcmTestSuccessMessage.style.display = 'none';

  const gcmServerKey = gcmServerKeyInput.value;
  const isValid = await validateGcmServerKey(gcmServerKey);

  if (!isValid) {
    gcmTestErrorMessage.style.display = 'block';

    return;
  }

  gcmTestSuccessMessage.style.display = 'block';
});

const toggleGcmTestButton = () => {
  gcmTestButton.disabled = !gcmServerKeyInput.value.length;
};

gcmServerKeyInput.addEventListener('input', toggleGcmTestButton);
toggleGcmTestButton();