import userModel from '../models/userModel.js'
import inventoryModel from '../models/inventoryModel.js'
import productModel from '../models/productModel.js'
import cartModel from '../models/cartModel.js'

// ------ Config --------

const insufficientStockMessage = "Insufficient stock for the selected size";

// ------ Database Helpers --------

const getUserOrError = async (userId) => {
  if (!userId) return { error: { success: false, message: "User not found" } };

  const userData = await userModel.findById(userId);
  if (!userData) return { error: { success: false, message: "User not found" } };

  return { userData };
};

const saveCartProduct = async ({ userId, itemId, size, quantity }) => {
  if (quantity <= 0) {
    await cartModel.findOneAndDelete({ userId, productId: itemId, size });
    return;
  }

  const product = await productModel.findById(itemId);
  if (!product) return;

  await cartModel.findOneAndUpdate(
    { userId, productId: itemId, size },
    {
      userId,
      productId: itemId,
      name: product.name,
      price: product.price,
      category: product.category,
      subCategory: product.subCategory,
      size,
      quantity,
      date: Date.now()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getAvailableStock = async (itemId, size) => {
  const inventory = await inventoryModel.findOne({ productId: itemId });
  return Number(inventory?.stock?.[size] || 0);
};

// ------ Public Services --------

const addToCartService = async ({ userId, itemId, size }) => {
  const availableStock = await getAvailableStock(itemId, size);
  const { userData, error } = await getUserOrError(userId);
  if (error) return error;

  const cartData = userData.cartData || {};
  const currentQuantity = Number(cartData?.[itemId]?.[size] || 0);

  if (availableStock <= 0 || currentQuantity + 1 > availableStock) {
    return { success: false, message: insufficientStockMessage };
  }

  if (cartData[itemId]) {
    if (cartData[itemId][size]) cartData[itemId][size] += 1;
    else cartData[itemId][size] = 1;
  } else {
    cartData[itemId] = {};
    cartData[itemId][size] = 1;
  }

  await userModel.findByIdAndUpdate(userId, { cartData });
  await saveCartProduct({ userId, itemId, size, quantity: currentQuantity + 1 });
  return { success: true, message: "Added To Cart" };
};

const updateCartService = async ({ userId, itemId, size, quantity }) => {
  const availableStock = await getAvailableStock(itemId, size);

  if (quantity > availableStock) {
    return { success: false, message: insufficientStockMessage };
  }

  const { userData, error } = await getUserOrError(userId);
  if (error) return error;

  const cartData = userData.cartData || {};

  if (!cartData[itemId]) cartData[itemId] = {};

  if (quantity <= 0) {
    delete cartData[itemId][size];
    if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];
  } else {
    cartData[itemId][size] = quantity;
  }

  await userModel.findByIdAndUpdate(userId, { cartData });
  await saveCartProduct({ userId, itemId, size, quantity });
  return { success: true, message: "Updated Cart" };
};

const getUserCartService = async (userId) => {
  const { userData, error } = await getUserOrError(userId);
  if (error) return error;

  return { success: true, cartData: userData.cartData || {} };
};

const mergeCartService = async ({ userId, guestCart }) => {
  const { userData, error } = await getUserOrError(userId);
  if (error) return error;

  const cartData = userData.cartData || {};

  for (const itemId in guestCart) {
    if (!cartData[itemId]) cartData[itemId] = {};

    for (const size in guestCart[itemId]) {
      const guestQuantity = guestCart[itemId][size];

      if (guestQuantity > 0) {
        const availableStock = await getAvailableStock(itemId, size);
        const currentQuantity = Number(cartData[itemId][size] || 0);
        const nextQuantity = Math.min(currentQuantity + guestQuantity, availableStock);

        if (nextQuantity > 0) {
          cartData[itemId][size] = nextQuantity;
          await saveCartProduct({ userId, itemId, size, quantity: nextQuantity });
        }
      }
    }

    if (Object.keys(cartData[itemId]).length === 0) delete cartData[itemId];
  }

  await userModel.findByIdAndUpdate(userId, { cartData });
  return { success: true, cartData };
};

export { addToCartService, updateCartService, getUserCartService, mergeCartService };
