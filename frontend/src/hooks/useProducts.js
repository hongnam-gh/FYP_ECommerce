import { useEffect, useSyncExternalStore } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client";
import { backendUrl } from "../constants/shopConfig";

let products = [];
let productsLoaded = false;
let productsLoading = false;
let inventorySocket = null;
const productListeners = new Set();

const updateProductsView = () => productListeners.forEach(listener => listener());

const listenProductsChange = (listener) => {
  productListeners.add(listener);
  return () => productListeners.delete(listener);
};

export const getProducts = () => products;

export const setProducts = (productData) => {
  products = productData || [];
  updateProductsView();
};

const updateProductStock = (inventory) => {
  products = products.map((product) =>
    String(product._id) === String(inventory.productId)
      ? { ...product, stock: inventory.stock || {} }
      : product
  );
  updateProductsView();
};

const startInventorySocket = () => {
  if (inventorySocket) return;

  inventorySocket = io(backendUrl);
  inventorySocket.on("inventory:update", ({ inventory }) => {
    if (inventory) updateProductStock(inventory);
  });
};

export const getProductsData = async (filters = null) => {
  if (productsLoading) return;

  try {
    productsLoading = true;
    const response = filters ? await axios.post(backendUrl + "/api/product/list", { filters }) : await axios.get(backendUrl + "/api/product/list");

    if (response.data.success) {
      productsLoaded = true;
      setProducts(response.data.products);
    } else {
      toast.error(response.data.message);
    }
  } catch (error) {
    console.log(error);
    toast.error(error.message);
  } finally {
    productsLoading = false;
  }
};

const useProducts = () => {
  const currentProducts = useSyncExternalStore(listenProductsChange, getProducts);

  useEffect(() => {
    if (!productsLoaded) getProductsData();
    startInventorySocket();
  }, []);

  return { products: currentProducts, setProducts, getProductsData };
};

export default useProducts;
