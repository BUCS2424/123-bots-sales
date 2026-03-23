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
        return 'Custom Product';
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
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-[#1e3a5f]">
            <ShoppingBag className="w-5 h-5" />
            Your Cart ({cartItems.length} items)
          </SheetTitle>
        </SheetHeader>

        {cartItems.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Browse our custom products and unique collections.</p>
            <Button
              onClick={() => setIsCartOpen(false)}
              className="bg-[#c41e3a] hover:bg-[#a01830]"
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
                    className="flex gap-4 p-3 bg-gray-50 rounded-lg"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-md"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                      <p className="text-sm text-gray-500">{getTypeLabel(item.type)}</p>
                      {getDisplayOptionSummary(item) && (
                        <p className="text-xs text-gray-400">
                          {getDisplayOptionSummary(item)}
                        </p>
                      )}
                      {item.custom_notes && (
                        <p className="text-xs text-gray-400 line-clamp-2" data-testid={`cart-drawer-custom-notes-${item.cart_key || item.id}`}>
                          Notes: {item.custom_notes}
                        </p>
                      )}
                      {item.custom_image_url && (
                        <p className="text-xs text-gray-400" data-testid={`cart-drawer-custom-image-${item.cart_key || item.id}`}>
                          Custom image attached
                        </p>
                      )}
                      <p className="text-[#c41e3a] font-semibold mt-1">{getPriceLabel(item)}</p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        {item.type === 'product' && (
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.cart_key || item.id, item.type, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(item.cart_key || item.id, item.type, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">${getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-xs text-gray-400 italic">calculated at checkout</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-bold text-lg text-[#c41e3a]">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/checkout" onClick={() => setIsCartOpen(false)}>
                <Button className="w-full bg-[#c41e3a] hover:bg-[#a01830] text-white py-6">
                  Proceed to Checkout
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-white"
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