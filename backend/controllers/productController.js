import { addProductService, listProductsService, removeProductService, singleProductService, updateProductService } from "../services/productService.js";

const addProduct = async (req, res) => {
  try {
    res.json(await addProductService(req.body, req.files));
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const listProducts = async (req, res) => {
  try {
    res.json(await listProductsService(req.body?.filters));
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const removeProduct = async (req, res) => {
  try {
    res.json(await removeProductService(req.body.id));
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const singleProduct = async (req, res) => {
  try {
    res.json(await singleProductService(req.body.productId));
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// Route controller for editing an existing product
const updateProduct = async (req, res) => {
  try {
    res.json(await updateProductService(req.body, req.files));
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export { addProduct, listProducts, removeProduct, singleProduct, updateProduct };
