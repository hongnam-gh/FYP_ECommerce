import { useEffect, useSyncExternalStore } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../constants/shopConfig";
import useAuth from "./useAuth";

let wishlistItems = [];
let lastWishlistToken = "";
const wishlistListeners = new Set();

const updateWishlistView = () => wishlistListeners.forEach(listener => listener());

const listenWishlistChange = (listener) => {
  wishlistListeners.add(listener);
  return () => wishlistListeners.delete(listener);
};

const getWishlistItems = () => wishlistItems;

export const setWishlistItems = (wishlistData) => {
  wishlistItems = wishlistData || [];
  updateWishlistView();
};

export const getUserWishlist = async (userToken) => {
  try {
    const response = await axios.post(backendUrl + "/api/wishlist/get", {}, { headers: { token: userToken } });

    if (response.data.success) setWishlistItems(response.data.wishlistItems || []);
  } catch (error) {
    console.log(error);
    toast.error(error.message);
  }
};

export const isWishlistItem = (itemId) => {
  return wishlistItems.includes(itemId);
};

export const toggleWishlist = async (itemId) => {
  const token = localStorage.getItem("token") || "";

  if (!token) {
    window.location.href = `/login?redirect=${window.location.pathname}`;
    return;
  }

  try {
    const response = await axios.post(backendUrl + "/api/wishlist/toggle", { itemId }, { headers: { token } });

    if (response.data.success) {
      setWishlistItems(response.data.wishlistItems || []);
    } else {
      toast.error(response.data.message);
    }
  } catch (error) {
    console.log(error);
    toast.error(error.message);
  }
};

const useWishlist = () => {
  const currentWishlistItems = useSyncExternalStore(listenWishlistChange, getWishlistItems);
  const { token } = useAuth();

  useEffect(() => {
    if (token && token !== lastWishlistToken) {
      lastWishlistToken = token;
      getUserWishlist(token);
    } else if (!token) {
      lastWishlistToken = "";
      setWishlistItems([]);
    }
  }, [token]);

  return { wishlistItems: currentWishlistItems, setWishlistItems, getUserWishlist, toggleWishlist, isWishlistItem };
};

export default useWishlist;
