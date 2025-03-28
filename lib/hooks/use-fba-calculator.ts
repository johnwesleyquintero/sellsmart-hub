import { useState } from "react";
import { AmazonSellerApi } from "../amazon-seller-api";
import { amazonSellerApiConfig } from "../config/amazon-seller-api";
import { ProductData } from "../fba-calculator-utils";

interface UseFBACalculatorProps {
  onError?: (error: string) => void;
}

export function useFBACalculator({ onError }: UseFBACalculatorProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductData[]>([]);

  // Initialize Amazon Seller API client
  const api = new AmazonSellerApi(amazonSellerApiConfig.credentials);

  const calculateWithRealFees = async (products: ProductData[]) => {
    setIsLoading(true);
    try {
      // Extract ASINs from products (assuming product field contains ASIN)
      const asins = products.map((p) => p.product);

      // Get real-time FBA fees from Amazon API
      const fbaFees = await api.batchGetFBAFees(asins);

      // Map API response to products
      const updatedProducts = products.map((product, index) => {
        const fees = fbaFees[index]?.fbaFees.totalFees || product.fees;
        const profit = product.price - product.cost - fees;
        const roi = (profit / product.cost) * 100;
        const margin = (profit / product.price) * 100;

        return {
          ...product,
          fees,
          profit,
          roi,
          margin,
        };
      });

      setProducts(updatedProducts);
      return updatedProducts;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch FBA fees";
      onError?.(errorMessage);
      // Fallback to local calculation if API fails
      return products.map((product) => ({
        ...product,
        profit: product.price - product.cost - product.fees,
        roi:
          ((product.price - product.cost - product.fees) / product.cost) * 100,
        margin:
          ((product.price - product.cost - product.fees) / product.price) * 100,
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const addProducts = async (newProducts: ProductData[]) => {
    const calculatedProducts = await calculateWithRealFees(newProducts);
    setProducts((prev) => [...prev, ...calculatedProducts]);
  };

  const clearProducts = () => {
    setProducts([]);
  };

  return {
    products,
    isLoading,
    addProducts,
    clearProducts,
    calculateWithRealFees,
  };
}
