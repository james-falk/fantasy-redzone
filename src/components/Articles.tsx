"use client";
import { useEffect, useState } from "react";

export default function Articles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/rss");
        const data = await res.json();
        setArticles(data.articles || []);
      } catch (e) {
        console.error("Error fetching articles:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p>Loading articles...</p>;
  if (!articles.length) return <p>No articles found.</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Latest Fantasy Articles</h2>
      <ul className="space-y-2">
        {articles.map((a, i) => (
          <li key={i} className="border-b pb-2">
            <a
              href={a.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {a.title}
            </a>{" "}
            <span className="text-sm text-gray-500">({a.source})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
