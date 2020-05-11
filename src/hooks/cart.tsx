import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const savedCart = await AsyncStorage.getItem('@GoMarketplace:products');

      if (savedCart) {
        setProducts(JSON.parse(savedCart));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProductList = products.map(cartProduct => {
        if (cartProduct.id === id) {
          const updatedProduct = cartProduct;
          updatedProduct.quantity += 1;
          return updatedProduct;
        }
        return cartProduct;
      });

      setProducts(newProductList);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProductList),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const newProductList = products
        .map(cartProduct => {
          if (cartProduct.id === id) {
            const updatedProduct = cartProduct;
            updatedProduct.quantity -= 1;
            return updatedProduct;
          }
          return cartProduct;
        })
        .filter(cartProduct => cartProduct.quantity > 0);

      setProducts(newProductList);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(newProductList),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const { id, image_url, price, title } = product as Product;
      const isAlreadyInCart = products.findIndex(
        productData => productData.id === product.id,
      );

      if (isAlreadyInCart < 0) {
        const newProduct = {
          id,
          title,
          image_url,
          price,
          quantity: 1,
        } as Product;

        const newProductList = [...products, newProduct];

        setProducts(newProductList);

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(newProductList),
        );
      } else {
        await increment(id);
      }
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
