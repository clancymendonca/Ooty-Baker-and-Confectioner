"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import { BiMapPin, BiEnvelope, BiPhone, BiRightArrowAlt } from "react-icons/bi";
import { FaFacebookF, FaLinkedin, FaInstagram } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const router = useRouter();
  const pathname = usePathname();

  const scrollToHash = useCallback((hashId: string) => {
    const element = document.getElementById(hashId);
    if (element) {
      // Add offset for fixed header
      const headerHeight = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - headerHeight;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleHashLink = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    const hashId = hash.replace('#', '');
    
    // If we're on the home page, scroll to the element
    if (pathname === '/') {
      scrollToHash(hashId);
      // Update URL hash
      window.history.pushState(null, '', hash);
    } else {
      // If not on home page, just redirect to homepage
      router.push('/');
    }
  };

  return (
    <footer 
      className="text-white relative overflow-hidden"
      style={{
        background: "#007A4D" // Ooty Forest Green
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-white">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 py-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-bold mb-4 text-white">Ooty Baker & Confectioner</h3>
            <p className="text-white/90 mb-6 leading-relaxed">
              Crafting delicious sweets and confectioneries with love and tradition since years. 
              Your trusted partner for premium quality products.
            </p>
            {/* Social Media */}
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/people/Ooty-Baker-Confectioner/100065324206767/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-[#4a4a4a] hover:bg-[#1abc9c] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Facebook"
              >
                <FaFacebookF className="text-white text-lg" />
              </a>
              <a
                href="#"
                className="w-11 h-11 rounded-full bg-[#4a4a4a] hover:bg-[#1abc9c] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-white text-lg" />
              </a>
              <a
                href="https://www.instagram.com/ootybakerandconfectioner/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-11 h-11 rounded-full bg-[#4a4a4a] hover:bg-[#1abc9c] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-lg"
                aria-label="Instagram"
              >
                <FaInstagram className="text-white text-lg" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white">Quick Links</h3>
            <nav>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/" 
                    className="flex items-center text-white/90 hover:text-white transition-colors duration-300 group"
                  >
                    <BiRightArrowAlt className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-2 transition-transform">Home</span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/about" 
                    className="flex items-center text-white/90 hover:text-white transition-colors duration-300 group"
                  >
                    <BiRightArrowAlt className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-2 transition-transform">About Us</span>
                  </Link>
                </li>
                <li>
                  <a 
                    href="#products" 
                    onClick={(e) => handleHashLink(e, '#products')}
                    className="flex items-center text-white/90 hover:text-white transition-colors duration-300 group cursor-pointer"
                  >
                    <BiRightArrowAlt className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-2 transition-transform">Products</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="#inquiry" 
                    onClick={(e) => handleHashLink(e, '#inquiry')}
                    className="flex items-center text-white/90 hover:text-white transition-colors duration-300 group cursor-pointer"
                  >
                    <BiRightArrowAlt className="mr-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="group-hover:translate-x-2 transition-transform">Inquiry</span>
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white">Contact Us</h3>
            <div className="space-y-4">
              <a
                href="https://maps.app.goo.gl/xD9Kz6y9CXBGqBQC9"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start space-x-3 text-white/90 hover:text-white transition-colors duration-300 group"
              >
                <BiMapPin className="text-xl mt-1 flex-shrink-0 group-hover:text-[#1abc9c] transition-colors" />
                <p className="leading-relaxed">
                  Bommanahalli, Bengaluru<br />
                  Karnataka, India
                </p>
              </a>
              <a
                href="mailto:info@ootybaker.com"
                className="flex items-center space-x-3 text-white/90 hover:text-white transition-colors duration-300 group"
              >
                <BiEnvelope className="text-xl flex-shrink-0 group-hover:text-[#1abc9c] transition-colors" />
                <span>info@ootybaker.com</span>
              </a>
              <a
                href="tel:08025731234"
                className="flex items-center space-x-3 text-white/90 hover:text-white transition-colors duration-300 group"
              >
                <BiPhone className="text-xl flex-shrink-0 group-hover:text-[#1abc9c] transition-colors" />
                <span>08025731234</span>
              </a>
            </div>
          </div>

          {/* Business Hours / Additional Info */}
          <div>
            <h3 className="text-xl font-semibold mb-6 text-white">Visit Us</h3>
            <div className="space-y-4 text-white/90">
              <div>
                <p className="font-medium text-white mb-1">Opening Hours</p>
                <p>Monday - Saturday</p>
                <p>9:00 AM - 8:00 PM</p>
              </div>
              <div className="pt-4">
                <p className="font-medium text-white mb-1">We Deliver</p>
                <p>Fresh products delivered to your doorstep</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-8 pb-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-white/70 text-sm">
              &copy; {currentYear} Ooty Baker & Confectioner. All Rights Reserved.
            </p>
            <div className="flex space-x-6 text-sm text-white/70">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
