"use client";
import { useEffect, useState } from "react";

export default function Articles() {
  const [articles, setArticles] = useState<Array<{
    title: string;
    link: string;
    pubDate: string;
    source: string;
    description: string;
    author: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/rss");
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading articles...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Latest Articles</h2>
      <ul className="space-y-2">
        {articles.map((a, i) => (
          <li key={i} className="border-b pb-2">
            <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-blue-600">
              {a.title}
            </a>{" "}
            <span className="text-sm text-gray-500">({a.source})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
