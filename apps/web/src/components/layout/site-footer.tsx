export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {[
          ['Shop', 'Deals', 'Categories', 'Brands'],
          ['Sell', 'Seller onboarding', 'Store tools', 'Growth'],
          ['Support', 'Orders', 'Returns', 'Help center'],
          ['Nova', 'About', 'Careers', 'Security'],
        ].map(([title, ...links]) => (
          <div key={title}>
            <h2 className="text-sm font-bold">{title}</h2>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              {links.map((link) => (
                <li key={link}>{link}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}
