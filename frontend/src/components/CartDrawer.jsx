import React from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Link } from 'react-router-dom';
import { getDisplayOptionSummary } from '../lib/productOptions';

const CartDrawer = () => {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    getCartTotal,
    isCartOpen,
    setIsCartOpen,
  } = useCart();

  const getTypeLabel = (type) => {
    switch (type) {
      case 'storage':
        return 'Storage Unit';
      case 'service':
        return 'RV Service';
      default:
        return 'Product';
    }
  };

  const getPriceLabel = (item) => {
    if (item.type === 'storage') {
      return `$${item.price}/mo`;
    }
    return `$${item.price}`;
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col bg-bots-dark border-l border-gray-800">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-white">
            <ShoppingBag className="w-5 h-5 text-blue-400" />
            Your Cart ({cartItems.length} items)
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-bots-surface rounded-full flex items-center justify-center mb-4 border border-gray-700">
              <ShoppingBag className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
            <p className="text-gray-400 mb-6">Browse our products and add items to your cart.</p>
            <Button
              onClick={() => setIsCartOpen(false)}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Continue Shopping
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-4">
                {cartItems.map((item) => (
                  <div
                    key={item.cart_key || `${item.type}-${item.id}`}
                    className="flex gap-4 p-3 bg-bots-surface rounded-lg border border-gray-700"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md bg-bots-dark"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-white truncate">{item.name}</h4>
                      <p className="text-sm text-gray-400">{getTypeLabel(item.type)}</p>
                      {getDisplayOptionSummary(item) && (
                        <p className="text-xs text-gray-500">
                          {getDisplayOptionSummary(item)}
                        </p>
                      )}
                      {item.custom_notes && (
                        <p className="text-xs text-gray-500 line-clamp-2" data-testid={`cart-drawer-custom-notes-${item.cart_key || item.id}`}>
                          Notes: {item.custom_notes}
                        </p>
                      )}
                      {item.custom_image_url && (
                        <p className="text-xs text-gray-500" data-testid={`cart-drawer-custom-image-${item.cart_key || item.id}`}>
                          Custom image attached
                        </p>
                      )}
                      <p className="text-blue-400 font-semibold mt-1">{getPriceLabel(item)}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {item.type === 'product' && (
                          <div className="flex items-center border border-gray-700 rounded-md bg-bots-dark">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-bots-surface"
                              onClick={() => updateQuantity(item.cart_key || item.id, item.type, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center text-sm text-white">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-white hover:bg-bots-surface"
                              onClick={() => updateQuantity(item.cart_key || item.id, item.type, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => removeFromCart(item.cart_key || item.id, item.type)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t border-gray-700 pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-medium text-white">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tax</span>
                  <span className="text-xs text-gray-500 italic">calculated at checkout</span>
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-bold text-lg text-blue-400">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
                <Button className="w-full bg-green-500 hover:bg-green-400 text-black font-bold py-6">
                  Proceed to Checkout
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full border-gray-600 text-gray-300 hover:bg-bots-surface hover:text-white"
                onClick={() => setIsCartOpen(false)}
              >
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
