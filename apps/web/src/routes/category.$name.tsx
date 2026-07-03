import { createFileRoute } from "@tanstack/react-router";
import CategoryLandingPage, { getCategoryConfig } from "@/components/CategoryLandingPage";

export const Route = createFileRoute("/category/$name")({
  head: ({ params }) => {
    const cfg = getCategoryConfig((params as { name: string }).name);
    return {
      meta: [
        { title: `${cfg.title} — Shop on ShopNova` },
        { name: "description", content: `${cfg.subtitle} Shop ${cfg.title.toLowerCase()} from top global brands on ShopNova.` },
        { property: "og:title", content: `${cfg.title} on ShopNova` },
        { property: "og:description", content: cfg.subtitle },
      ],
    };
  },
  component: CategoryRoute,
});

function CategoryRoute() {
  const { name } = Route.useParams();
  return <CategoryLandingPage slug={name} />;
}
