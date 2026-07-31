const authToastKey = 'authSuccessToast'

const queueAuthSuccessToast = (message) => {
  sessionStorage.setItem(authToastKey, message)
}

const consumeAuthSuccessToast = () => {
  const message = sessionStorage.getItem(authToastKey)
  if (message) sessionStorage.removeItem(authToastKey)
  return message
}

export { consumeAuthSuccessToast, queueAuthSuccessToast }
