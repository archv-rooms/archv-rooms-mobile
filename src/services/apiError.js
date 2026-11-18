// Turns an API/network error into a message for the user
export function getApiErrorMessage(err) {
    const apiMessage = err?.response?.data?.message;
    if (apiMessage) return apiMessage;
    if (err?.code === 'ECONNABORTED') {
      return 'O servidor demorou para responder. Tente novamente.';
    }
    return 'Não foi possível conectar ao servidor. Tente novamente.';
  }