import EPWLogo from './epw-logo';

const Footer = () => {
  return (
    <footer className="mt-auto py-6 px-4 border-t border-border bg-background">
      <div className="max-w-6xl mx-auto flex items-center justify-center gap-3">
        <EPWLogo size="small" />
        <span className="text-sm text-muted-foreground">
          poderes by EPW
        </span>
      </div>
    </footer>
  );
};

export default Footer;