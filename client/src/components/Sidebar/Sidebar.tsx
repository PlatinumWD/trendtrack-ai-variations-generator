import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-zinc-200/80 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center px-6 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight text-zinc-900">TrendTrack</span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto lg:hidden text-zinc-500 hover:text-zinc-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-8">
          <nav className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-100 text-zinc-900 font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Generation
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              My Projects
            </a>
            <a href="#" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </a>
          </nav>

          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 px-3">Recent History</h4>
            <div className="space-y-1">
              {[
                { id: 1, title: 'Summer Collection', date: '2h ago' },
                { id: 2, title: 'Nike Shoes variations', date: 'Yesterday' },
                { id: 3, title: 'Black Friday Ads', date: '3 days ago' },
              ].map((item) => (
                <a key={item.id} href="#" className="block px-3 py-2 rounded-lg hover:bg-zinc-50 transition-colors group">
                  <p className="text-sm font-medium text-zinc-700 group-hover:text-zinc-900 truncate">{item.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{item.date}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-zinc-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-50">
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 font-bold text-sm">
              PT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">Platinum</p>
              <p className="text-xs text-zinc-500 truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
