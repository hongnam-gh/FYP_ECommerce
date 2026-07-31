import { useEffect, useSyncExternalStore } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../constants/shopConfig";

let products = [];
let productsLoaded = false;
let productsLoading = false;
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
  }, []);

  return { products: currentProducts, setProducts, getProductsData };
};

export default useProducts;
