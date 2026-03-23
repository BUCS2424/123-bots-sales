import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CartContext = createContext();

const STORAGE_KEY = 'aps_cart';

const loadCart = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(loadCart);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const resolveCartKey = useCallback((item, type) => {
    if (item?.cart_key) return item.cart_key;
    const optionKey = Array.isArray(item?.selected_options) && item.selected_options.length > 0
      ? item.selected_options.map((entry) => `${entry.group_id || entry.groupId}:${entry.value_id || entry.valueId}`).join('|')
      : `${item?.selected_strength || 'default-strength'}:${item?.selected_package || 'default-pack'}`;
    const noteKey = (item?.custom_notes || '').trim() || 'no-note';
    const imageKey = item?.custom_image_url || 'no-image';
    return `${type}:${item?.id}:${optionKey}:${noteKey}:${imageKey}`;
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((item, type = 'product') => {
    setCartItems((prev) => {
      const cartKey = resolveCartKey(item, type);
      const existingItem = prev.find((i) => i.cart_key === cartKey && i.type === type);
      if (existingItem) {
        return prev.map((i) =>
          i.cart_key === cartKey && i.type === type
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, type, quantity: 1, cart_key: cartKey }];
    });
  }, [resolveCartKey]);

  const removeFromCart = useCallback((itemIdentifier, type = undefined) => {
    setCartItems((prev) => {
      if (typeof itemIdentifier === 'number' && type === undefined) {
        return prev.filter((_, index) => index !== itemIdentifier);
      }

      return prev.filter((item) => {
        if (item.cart_key === itemIdentifier) return false;
        if (type !== undefined) {
          return !(item.id === itemIdentifier && item.type === type);
        }
        return item.id !== itemIdentifier;
      });
    });
  }, []);

  const updateQuantity = useCallback((itemIdentifier, typeOrQuantity, maybeQuantity) => {
    const hasExplicitType = maybeQuantity !== undefined;
    const type = hasExplicitType ? typeOrQuantity : undefined;
    const quantity = hasExplicitType ? maybeQuantity : typeOrQuantity;

    if (quantity <= 0) {
      removeFromCart(itemIdentifier, type);
      return;
    }

    setCartItems((prev) =>
      prev.map((i) =>
        (
          i.cart_key === itemIdentifier ||
          (type !== undefined && i.id === itemIdentifier && i.type === type) ||
          (type === undefined && i.id === itemIdentifier)
        )
          ? { ...i, quantity }
          : i
      )
    );
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const getCartCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  const toggleCart = useCallback(() => {
    setIsCartOpen((prev) => !prev);
  }, []);

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartCount,
    isCartOpen,
    setIsCartOpen,
    toggleCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartContext;
