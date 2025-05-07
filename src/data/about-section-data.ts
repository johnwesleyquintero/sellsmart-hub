// src/data/about-section-data.ts
import type { Experience, Skill } from '@/lib/types';

// Define the constant for the repeated string
const SKILLS_B2B_MANAGEMENT = 'Skills: B2B, Management';

// Update the fallback skills to match your expertise areas
export const fallbackSkills: Skill[] = [
  {
    name: 'Data Analytics',
    level: 95,
    icon: 'LineChart',
  },
  {
    name: 'Programming (Python/R/JS)',
    level: 90,
    icon: 'Code',
  },
  {
    name: 'Machine Learning',
    level: 85,
    icon: 'Brain',
  },
  {
    name: 'Database Management',
    level: 90,
    icon: 'Database',
  },
  {
    name: 'AI Automation',
    level: 95,
    icon: 'Workflow',
  },
];

// Update the fallback experience to match your latest experience
export const fallbackExperience: Experience[] = [
  {
    title: 'Founder/Developer',
    company: 'Nebula-Singularity: SellSmart',
    period: 'Jan 2025 - Present',
    description: 'All-in-One Amazon Seller Platform',
    achievements: [
      'Developed AI-powered tools for Amazon sellers',
      'Created data visualization dashboards for seller insights',
      'Automated listing optimization and inventory management',
    ],
  },
  {
    title: 'Amazon Specialist 2',
    company: 'My Amazon Guy',
    period: 'Oct 2024 - Mar 2025',
    description: 'Skills: Data Visualization, Amazon SEO',
    achievements: [
      'Implemented data visualization solutions for client reporting',
      'Optimized Amazon SEO strategies for multiple clients',
      'Increased client sales by an average of 35% through strategic optimizations',
    ],
  },
  {
    title: 'Item Specialist',
    company: 'Bulk Buy America',
    period: 'Mar 2024 - Sep 2024',
    description: 'Remote US • Skills: VLOOKUP, Price Checker',
    achievements: [
      'Utilized VLOOKUP and advanced Excel functions for inventory management',
      'Developed custom price checker tools to optimize competitive pricing',
      'Streamlined inventory processes resulting in 25% efficiency improvement',
    ],
  },
  {
    title: 'Marketplace Support',
    company: 'Adorama',
    period: 'May 2023 - Sep 2023',
    description: SKILLS_B2B_MANAGEMENT, // Use the constant
    achievements: [
      'Managed client relationships and marketplace integrations',
      'Implemented efficient management processes',
      'Provided technical support for marketplace operations',
    ],
  },
  {
    title: 'Amazon Account Manager',
    company: 'Champion E-com LLC',
    period: 'Oct 2022 - Sep 2023',
    description: SKILLS_B2B_MANAGEMENT, // Use the constant
    achievements: [
      'Oversaw account health and performance metrics',
      'Developed management strategies for multiple clients',
      'Implemented best practices for Amazon marketplace success',
    ],
  },
  {
    title: 'Amazon Wholesale Buyer',
    company: 'Sales.support',
    period: 'Oct 2018 - Jul 2022',
    description: 'Skills: B2B, Management',
    achievements: [
      'Identified profitable wholesale opportunities',
      'Negotiated with suppliers for optimal pricing',
      'Implemented inventory management systems',
    ],
  },
];

export const education = [
  {
    degree: "Bachelor's degree, Elementary Education and Teaching",
    institution: 'University of Southeastern Philippines',
    period: '2015 - 2019',
    description:
      'Licensed Professional Teacher with focus on educational technology.',
  },
  {
    degree: 'Educational Technology',
    institution: 'Iowa State University',
    period: 'May 2018',
    description: 'Specialized training in educational technology applications.',
  },
  {
    degree: 'Information Technology',
    institution: 'Magugpo Institute of Technology',
    period: '2014',
    description:
      'Foundation in information technology principles and applications.',
  },
];
