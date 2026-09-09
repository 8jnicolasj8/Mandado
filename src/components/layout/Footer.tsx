import Link from 'next/link';

export const Footer: React.FC = () => {
  const links = [
    { label: 'Planes', href: '/planes' },
    { label: 'Términos', href: '/legal/terminos' },
    { label: 'Privacidad', href: '/legal/privacidad' },
    { label: 'Pagos', href: '/legal/pagos' },
  ];

  return (
    <footer className="px-4 pt-6 pb-32 text-center">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-gray-500">
        {links.map((link, i) => (
          <span key={link.href} className="flex items-center gap-4">
            {i > 0 && <span className="text-gray-300">•</span>}
            <Link href={link.href} className="hover:text-emerald-700 hover:underline transition-colors">
              {link.label}
            </Link>
          </span>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-2">
        Mandado © 2026 · Lista de compras familiar
      </p>
    </footer>
  );
};