import { useSyncExternalStore } from "react";

let token = localStorage.getItem("token") || "";
const authListeners = new Set();

const updateAuthView = () => authListeners.forEach(listener => listener());

const listenAuthChange = (listener) => {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
};

export const getToken = () => token;

export const setToken = (newToken) => {
  token = newToken || "";

  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");

  updateAuthView();
};

const useAuth = () => {
  const currentToken = useSyncExternalStore(listenAuthChange, getToken);

  return { token: currentToken, setToken };
};

export default useAuth;
