"use client";
import { useEffect, useState } from "react";
import ProductCard from "@/components/product-card";

export default function Articles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/rss", { cache: "no-store" });
      const data = await res.json();
      setArticles(data.articles || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p>Loading articles...</p>;
  if (!articles.length) return <p>No articles found.</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Latest Fantasy Articles</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((a, i) => (
          <ProductCard key={i} post={a} />
        ))}
      </div>
    </div>
  );
}
