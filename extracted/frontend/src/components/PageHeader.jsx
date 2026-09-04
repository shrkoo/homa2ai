import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Menu } from 'lucide-react';

export default function PageHeader({ title, action }) {
  const { openSidebar } = useOutletContext();
  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-lg border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2 px-4 h-14">
        <button onClick={openSidebar} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-accent lg:hidden">
          <Menu size={20} />
        </button>
        <h1 className="font-heading text-base font-semibold flex-1 truncate">{title}</h1>
        {action}
      </div>
    </header>
  );
}