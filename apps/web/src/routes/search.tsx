import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import SearchResultsPage from "@/components/SearchResultsPage";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Search Results | ShopNova" },
      { name: "description", content: "Shop millions of products on ShopNova. Compare prices, reviews, and free delivery options from global verified sellers." },
    ],
  }),

  component: SearchRoute,
});

function SearchRoute() {
  const { q } = Route.useSearch();
  return <SearchResultsPage query={q || "wireless headphones"} />;
}
