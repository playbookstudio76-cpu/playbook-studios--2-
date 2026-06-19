import React, { useMemo } from 'react';
import { CustomPage } from '../types';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

interface PageDetailViewProps {
  slug: string;
  pages: CustomPage[];
  onNavigate: (view: string, props?: any) => void;
}

export default function PageDetailView({ slug, pages, onNavigate }: PageDetailViewProps) {
  const page = useMemo(() => {
    return pages.find(p => p.slug === slug || p.id === slug) || null;
  }, [pages, slug]);

  const renderContent = (content: string) => {
    return content.split('\n\n').map((block, idx) => {
      // Headers
      if (block.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-xl md:text-2xl font-semibold tracking-tight text-white mt-8 mb-4 border-b border-zinc-800 pb-2">
            {block.substring(4)}
          </h3>
        );
      }
      
      // Unordered lists
      if (block.startsWith('- ')) {
        const items = block.split('\n').map(line => line.replace(/^- /, '').trim());
        return (
          <ul key={idx} className="list-disc pl-5 my-6 space-y-3 text-zinc-300">
            {items.map((it, i) => {
              const parts = it.split('**');
              return (
                <li key={i} className="leading-relaxed">
                  {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-[#DDA15E] font-medium">{p}</strong> : p)}
                </li>
              );
            })}
          </ul>
        );
      }

      // Ordered lists
      if (/^\d+\.\s/.test(block)) {
        const items = block.split('\n').map(line => line.replace(/^\d+\.\s/, '').trim());
        return (
          <ol key={idx} className="list-decimal pl-5 my-6 space-y-3 text-zinc-300">
            {items.map((it, i) => {
              const parts = it.split('**');
              return (
                <li key={i} className="leading-relaxed">
                  {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-[#DDA15E] font-medium">{p}</strong> : p)}
                </li>
              );
            })}
          </ol>
        );
      }

      // Regular paragraph
      const parts = block.split('**');
      return (
        <p key={idx} className="leading-relaxed text-zinc-400 my-4 text-sm md:text-base">
          {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-[#DDA15E] font-medium">{p}</strong> : p)}
        </p>
      );
    });
  };

  if (!page) {
    return (
      <div className="max-w-[720px] mx-auto px-4 py-[120px] text-center" id="page-not-found">
        <h2 className="text-3xl font-display uppercase tracking-wider text-primary mb-4">Page Not Found</h2>
        <p className="text-secondary text-sm mb-8">The requested document has not been compiled or published yet.</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-6 py-3 border border-outline-variant text-[10px] font-label-caps tracking-widest uppercase hover:bg-white hover:text-black transition"
        >
          Return Home
        </button>
      </div>
    );
  }

  const formattedDate = page.updatedAt ? new Date(page.updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Recently Updated';

  return (
    <div className="bg-background text-on-background min-h-[60vh] py-12 md:py-[80px]" id={`page-${page.slug}`}>
      <div className="max-w-[800px] mx-auto px-6 md:px-8">
        
        {/* Navigation Breadcrumb */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2 text-xs font-label-caps tracking-widest uppercase text-secondary hover:text-primary transition mb-10 group"
          id="page-back-button"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Studio</span>
        </button>

        {/* Page Header */}
        <div className="border-b border-outline-variant pb-6 mb-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] font-sans text-primary select-none uppercase" id="page-title">
            {page.title}
          </h1>
          <div className="flex items-center space-x-4 mt-4 font-mono text-[10px] tracking-wider text-secondary uppercase">
            <span className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-[#DDA15E]" />
              <span>Checked Revision: {formattedDate}</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>STUDIO VERIFIED</span>
            </span>
          </div>
        </div>

        {/* Page Renderable Content Grid */}
        <div className="font-sans antialiased space-y-4" id="page-markdown-content">
          {renderContent(page.content)}
        </div>

        {/* Brand Footer Accents */}
        <div className="border-t border-outline-variant pt-12 mt-16 text-center">
          <p className="font-label-caps text-[9px] tracking-[0.25em] text-secondary uppercase">
            PLAYBOOK STUDIOS • ARCHITECTURAL APPAREL LAB
          </p>
        </div>

      </div>
    </div>
  );
}
