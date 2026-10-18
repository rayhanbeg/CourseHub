import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, BookOpen } from 'lucide-react';
import { siteConfig } from '../config/site';

const Footer = () => {
  const year = new Date().getFullYear();
  const hasContact = siteConfig.contactEmail || siteConfig.contactPhone || siteConfig.contactAddress;

  return (
    <footer className="site-footer">
      <div className="public-container">
        <div className="site-footer__main">
          <div className="site-footer__brand"><Link to="/" className="site-footer__logo"><BookOpen size={17} />{siteConfig.name}</Link><p>Thoughtful courses for skills that move you forward.</p></div>
          <nav className="site-footer__group" aria-label="Learn"><h2>Learn</h2><Link to="/courses">Explore courses</Link><Link to="/#how-it-works">How it works</Link><Link to="/#faq">Frequently asked questions</Link></nav>
          <nav className="site-footer__group" aria-label="Your account"><h2>Your account</h2><Link to="/login">Sign in</Link><Link to="/register">Create an account</Link></nav>
          <div className="site-footer__group"><h2>Contact</h2>{siteConfig.contactEmail && <a href={`mailto:${siteConfig.contactEmail}`}>{siteConfig.contactEmail}<ArrowUpRight size={13} /></a>}{siteConfig.contactPhone && <a href={`tel:${siteConfig.contactPhone}`}>{siteConfig.contactPhone}</a>}{siteConfig.contactAddress && <p>{siteConfig.contactAddress}</p>}{!hasContact && <p>Contact details will be shared here soon.</p>}</div>
        </div>
        <div className="site-footer__bottom"><span>© {year} {siteConfig.name}</span><span>Made for curious minds.</span></div>
      </div>
    </footer>
  );
};

export default Footer;
