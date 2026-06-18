export default function Footer({ onNavigate }: { onNavigate?: (view: string, props?: any) => void }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-outline-variant bg-surface-container-lowest text-on-background py-[64px] px-margin-mobile md:px-margin-desktop text-center">
      <div className="max-w-[1440px] mx-auto flex flex-col items-center space-y-10">
        
        {/* Playbook Studios Logo / Font mark */}
        <div>
          <h2 className="font-display-lg text-[32px] md:text-[40px] tracking-[-0.03em] uppercase text-primary font-semibold select-none">
            PLAYBOOK STUDIOS
          </h2>
          <p className="font-label-caps text-[10px] tracking-[0.2em] text-secondary uppercase mt-2">
            Refined Minimalist Architectural Streetwear
          </p>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-xs font-label-caps tracking-wider text-secondary">
          <button 
            onClick={() => onNavigate?.('shop', { filter: 'sustainability' })}
            className="hover:text-primary hover:underline transition-all cursor-pointer"
          >
            Sustainability
          </button>
          <button 
            onClick={() => onNavigate?.('shop', { filter: 'shipping' })}
            className="hover:text-primary hover:underline transition-all cursor-pointer"
          >
            Shipping & Returns
          </button>
          <button 
            onClick={() => onNavigate?.('shop', { filter: 'privacy' })}
            className="hover:text-primary hover:underline transition-all cursor-pointer"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => alert('Support Representative channel opened! Line is ready at playbookstudio76@gmail.com')}
            className="hover:text-primary hover:underline transition-all cursor-pointer"
          >
            Contact
          </button>
        </div>

        {/* Divider line */}
        <div className="w-24 h-[1px] bg-outline-variant"></div>

        {/* Copyright notice */}
        <p className="font-label-caps text-[9px] tracking-[0.2em] text-on-primary-fixed-variant uppercase">
          © {currentYear} PLAYBOOK STUDIOS. ALL RIGHTS RESERVED.
        </p>
      </div>
    </footer>
  );
}
