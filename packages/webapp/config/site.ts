export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'Podverse',
  description: 'Take your podcast to the next level with AI superpowers.',
  mainNav: [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'Explore',
      href: '/explore',
    },
    {
      title: 'About',
      href: '/about',
    },
    {
      title: 'Pricing',
      href: '/pricing',
    }
  ],
  links: {
    twitter: 'https://twitter.com/shadcn',
    github: 'https://github.com/shadcn/ui',
    docs: 'https://ui.shadcn.com',
  },
};
