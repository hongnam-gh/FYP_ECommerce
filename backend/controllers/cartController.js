import { addToCartService, updateCartService, getUserCartService, mergeCartService } from "../services/cartService.js";

const addToCart = async (req, res) => {
  try {
    res.json(await addToCartService(req.body));
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const updateCart = async (req, res) => {
  try {
    res.json(await updateCartService(req.body));
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const getUserCart = async (req, res) => {
  try {
    res.json(await getUserCartService(req.body.userId));
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const mergeCart = async (req, res) => {
  try {
    res.json(await mergeCartService(req.body));
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export { addToCart, updateCart, getUserCart, mergeCart };
