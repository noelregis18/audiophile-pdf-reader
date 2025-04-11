
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full border-t bg-background py-6">
      <div className="container grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Contact</h2>
          <div className="space-y-2">
            <a 
              href="mailto:noel.regis04@gmail.com" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="h-4 w-4" />
              noel.regis04@gmail.com
            </a>
            <a 
              href="tel:+917319546900" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Phone className="h-4 w-4" />
              +91 7319546900
            </a>
            <a 
              href="https://maps.google.com/?q=Asansol,+West+Bengal,+India" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <MapPin className="h-4 w-4" />
              Asansol, West Bengal, India
            </a>
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Social</h2>
          <div className="space-y-2">
            <a 
              href="https://www.linkedin.com/in/noel-regis-aa07081b1/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-muted-foreground hover:text-foreground transition-colors"
            >
              LinkedIn
            </a>
            <a 
              href="https://github.com/noelregis18" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-muted-foreground hover:text-foreground transition-colors"
            >
              GitHub
            </a>
            <a 
              href="https://x.com/NoelRegis8" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-muted-foreground hover:text-foreground transition-colors"
            >
              Twitter
            </a>
          </div>
        </div>
        
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Links</h2>
          <div className="space-y-2">
            <a 
              href="http://topmate.io/noel_regis" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block text-muted-foreground hover:text-foreground transition-colors"
            >
              Topmate
            </a>
          </div>
        </div>
      </div>
      
      <div className="container mt-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Audiophile PDF Reader. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
