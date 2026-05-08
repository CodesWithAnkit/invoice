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
    <div ref={wrapperRef} style={{ position: "relative", ...style }}>
      <input
        type="text"
        placeholder={placeholder}
        style={{ ...commonInputStyle, width: "100%", boxSizing: "border-box" }}
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
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            maxHeight: "200px",
            overflowY: "auto",
            marginTop: "2px",
          }}
        >
          {loading ? (
            <div style={{ padding: "8px", color: "#666", fontSize: "0.875rem" }}>Searching...</div>
          ) : results.length > 0 ? (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {results.map((product) => (
                <li
                  key={product.id}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                  onMouseDown={() => {
                    onSelect(product.name, product.price);
                    setSearchTerm(product.name);
                    setIsOpen(false);
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "white")}
                >
                  <span style={{ fontSize: "0.875rem" }}>{product.name}</span>
                  {product.price != null && (
                    <span style={{ fontSize: "0.875rem", color: "#666" }}>
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: "12px", textAlign: "center" }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "0.875rem", color: "#666" }}>
                No products found
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  generateWithAI();
                }}
                disabled={aiGenerating}
                style={{
                  padding: "6px 12px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: aiGenerating ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  width: "100%",
                }}
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
