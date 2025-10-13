import { FaGithub, FaEnvelope } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <img src="/markfair-logo.png" alt="MarkFair" className="w-8 h-8" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary-400 to-secondary-500 bg-clip-text text-transparent">
                MarkFair
              </span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Revolutionizing digital advertising through Web3 technology. 
              Connect advertisers with KOLs in a decentralized, transparent ecosystem.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://x.com/markfairxyz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-all duration-300 hover:scale-110"
                title="Follow us on X"
              >
                <FaXTwitter className="h-6 w-6" />
              </a>
              <a
                href="https://github.com/JY20/MarkFair"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-primary-400 transition-all duration-300 hover:scale-110"
                title="View our GitHub repository"
              >
                <FaGithub className="h-6 w-6" />
              </a>
              <a
                href="mailto:contact@markfair.xyz"
                className="text-gray-400 hover:text-primary-400 transition-all duration-300 hover:scale-110"
                title="Contact us via email"
              >
                <FaEnvelope className="h-6 w-6" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  For Advertisers
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  For KOLs
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Documentation
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <p className="text-gray-400">
            © 2024 MarkFair. All rights reserved. Built on Starknet.
          </p>
        </div>
      </div>
    </footer>
  );
}