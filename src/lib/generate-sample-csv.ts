type SampleDataType = 'fba' | 'keyword' | 'ppc' | 'keyword-dedup' | 'acos';

export function generateSampleCsv(dataType: SampleDataType): string {
  const DEFAULT_PRODUCT_NAME = 'Sample Product';

  interface SampleData {
    productName: string;
    cost?: number;
    price?: number;
    fees?: number;
    keywords?: string;
    searchVolume?: number;
    competition?: string;
    clicks?: number;
    impressions?: number;
    ctr?: number;
    cpc?: number;
    spend?: number;
    acos?: number;
    campaign?: string;
    [key: string]: unknown;
    adSpend?: number;
    sales?: number;
  }

  let data: SampleData[] = [];

  switch (dataType) {
    case 'fba':
      data = [
        {
          productName: 'Wireless Earbuds Pro',
          cost: 22.5,
          price: 49.99,
          fees: 7.25,
        },
        {
          productName: 'Premium Phone Case',
          cost: 5.75,
          price: 19.99,
          fees: 4.5,
        },
        {
          productName: 'Fast Charging Cable',
          cost: 3.25,
          price: 12.99,
          fees: 3.75,
        },
        {
          productName: 'Bluetooth Speaker',
          cost: 18.5,
          price: 39.99,
          fees: 6.8,
        },
        {
          productName: 'Fitness Tracker',
          cost: 15.75,
          price: 34.99,
          fees: 5.25,
        },
      ];
      break;
    case 'keyword':
      data = [
        {
          productName: 'Wireless Earbuds',
          keywords:
            'bluetooth earbuds, wireless headphones, earphones, noise cancelling earbuds',
          searchVolume: 135000,
          competition: 'High',
        },
        {
          productName: 'Phone Case',
          keywords:
            'protective case, phone cover, slim case, iphone 13 case, samsung case',
          searchVolume: 74500,
          competition: 'Medium',
        },
        {
          productName: 'Charging Cable',
          keywords:
            'fast charging, usb cable, phone charger, type c cable, lightning cable',
          searchVolume: 52000,
          competition: 'Low',
        },
      ];
      break;
    case 'ppc':
      data = [
        {
          productName: DEFAULT_PRODUCT_NAME,
          name: 'Auto Campaign - Wireless Earbuds',
          type: 'Auto',
          spend: 245.67,
          sales: 1245.89,
          impressions: 12450,
          clicks: 320,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          name: 'Sponsored Products - Phone Cases',
          type: 'Sponsored Products',
          spend: 178.34,
          sales: 567.21,
          impressions: 8750,
          clicks: 245,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          name: 'Sponsored Brands - Charging Cables',
          type: 'Sponsored Brands',
          spend: 89.45,
          sales: 156.78,
          impressions: 4320,
          clicks: 98,
        },
      ];
      break;
    case 'keyword-dedup':
      data = [
        {
          productName: 'Wireless Earbuds',
          keywords:
            'bluetooth earbuds, wireless earbuds, earbuds bluetooth, wireless headphones, bluetooth earbuds, earphones, wireless earphones, earbuds',
        },
        {
          productName: 'Phone Case',
          keywords:
            'phone case, protective case, phone cover, slim case, phone case, iphone case, protective cover, phone case',
        },
      ];
      break;
    case 'acos':
      data = [
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Wireless Earbuds',
          adSpend: 245.67,
          sales: 1245.89,
          impressions: 12450,
          clicks: 320,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Phone Cases',
          adSpend: 178.34,
          sales: 567.21,
          impressions: 8750,
          clicks: 245,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Charging Cables',
          adSpend: 89.45,
          sales: 156.78,
          impressions: 4320,
          clicks: 98,
        },
        // Beauty product additions
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Hyaluronic Acid Serum',
          adSpend: 132.45,
          sales: 645.90,
          impressions: 8540,
          clicks: 215,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Vitamin C Face Mask',
          adSpend: 89.90,
          sales: 320.45,
          impressions: 6210,
          clicks: 178,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Retinol Night Cream',
          adSpend: 167.80,
          sales: 845.25,
          impressions: 9325,
          clicks: 265,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - CBD Body Lotion',
          adSpend: 210.30,
          sales: 923.70,
          impressions: 11240,
          clicks: 332,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Display - Collagen Eye Cream',
          adSpend: 155.55,
          sales: 734.85,
          impressions: 9650,
          clicks: 287,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Retinol Serum',
          adSpend: 198.25,
          sales: 945.30,
          impressions: 11200,
          clicks: 315,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - CBD Body Lotion',
          adSpend: 210.30,
          sales: 923.70,
          impressions: 11240,
          clicks: 332,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Ceramide Moisturizer',
          adSpend: 145.90,
          sales: 680.45,
          impressions: 8450,
          clicks: 240,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - AHA/BHA Peel',
          adSpend: 122.75,
          sales: 590.20,
          impressions: 7650,
          clicks: 205,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Hyaluronic Acid Toner',
          adSpend: 88.40,
          sales: 420.75,
          impressions: 5820,
          clicks: 165,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - Vitamin C Mask',
          adSpend: 132.60,
          sales: 645.90,
          impressions: 8750,
          clicks: 220,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Niacinamide Serum',
          adSpend: 178.90,
          sales: 855.25,
          impressions: 9650,
          clicks: 290,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Rosehip Oil',
          adSpend: 95.45,
          sales: 465.80,
          impressions: 6420,
          clicks: 185,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - SPF 50 Sunscreen',
          adSpend: 165.20,
          sales: 785.40,
          impressions: 9250,
          clicks: 275,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Ceramide Moisturizer',
          adSpend: 98.75,
          sales: 423.60,
          impressions: 7325,
          clicks: 204,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Hair Growth Serum',
          adSpend: 143.20,
          sales: 687.30,
          impressions: 8845,
          clicks: 245,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Acne Treatment Kit',
          adSpend: 121.90,
          sales: 587.45,
          impressions: 7980,
          clicks: 225,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - LED Face Mask',
          adSpend: 298.45,
          sales: 1345.80,
          impressions: 15420,
          clicks: 415,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Microcurrent Device',
          adSpend: 187.60,
          sales: 845.90,
          impressions: 10235,
          clicks: 298,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Scalp Massager',
          adSpend: 76.85,
          sales: 345.75,
          impressions: 6540,
          clicks: 185,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Jade Roller Set',
          adSpend: 65.30,
          sales: 287.40,
          impressions: 5320,
          clicks: 158,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - Gua Sha Tool',
          adSpend: 88.90,
          sales: 398.25,
          impressions: 6985,
          clicks: 195,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Sunscreen Stick',
          adSpend: 112.45,
          sales: 523.80,
          impressions: 8450,
          clicks: 235,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Products - Lip Plumper',
          adSpend: 95.75,
          sales: 432.90,
          impressions: 7210,
          clicks: 208,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Sponsored Brands - Hair Dryer Brush',
          adSpend: 165.80,
          sales: 798.50,
          impressions: 9325,
          clicks: 275,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Manual Campaign - Curling Iron',
          adSpend: 134.20,
          sales: 623.75,
          impressions: 8540,
          clicks: 245,
        },
        {
          productName: DEFAULT_PRODUCT_NAME,
          campaign: 'Auto Campaign - Body Scrub',
          adSpend: 78.45,
          sales: 354.60,
          impressions: 6215,
          clicks: 178,
        },
      ];
      break;
    default:
      return '';
  }

  if (data.length === 0) return '';
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((obj) =>
    Object.values(obj)
      .map((v) => (typeof v === 'string' ? `"${v}"` : v))
      .join(','),
  );

  return [headers, ...rows].join('\n');
}

export function downloadSampleCsv(
  dataType: SampleDataType,
  fileName?: string,
): void {
  const csv = generateSampleCsv(dataType);
  if (!csv) return;

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName || `sample-${dataType}-data.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
