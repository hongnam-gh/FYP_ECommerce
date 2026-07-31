import { useEffect, useSyncExternalStore } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../constants/shopConfig";
import useAuth from "./useAuth";
import { getProducts } from "./useProducts";

let cartItems = (() => {
  const savedCart = localStorage.getItem("cartItems");
  return savedCart ? JSON.parse(savedCart) : {};
})();

let lastCartToken = "";
const cartListeners = new Set();

const updateCartView = () => cartListeners.forEach(listener => listener());

const listenCartChange = (listener) => {
  cartListeners.add(listener);
  return () => cartListeners.delete(listener);
};

const getCartItems = () => cartItems;

const getLocalCartItems = () => {
  const savedCart = localStorage.getItem("cartItems");
  return savedCart ? JSON.parse(savedCart) : {};
};

const syncCartItems = () => {
  try {
    const savedCart = getLocalCartItems();
    if (JSON.stringify(savedCart) !== JSON.stringify(cartItems)) {
      cartItems = savedCart;
      updateCartView();
    }
  } catch (error) {
    console.log(error);
  }
};

export const setCartItems = (cartData) => {
  cartItems = cartData || {};
  localStorage.setItem("cartItems", JSON.stringify(cartItems));
  updateCartView();
  window.dispatchEvent(new Event("cart-items-updated"));
};

export const isCartEmpty = (cart) => {
  if (!cart) return true;

  for (const itemId in cart) {
    for (const size in cart[itemId]) {
      if (cart[itemId][size] > 0) return false;
    }
  }

  return true;
};

export const addToCart = async (itemId, size, maxStock = null) => {
  if (!size) {
    toast.error("Select Product Size");
    return false;
  }

  const currentQty = cartItems?.[itemId]?.[size] || 0;

  if (maxStock !== null && Number(maxStock) <= 0) {
    toast.error("Out of Stock");
    return false;
  }

  if (maxStock !== null && currentQty + 1 > Number(maxStock)) {
    toast.error("Insufficient stock for the selected size.");
    return false;
  }

  const oldCartItems = structuredClone(cartItems);
  let cartData = structuredClone(cartItems);

  if (cartData[itemId]) {
    if (cartData[itemId][size]) cartData[itemId][size] += 1;
    else cartData[itemId][size] = 1;
  } else {
    cartData[itemId] = {};
    cartData[itemId][size] = 1;
  }

  setCartItems(cartData);

  const token = localStorage.getItem("token") || "";

  if (token) {
    try {
      const response = await axios.post(backendUrl + "/api/cart/add", { itemId, size }, { headers: { token } });

      if (response.data?.success === false) {
        setCartItems(oldCartItems);
        toast.error(response.data.message);
        return false;
      }
    } catch (error) {
      console.log(error);
      setCartItems(oldCartItems);
      toast.error(error.message);
      return false;
    }
  }

  return true;
};

export const getCartCount = (cartData = cartItems) => {
  let totalCount = 0;

  for (const items in cartData) {
    for (const item in cartData[items]) {
      if (cartData[items][item] > 0) totalCount += cartData[items][item];
    }
  }

  return totalCount;
};

export const updateQuantity = async (itemId, size, quantity, maxStock = null) => {
  if (maxStock !== null && quantity > Number(maxStock)) {
    toast.error("Insufficient stock for the selected size.");
    return false;
  }

  const oldCartItems = structuredClone(cartItems);
  let cartData = structuredClone(cartItems);

  if (!cartData[itemId]) cartData[itemId] = {};

  if (quantity <= 0) {
    delete cartData[itemId][size];
    if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];
  } else {
    cartData[itemId][size] = quantity;
  }

  setCartItems(cartData);

  const token = localStorage.getItem("token") || "";

  if (token) {
    try {
      const response = await axios.post(backendUrl + "/api/cart/update", { itemId, size, quantity }, { headers: { token } });

      if (response.data?.success === false) {
        setCartItems(oldCartItems);
        toast.error(response.data.message);
        return false;
      }
    } catch (error) {
      console.log(error);
      setCartItems(oldCartItems);
      toast.error(error.message);
      return false;
    }
  }

  return true;
};

export const getCartAmount = () => {
  let totalAmount = 0;
  const products = getProducts();

  for (const items in cartItems) {
    const itemInfo = products.find((product) => product._id === items);
    if (!itemInfo) continue;

    for (const item in cartItems[items]) {
      if (cartItems[items][item] > 0) totalAmount += itemInfo.price * cartItems[items][item];
    }
  }

  return totalAmount;
};

export const getUserCart = async (userToken) => {
  try {
    const response = await axios.post(backendUrl + "/api/cart/get", {}, { headers: { token: userToken } });

    if (response.data.success) setCartItems(response.data.cartData || {});
  } catch (error) {
    console.log(error);
    toast.error(error.message);
  }
};

export const mergeGuestCart = async (userToken) => {
  try {
    const guestCart = JSON.parse(localStorage.getItem("cartItems")) || {};

    if (isCartEmpty(guestCart)) {
      await getUserCart(userToken);
      return;
    }

    const response = await axios.post(backendUrl + "/api/cart/merge", { guestCart }, { headers: { token: userToken } });

    if (response.data.success) setCartItems(response.data.cartData || {});
  } catch (error) {
    console.log(error);
    toast.error(error.message);
  }
};

const useCart = () => {
  const currentCartItems = useSyncExternalStore(listenCartChange, getCartItems);
  const { token } = useAuth();

  useEffect(() => {
    const syncOnStorage = () => syncCartItems();

    window.addEventListener("storage", syncOnStorage);
    window.addEventListener("focus", syncOnStorage);
    window.addEventListener("pageshow", syncOnStorage);
    window.addEventListener("cart-items-updated", syncOnStorage);

    return () => {
      window.removeEventListener("storage", syncOnStorage);
      window.removeEventListener("focus", syncOnStorage);
      window.removeEventListener("pageshow", syncOnStorage);
      window.removeEventListener("cart-items-updated", syncOnStorage);
    };
  }, []);

  useEffect(() => {
    if (token && token !== lastCartToken) {
      lastCartToken = token;
      getUserCart(token);
    } else if (!token) {
      lastCartToken = "";
    }
  }, [token]);

  return { cartItems: currentCartItems, setCartItems, addToCart, getCartCount, updateQuantity, getCartAmount, getUserCart, mergeGuestCart, isCartEmpty };
};

export default useCart;
