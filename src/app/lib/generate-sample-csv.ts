import Papa from 'papaparse';

type SampleDataType = 'fba' | 'keyword' | 'ppc' | 'keyword-dedup' | 'acos';

export function generateSampleCsv(dataType: SampleDataType): string {
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
          name: 'Auto Campaign - Wireless Earbuds',
          type: 'Auto',
          spend: 245.67,
          sales: 1245.89,
          impressions: 12450,
          clicks: 320,
        },
        {
          name: 'Sponsored Products - Phone Cases',
          type: 'Sponsored Products',
          spend: 178.34,
          sales: 567.21,
          impressions: 8750,
          clicks: 245,
        },
        {
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
          productName: 'Sample Product', // Added to satisfy SampleData
          campaign: 'Auto Campaign - Wireless Earbuds',
          adSpend: 245.67,
          sales: 1245.89,
          impressions: 12450,
          clicks: 320,
        },
        {
          productName: 'Sample Product', // Added to satisfy SampleData
          campaign: 'Sponsored Products - Phone Cases',
          adSpend: 178.34,
          sales: 567.21,
          impressions: 8750,
          clicks: 245,
        },
        {
          productName: 'Sample Product', // Added to satisfy SampleData
          campaign: 'Sponsored Brands - Charging Cables',
          adSpend: 89.45,
          sales: 156.78,
          impressions: 4320,
          clicks: 98,
        },
      ];
      break;
    default:
      return '';
  }

  return Papa.unparse(data);
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
