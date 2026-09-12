"use client";

import { useState, useEffect, useRef } from "react";
import { commonInputStyle } from "../../constants/styles";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface ProductSearchDropdownProps {
  value: string;
  onSelect: (name: string, price?: number) => void;
  placeholder?: string;
  style?: React.CSSProperties;
}

export default function ProductSearchDropdown({
  value,
  onSelect,
  placeholder,
  style,
}: ProductSearchDropdownProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync external value changes
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm && isOpen && searchTerm !== value) {
        searchProducts(searchTerm);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen, value]);

  const searchProducts = async (query: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateWithAI = async () => {
    setAiGenerating(true);
    try {
      const res = await fetch("/api/products/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: searchTerm }),
      });
      const data = await res.json();
      if (data.products && data.products.length > 0) {
        setResults(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative" style={style}>
      <input
        type="text"
        placeholder={placeholder}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setIsOpen(true);
          onSelect(e.target.value); // Keep parent updated with free text
        }}
        onFocus={() => {
          if (searchTerm) setIsOpen(true);
        }}
      />

      {isOpen && searchTerm && searchTerm !== value && (
        <div className="absolute top-full left-0 right-0 z-50 bg-popover border border-border rounded-md shadow-md max-h-[200px] overflow-y-auto mt-1 text-popover-foreground">
          {loading ? (
            <div className="p-2 text-muted-foreground text-sm">Searching...</div>
          ) : results.length > 0 ? (
            <ul className="list-none m-0 p-0">
              {results.map((product) => (
                <li
                  key={product.id}
                  className="p-2 px-3 cursor-pointer border-b border-border flex justify-between hover:bg-accent hover:text-accent-foreground transition-colors"
                  onMouseDown={() => {
                    onSelect(product.name, product.price);
                    setSearchTerm(product.name);
                    setIsOpen(false);
                  }}
                >
                  <span className="text-sm">{product.name}</span>
                  {product.price != null && (
                    <span className="text-sm text-muted-foreground">
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3 text-center">
              <p className="m-0 mb-2 text-sm text-muted-foreground">
                No products found
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  generateWithAI();
                }}
                disabled={aiGenerating}
                className="w-full px-3 py-1.5 bg-primary text-primary-foreground border-none rounded cursor-pointer text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {aiGenerating ? "Generating..." : `Generate with AI`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
