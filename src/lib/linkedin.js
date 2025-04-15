var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
export function getLinkedInExperience() {
  return __awaiter(this, void 0, void 0, function* () {
    try {
      // Check if environment variable is available
      if (!process.env.LINKEDIN_ACCESS_TOKEN) {
        return [];
      }
      // For now, return a placeholder response
      // In a real implementation, you would use the LinkedIn API client
      return [
        {
          title: 'Founder/Developer',
          company: 'Nebula-Singularity: SellSmart',
          period: 'Jan 2025 - Present',
          description: 'All-in-One Amazon Seller Platform',
          achievements: [
            'Developed AI-powered analytics and automation tools',
            'Created a modern web application for Amazon sellers',
          ],
        },
        {
          title: 'Amazon Specialist 2',
          company: 'My Amazon Guy',
          period: 'Oct 2024 - Mar 2025',
          description: 'Skills: Data Visualization, Amazon SEO',
          achievements: [
            'Enhanced data visualization for Amazon SEO',
            'Improved Amazon SEO strategies',
          ],
        },
        {
          title: 'Item Specialist',
          company: 'Bulk Buy America',
          period: 'Mar 2024 - Sep 2024',
          description: 'Remote US • Skills: VLOOKUP, Price Checker',
          achievements: [
            'Managed inventory using VLOOKUP',
            'Implemented efficient price checking mechanisms',
          ],
        },
        {
          title: 'Marketplace Support',
          company: 'Adorama',
          period: 'May 2023 - Sep 2023',
          description: 'Skills: B2B, Management',
          achievements: [
            'Supported B2B marketplace operations',
            'Managed marketplace support team',
          ],
        },
        {
          title: 'Amazon Account Manager',
          company: 'Champion E-com LLC',
          period: 'Oct 2022 - Sep 2023',
          description: 'Skills: B2B, Management',
          achievements: [
            'Managed Amazon accounts for B2B clients',
            'Improved account management processes',
          ],
        },
        {
          title: 'Amazon Wholesale Buyer',
          company: 'Sales.support',
          period: 'Oct 2018 - Jul 2022',
          description: 'Skills: B2B, Management',
          achievements: [
            'Managed wholesale buying for Amazon',
            'Improved B2B management processes',
          ],
        },
      ];
    } catch (error) {
      console.error('Error fetching LinkedIn experience:', error);
      return [];
    }
  });
}
