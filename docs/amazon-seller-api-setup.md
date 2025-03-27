# Amazon Seller API Integration Guide

## Overview
This guide explains how to set up and use the Amazon Seller API integration for our seller tools suite. The integration enables real-time FBA fee calculations, inventory tracking, and pricing data.

## Prerequisites
1. Amazon Seller Central Professional account
2. Amazon Seller API access (SP-API)
3. Node.js environment

## Getting API Credentials

### 1. Create an SP-API Application
1. Go to Seller Central and navigate to the Developer Central section
2. Create a new application
3. Note down the following credentials:
   - Client ID
   - Client Secret
   - AWS IAM ARN

### 2. Generate a Refresh Token
1. Use the LWA (Login with Amazon) authorization workflow
2. Follow Amazon's OAuth process
3. Store the refresh token securely

## Environment Setup

1. Copy `.env.example` to `.env`
2. Add your credentials:
```env
AMAZON_SELLER_CLIENT_ID=your_client_id
AMAZON_SELLER_CLIENT_SECRET=your_client_secret
AMAZON_SELLER_REFRESH_TOKEN=your_refresh_token
AMAZON_SELLER_REGION=NA  # NA, EU, or FE
```

## Rate Limiting
The integration includes built-in rate limiting to comply with Amazon's API restrictions:
- Default: 1 request per second
- Burst: 5 requests
- Max retries: 3

## Features

### FBA Fee Calculator
- Real-time fee calculation
- Batch processing support
- Automatic rate limiting
- Error handling with fallback to estimated fees

### Inventory Management
- Real-time inventory levels
- Inbound shipment tracking
- Reserved quantity monitoring

### Pricing Intelligence
- Buy Box price monitoring
- Lowest price tracking
- Competitor count analysis

## Security Best Practices
1. Never commit API credentials to version control
2. Use environment variables for sensitive data
3. Implement proper error handling
4. Monitor API usage and implement alerts

## Troubleshooting

### Common Issues
1. Rate limiting errors
   - Solution: Adjust rate limiting settings in config
2. Authentication failures
   - Solution: Verify credentials and token refresh process
3. API timeout errors
   - Solution: Implement proper retry logic

### Support
For technical support or questions about the API integration, please refer to:
- Amazon Seller Central Help
- SP-API Documentation
- Our Developer Support Team