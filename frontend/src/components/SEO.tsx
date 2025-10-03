import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: object;
}

const defaultSEO = {
  title: 'MarkFair - Web3 Marketing Platform | Connect Brands with KOLs',
  description: 'MarkFair connects Web3 brands with Key Opinion Leaders (KOLs) through smart contract escrow. Secure crypto payments, transparent campaigns, and fair rewards for all parties.',
  keywords: 'Web3 marketing, KOL marketing, crypto payments, blockchain advertising, smart contracts, Starknet, influencer marketing, DeFi marketing',
  image: 'https://www.markfair.xyz/markfair-logo.png',
  url: 'https://www.markfair.xyz/',
  type: 'website' as const,
};

export const SEO: React.FC<SEOProps> = ({
  title = defaultSEO.title,
  description = defaultSEO.description,
  keywords = defaultSEO.keywords,
  image = defaultSEO.image,
  url = defaultSEO.url,
  type = defaultSEO.type,
  structuredData,
}) => {
  const fullTitle = title === defaultSEO.title ? title : `${title} | MarkFair`;
  const fullUrl = url === defaultSEO.url ? url : `https://www.markfair.xyz${url}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={fullUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

// Predefined SEO configurations for different pages
export const pageSEO = {
  home: {
    title: 'MarkFair - Web3 Marketing Platform | Connect Brands with KOLs',
    description: 'MarkFair connects Web3 brands with Key Opinion Leaders (KOLs) through smart contract escrow. Secure crypto payments, transparent campaigns, and fair rewards for all parties.',
    keywords: 'Web3 marketing, KOL marketing, crypto payments, blockchain advertising, smart contracts, Starknet, influencer marketing, DeFi marketing',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'MarkFair',
      description: 'Web3 Marketing Platform connecting brands with Key Opinion Leaders through smart contract escrow',
      url: 'https://www.markfair.xyz/',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      creator: {
        '@type': 'Organization',
        name: 'MarkFair',
        url: 'https://www.markfair.xyz/',
      },
    },
  },
  
  dashboard: {
    title: 'Dashboard - MarkFair',
    description: 'Manage your MarkFair account, track campaigns, and connect with brands or KOLs. Access your personal dashboard for Web3 marketing activities.',
    keywords: 'dashboard, Web3 marketing dashboard, KOL dashboard, brand dashboard, campaign management',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'MarkFair Dashboard',
      description: 'Personal dashboard for managing Web3 marketing activities',
      url: 'https://www.markfair.xyz/dashboard',
    },
  },
  
  tasks: {
    title: 'Task Hall - MarkFair',
    description: 'Browse available marketing tasks from Web3 brands. Find opportunities to earn crypto by completing marketing campaigns and content creation tasks.',
    keywords: 'marketing tasks, Web3 tasks, KOL tasks, crypto jobs, marketing campaigns, content creation',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'MarkFair Task Hall',
      description: 'Browse and apply for Web3 marketing tasks',
      url: 'https://www.markfair.xyz/tasks',
    },
  },
  
  createTask: {
    title: 'Create Task - MarkFair',
    description: 'Create marketing tasks for KOLs to complete. Set up campaigns, define requirements, and manage payments through smart contract escrow.',
    keywords: 'create task, marketing campaign, brand tools, task creation, Web3 marketing',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Create Marketing Task - MarkFair',
      description: 'Create and manage marketing tasks for KOLs',
      url: 'https://www.markfair.xyz/tasks/create',
    },
  },
  
  youtubeConnect: {
    title: 'Connect YouTube - MarkFair',
    description: 'Connect your YouTube channel to MarkFair to verify your KOL status and access exclusive marketing opportunities.',
    keywords: 'YouTube connection, KOL verification, social media integration, content creator',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Connect YouTube Channel - MarkFair',
      description: 'Connect and verify your YouTube channel for KOL activities',
      url: 'https://www.markfair.xyz/youtube-connect',
    },
  },
};
