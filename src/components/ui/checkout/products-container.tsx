"use client";

import { Card, CardHeader, CardTitle, CardContent } from "../card";
import { Input } from "../input";
import { Plus, ShoppingCart, Package, Save, Trash } from "lucide-react";
import { Button } from "../button";
import { Badge } from "../badge";
import { Separator } from "../separator";
import { useEffect, useState, useRef } from "react";
import { submitOrder } from "@/lib/data/orders";

export interface Product {
  barcode: string;
  item: string;
  brand: string;
  quantity: number;
  price: number;
}

interface OrderItem {
  barcode: string;
  item: string;
  brand: string;
  quantity: number;
  price: number;
}

export interface Cart {
  items: OrderItem[];
  total: number;
}

export default function ProductsContainer({
  products,
}: {
  products: Product[];
}) {
  const [cart, setCart] = useState<Cart>({
    items: [],
    total: 0,
  });
  const [lastScanned, setLastScanned] = useState("None");
  const [typedBarcode, setTypedBarcode] = useState("");
  const [currentProducts, _setCurrentProducts] = useState<Product[]>(products);

  const buffer = useRef("");
  useEffect(() => {
    const handleBufferInput = (e: KeyboardEvent) => {
      if (
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta"
      ) {
        return;
      }
      const char = e.key;

      if (char === "Enter") {
        if (buffer.current.trim()) {
          handleScan(buffer.current.trim());
        }
        buffer.current = "";
      } else {
        buffer.current += char;
      }
    };
    window.addEventListener("keydown", handleBufferInput);
    return () => {
      window.removeEventListener("keydown", handleBufferInput);
    };
  }, []);

  const handleScan = (barcode: string) => {
    const product = currentProducts.find(
      (product: Product) => barcode === product.barcode
    );
    if (product?.quantity === 0) {
      alert("Product Out Of Stock");
      return;
    }
    setLastScanned(product?.item || "None");
    setCart((prevCart: Cart) => {
      const product = currentProducts.find(
        (product: Product) => product.barcode === barcode
      );
      if (!product) {
        alert("Product Invalid: " + barcode);
        return prevCart;
      }
      const existing = prevCart.items.find(
        (orderItem: OrderItem) => orderItem.barcode === barcode
      );
      if (existing) {
        if (existing.quantity === product.quantity) return prevCart;
        return {
          total: prevCart.total + product.price,
          items: prevCart.items.map((item: OrderItem) =>
            item.barcode === barcode
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      } else {
        return {
          total: prevCart.total + product.price,
          items: [
            ...prevCart.items,
            {
              barcode,
              quantity: 1,
              price: product.price,
              brand: product.brand,
              item: product.item,
            },
          ],
        };
      }
    });
  };

  const handleIncrementQuantity = (item: OrderItem) => {
    setCart((prevCart: Cart) => {
      const product = currentProducts.find(
        (product: Product) => product.barcode === item.barcode
      );
      if (
        prevCart.items.find(
          (prevItem) =>
            prevItem.quantity === product?.quantity &&
            item.barcode === prevItem.barcode
        )
      )
        return prevCart;
      return {
        total: prevCart.total + item.price,
        items: prevCart.items.map((prevItem) =>
          item.barcode === prevItem.barcode
            ? { ...prevItem, quantity: prevItem.quantity + 1 }
            : prevItem
        ),
      };
    });
  };

  const handleDecrementQuantity = (item: OrderItem) => {
    setCart((prevCart: Cart) => {
      if (
        prevCart.items.find(
          (prevItem) =>
            prevItem.quantity === 1 && item.barcode === prevItem.barcode
        )
      )
        return prevCart;
      return {
        total: prevCart.total - item.price,
        items: prevCart.items.map((prevItem) =>
          item.barcode === prevItem.barcode
            ? { ...prevItem, quantity: prevItem.quantity - 1 }
            : prevItem
        ),
      };
    });
  };

  const handleRemoveItem = (item: OrderItem) => {
    setCart((prevCart: Cart) => {
      return {
        total: prevCart.total - item.quantity * item.price,
        items: prevCart.items.filter(
          (prevItem) => prevItem.barcode !== item.barcode
        ),
      };
    });
  };

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTypedBarcode(e.target.value);
  };

  const handleClearCart = () => {
    setCart({
      total: 0,
      items: [],
    });
  };

  const handleSubmitCart = async () => {
    await submitOrder(cart);
    alert("Order Submitted");
    handleClearCart();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
          <p className="text-muted-foreground">
            Scan or add products to create an order
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <ShoppingCart className="h-3 w-3 mr-1" />
          {cart.items.length} items
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Input Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Add Products
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="Scan or type barcode..."
                    className="h-11 text-base"
                    onChange={handleBarcodeInput}
                    value={typedBarcode}
                  />
                </div>
                <Button
                  size="lg"
                  className="px-6"
                  onClick={() => handleScan(typedBarcode)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Use the scanner or type product barcode manually to add items to
                cart.
              </p>
            </CardContent>
          </Card>

          {/* Cart Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Shopping Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.items.length === 0 ? (
                <div className="rounded-lg border bg-muted/30">
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      Cart is empty
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Start by scanning a product barcode or searching for items
                      to add to your cart
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div
                      key={item.barcode}
                      className="group relative flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-card to-card/50 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-foreground truncate pr-2">
                            {item.item}
                          </h4>
                          <Badge variant="outline" className="text-xs shrink-0">
                            #{item.barcode}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                          {item.brand}
                        </p>
                      </div>

                      <div className="flex items-center gap-6 ml-4">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Qty
                          </p>
                          <div className="flex items-center justify-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-muted"
                              onClick={() => handleDecrementQuantity(item)}
                            >
                              <span className="text-xs">-</span>
                            </Button>
                            <span className="font-semibold mx-2 min-w-[20px] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-muted"
                              onClick={() => handleIncrementQuantity(item)}
                            >
                              <span className="text-xs">+</span>
                            </Button>
                          </div>
                        </div>

                        <div className="text-center min-w-[80px]">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Price
                          </p>
                          <p className="font-medium text-sm">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>

                        <div className="text-center min-w-[90px]">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                            Total
                          </p>
                          <p className="font-bold text-primary text-lg">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemoveItem(item)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          {/* Order Total */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${cart.total}.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>$0.00</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${cart.total}.00</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full h-11"
                size="lg"
                onClick={handleSubmitCart}
              >
                <Save className="h-4 w-4 mr-2" />
                Complete Order
              </Button>
              <Button
                variant="outline"
                className="w-full text-destructive hover:text-destructive"
                size="lg"
                onClick={handleClearCart}
              >
                <Trash className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Items in cart
                </span>
                <Badge variant="secondary">{cart.items.length}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last scan</span>
                <span className="text-sm">{lastScanned}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
