# Reports

Use the `requestReport` operation to retrieve performance reports. There are multiple ways to retrieve your campaign data, and using reports may not always be the most efficient way. If you are trying to download a record of your campaign structure and all of its entities (like AdGroups, keywords, productAds), we recommend that you run a snapshot of your entities instead of requesting a list of all elements in the campaign. For more information, see [snapshots](#).

**Note:** When generating a report (`POST`), there are separate endpoints for ad types Sponsored Products and Sponsored Brands reports. These endpoints are specified at the beginning of each section. When retrieving the report ID and downloading the report (`GET`), it is not necessary to differentiate the endpoints based on the ad type.

## Service Behavior

The following table describes the service behavior in terms of the URL space and HTTP methods supported by the service-managed resources.

| **Method** | **URL**                      | **Use Case**                                                                                       |
|------------|-------------------------------|---------------------------------------------------------------------------------------------------|
| `POST`     | `/{recordType}/report`       | Request the creation of a performance report for all entities of a single type which have performance data to report. |
| `GET`      | `/reports/{reportId}`         | Retrieve status, metadata, and location of a previously requested performance report.            |

## Operations

### `requestReport`

- **Method:** `POST /{recordType}/report`
- **Body:**

  ```json
  {
    "campaignType": "{campaignType}",
    "segment": "{segment}",
    "reportDate": "{reportDate}",
    "metrics": "{metrics}"
  }
  ```

- **Parameters:**

  | **Parameter Name** | **Type**     | **Specified In** | **Description**                                                                                   |
  |--------------------|--------------|-------------------|---------------------------------------------------------------------------------------------------|
  | `recordType`      | `string`     | URL               | The type of entity for which the report should be generated. Must be one of: `campaigns`, `adGroups`, `keywords`, `productAds`, or `asins`. |
  | `campaignType`    | `string`     | POST body         | The type of campaign for which performance data should be generated. Must be: `sponsoredProducts` or `headlineSearch`. |
  | `segment`         | `string`     | POST body         | Optional. Dimension on which to segment the report. If specified, must be `query` for keyword report or `placement` for campaigns report. |
  | `reportDate`      | `string`     | POST body         | The date for which to retrieve the performance report in `YYYYMMDD` format.                     |
  | `metrics`         | `string`     | POST body         | A comma-separated list of the metrics to be included in the report.                               |

- **Response:**

  | **Status Code** | **Response Object** |
  |-----------------|----------------------|
  | `202 - success` | `ReportResponse`     |
  | `401 - unauthorized` | `Error`           |
  | `406 – not acceptable` | `Error` (failed due to report date being too far in the past) |
  | `422 - unprocessable entity` | `Error` (failed due to incorrect parameters) |

### `getReport`

- **Method:** `GET /reports/{reportId}`
- **Description:** Retrieve a previously requested report identified by the `reportId`.

- **Parameters:**

  | **Parameter Name** | **Type**  | **Specified In** | **Description**                       |
  |--------------------|-----------|-------------------|---------------------------------------|
  | `reportId`        | `number`  | URL path          | The ID of the requested report.       |

- **Response:**

  | **Status Code** | **Response Object** |
  |-----------------|----------------------|
  | `200 - success` | `ReportResponse`     |
  | `401 - unauthorized` | `Error`           |
  | `404 - report not found` | `Error`         |
  | `404 - not found server` | `Error`         |

The `ReportResponse` will contain report status. When the report has completed, the `location` field will provide a redirect URL for the gzipped file containing the report. See [downloading reports](#downloading-reports) for more details.

## Valid Report Requests

Report requests will return a `422` if the parameters specified are unrecognized or if the combination of parameters is not supported. In particular, the choice of `recordType` may restrict the use of certain segments. Query segmentation can only be used in combination with keyword reports.

If you are receiving `404 - Not Found Server` errors, check that you have input the `entityType` endpoint correctly. Must be one of: `campaigns`, `adGroups`, `keywords`, `asins`, or `productAds`.

## Resource Representations

### `ReportResponse`

```json
{
  "title": "ReportResponse",
  "type": "object",
  "properties": {
    "reportId": {
      "description": "The ID of the report that was requested.",
      "type": "string"
    },
    "recordType": {
      "description": "The record type of the report. It can be campaigns, adGroups, productAds or keywords.",
      "type": "string"
    },
    "status": {
      "description": "The status of the generation of the report, it can be IN_PROGRESS, SUCCESS or FAILURE.",
      "type": "string"
    },
    "statusDetails": {
      "description": "Description of the status.",
      "type": "string"
    },
    "location": {
      "description": "The URI from the API service from which a redirect to the report can be found. It's only available if status is SUCCESS.",
      "type": "string"
    },
    "fileSize": {
      "description": "The size of the report file in bytes. It's only available if status is SUCCESS.",
      "type": "number"
    }
  }
}
```

### `Error`

See error object return format as described in Developer notes.

## Report File Format

The report file contains one row per entity for which performance data is present. These records are represented as JSON containing the ID attribute corresponding to the `recordType`, the segment (if specified), and each of the metrics in the request.

For example, a report requested with the following call:

```http
POST /keywords/report
{
  "campaignType": "sponsoredProducts",
  "segment": "query",
  "reportDate": "20180310",
  "metrics": "impressions,clicks"
}
```

Would have a report that looks something like this:

```json
[
  {"keywordId": 123, "query": "red iphone case", "impressions": 584920, "clicks": 2989},
  {"keywordId": 123, "query": "blue iphone 6s case", "impressions": 8348230, "clicks": 16483},
  {"keywordId": 456, "query": "chuck taylor all star", "impressions": 83910, "clicks": 2483},
  {"keywordId": 456, "query": "converse chuck taylor", "impressions": 2349190, "clicks": 1238},
  {"keywordId": 456, "query": "chuck taylor", "impressions": 291827, "clicks": 1289},
  {"keywordId": 789, "query": "rare earth magnets", "impressions": 99375092, "clicks": 912037},
  {"keywordId": 789, "query": "magnets", "impressions": 93894023, "clicks": 238482},
  {"keywordId": 789, "query": "strong magnets", "impressions": 292, "clicks": 1}
]
```

## Downloading Reports

When reports have completed, the `location` field will provide a URI for the download action against the generated report. Note that requests against this URI require authentication, so the authorization header must be passed. The response to these requests will not contain a body and will return a `307` redirect with the `location` header populated with an S3 file location. The resulting file location is short-lived (expires in 30 seconds). If this time elapses before a client is able to begin downloading the file, the client may make another request against the download action URI.

**Note:** The report file in S3 is gzipped.

## Report Metrics

The following tables summarize report metrics which can be requested via the Reports interface. Different report types can use different metrics.

### Campaigns Reports

| **Metric**                     | **Details**                                                                                       |
|--------------------------------|---------------------------------------------------------------------------------------------------|
| `bidPlus`                      | A dimensional metric. See premium bid adjustment in the developer notes.                         |
| `campaignName`                 | Unique name of the campaign.                                                                     |
| `campaignId`                   | Unique numerical ID of the campaign.                                                             |
| `campaignStatus`               | Status of the campaign.                                                                         |
| `campaignBudget`               | Total budget allotted to the campaign.                                                          |
| `impressions`                  | Total ad impressions.                                                                           |
| `clicks`                       | Total ad clicks.                                                                                |
| `cost`                         | Total cost of all clicks. Can be divided by clicks to obtain average CPC.                       |
| `attributedConversions1d`      | Number of attributed conversion events occurring within 1 day of click on ad.                  |
| `attributedConversions7d`      | Number of attributed conversion events occurring within 7 days of click on ad.                  |
| `attributedConversions14d`     | Number of attributed conversion events occurring within 14 days of click on ad.                 |
| `attributedConversions30d`     | Number of attributed conversion events occurring within 30 days of click on ad.                 |
| `attributedConversions1dSameSKU` | Number of attributed conversion events occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions7dSameSKU` | Number of attributed conversion events occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions14dSameSKU` | Number of attributed conversion events occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions30dSameSKU` | Number of attributed conversion events occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedUnitsOrdered1d`     | Number of attributed units ordered within 1 day of click on ad.                                |
| `attributedUnitsOrdered7d`     | Number of attributed units ordered within 7 days of click on ad.                                |
| `attributedUnitsOrdered14d`    | Number of attributed units ordered within 14 days of click on ad.                               |
| `attributedUnitsOrdered30d`    | Number of attributed units ordered within 30 days of click on ad.                               |
| `attributedSales1d`            | Number of attributed sales occurring within 1 day of click on ad.                             |
| `attributedSales7d`            | Number of attributed sales occurring within 7 days of click on ad.                             |
| `attributedSales14d`           | Number of attributed sales occurring within 14 days of click on ad.                            |
| `attributedSales30d`           | Number of attributed sales occurring within 30 days of click on ad.                            |
| `attributedSales1dSameSKU`     | Aggregate value of attributed sales occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales7dSameSKU`     | Aggregate value of attributed sales occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales14dSameSKU`    | Aggregate value of attributed sales occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales30dSameSKU`    | Aggregate value of attributed sales occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |

### Ad Group Reports

| **Metric**                     | **Details**                                                                                       |
|--------------------------------|---------------------------------------------------------------------------------------------------|
| `campaignName`                 | Unique name of the campaign.                                                                     |
| `campaignId`                   | Unique numerical ID of the campaign.                                                             |
| `adGroupName`                  | Unique name of the ad group.                                                                     |
| `adGroupId`                    | Unique numerical ID of the ad group.                                                             |
| `impressions`                  | Total ad impressions.                                                                           |
| `clicks`                       | Total ad clicks.                                                                                |
| `cost`                         | Total cost of all clicks. Can be divided by clicks to obtain average CPC.                       |
| `attributedConversions1d`      | Number of attributed conversion events occurring within 1 day of click on ad.                  |
| `attributedConversions7d`      | Number of attributed conversion events occurring within 7 days of click on ad.                  |
| `attributedConversions14d`     | Number of attributed conversion events occurring within 14 days of click on ad.                 |
| `attributedConversions30d`     | Number of attributed conversion events occurring within 30 days of click on ad.                 |
| `attributedConversions1dSameSKU` | Number of attributed conversion events occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions7dSameSKU` | Number of attributed conversion events occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions14dSameSKU` | Number of attributed conversion events occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions30dSameSKU` | Number of attributed conversion events occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedUnitsOrdered1d`     | Number of attributed units ordered within 1 day of click on ad.                                |
| `attributedUnitsOrdered7d`     | Number of attributed units ordered within 7 days of click on ad.                                |
| `attributedUnitsOrdered14d`    | Number of attributed units ordered within 14 days of click on ad.                               |
| `attributedUnitsOrdered30d`    | Number of attributed units ordered within 30 days of click on ad.                               |
| `attributedSales1d`            | Number of attributed sales occurring within 1 day of click on ad.                             |
| `attributedSales7d`            | Number of attributed sales occurring within 7 days of click on ad.                             |
| `attributedSales14d`           | Number of attributed sales occurring within 14 days of click on ad.                            |
| `attributedSales30d`           | Number of attributed sales occurring within 30 days of click on ad.                            |
| `attributedSales1dSameSKU`     | Aggregate value of attributed sales occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales7dSameSKU`     | Aggregate value of attributed sales occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales14dSameSKU`    | Aggregate value of attributed sales occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales30dSameSKU`    | Aggregate value of attributed sales occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |

### Keyword Reports

| **Metric**                     | **Details**                                                                                       |
|--------------------------------|---------------------------------------------------------------------------------------------------|
| `campaignName`                 | Unique name of the campaign.                                                                     |
| `campaignId`                   | Unique numerical ID of the campaign.                                                             |
| `keywordId`                    | ID of the keyword used in bid.                                                                   |
| `keywordText`                  | Text of the keyword or phrase used in bid.                                                       |
| `matchType`                    | Type of matching for the keyword or phrase used in bid. Must be one of: `broad`, `phrase`, or `exact`. |
| `impressions`                  | Total ad impressions.                                                                           |
| `clicks`                       | Total ad clicks.                                                                                |
| `cost`                         | Total cost of all clicks. Can be divided by clicks to obtain average CPC.                       |
| `attributedConversions1d`      | Number of attributed conversion events occurring within 1 day of click on ad.                  |
| `attributedConversions7d`      | Number of attributed conversion events occurring within 7 days of click on ad.                  |
| `attributedConversions14d`     | Number of attributed conversion events occurring within 14 days of click on ad.                 |
| `attributedConversions30d`     | Number of attributed conversion events occurring within 30 days of click on ad.                 |
| `attributedConversions1dSameSKU` | Number of attributed conversion events occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions7dSameSKU` | Number of attributed conversion events occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions14dSameSKU` | Number of attributed conversion events occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions30dSameSKU` | Number of attributed conversion events occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedUnitsOrdered1d`     | Number of attributed units ordered within 1 day of click on ad.                                |
| `attributedUnitsOrdered7d`     | Number of attributed units ordered within 7 days of click on ad.                                |
| `attributedUnitsOrdered14d`    | Number of attributed units ordered within 14 days of click on ad.                               |
| `attributedUnitsOrdered30d`    | Number of attributed units ordered within 30 days of click on ad.                               |
| `attributedSales1d`            | Number of attributed sales occurring within 1 day of click on ad.                             |
| `attributedSales7d`            | Number of attributed sales occurring within 7 days of click on ad.                             |
| `attributedSales14d`           | Number of attributed sales occurring within 14 days of click on ad.                            |
| `attributedSales30d`           | Number of attributed sales occurring within 30 days of click on ad.                            |
| `attributedSales1dSameSKU`     | Aggregate value of attributed sales occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales7dSameSKU`     | Aggregate value of attributed sales occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales14dSameSKU`    | Aggregate value of attributed sales occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales30dSameSKU`    | Aggregate value of attributed sales occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |

### Product Ads Reports

| **Metric**                     | **Details**                                                                                       |
|--------------------------------|---------------------------------------------------------------------------------------------------|
| `campaignName`                | Unique name of the campaign.                                                                     |
| `campaignId`                  | Unique numerical ID of the campaign.                                                             |
| `adGroupName`                  | Unique name of the ad group.                                                                     |
| `adGroupId`                   | Unique numerical ID of the ad group.                                                             |
| `impressions`                 | Total ad impressions.                                                                           |
| `clicks`                      | Total ad clicks.                                                                                |
| `cost`                        | Total cost of all clicks. Can be divided by clicks to obtain average CPC.                       |
| `currency`                    | A dimensional metric.                                                                            |
| `asin`                        | The ASIN that is being advertised. This is available for both merchants and vendors.            |
| `sku`                         | The SKU that is being advertised. Not available for vendors.                                    |
| `attributedConversions1d`     | Number of attributed conversion events occurring within 1 day of click on ad.                  |
| `attributedConversions7d`     | Number of attributed conversion events occurring within 7 days of click on ad.                  |
| `attributedConversions14d`    | Number of attributed conversion events occurring within 14 days of click on ad.                 |
| `attributedConversions30d`    | Number of attributed conversion events occurring within 30 days of click on ad.                 |
| `attributedConversions1dSameSKU` | Number of attributed conversion events occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions7dSameSKU` | Number of attributed conversion events occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions14dSameSKU` | Number of attributed conversion events occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions30dSameSKU` | Number of attributed conversion events occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedUnitsOrdered1d`    | Number of attributed units ordered within 1 day of click on ad.                                |
| `attributedUnitsOrdered7d`    | Number of attributed units ordered within 7 days of click on ad.                                |
| `attributedUnitsOrdered14d`   | Number of attributed units ordered within 14 days of click on ad.                               |
| `attributedUnitsOrdered30d`   | Number of attributed units ordered within 30 days of click on ad.                               |
| `attributedSales1d`           | Number of attributed sales occurring within 1 day of click on ad.                             |
| `attributedSales7d`           | Number of attributed sales occurring within 7 days of click on ad.                             |
| `attributedSales14d`          | Number of attributed sales occurring within 14 days of click on ad.                            |
| `attributedSales30d`          | Number of attributed sales occurring within 30 days of click on ad.                            |
| `attributedSales1dSameSKU`    | Aggregate value of attributed sales occurring within 1 day of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales7dSameSKU`    | Aggregate value of attributed sales occurring within 7 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales14dSameSKU`   | Aggregate value of attributed sales occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedSales30dSameSKU`   | Aggregate value of attributed sales occurring within 30 days of click on ad where the purchased SKU was the same as the one advertised. |

### ASINs Report

| **Metric**                     | **Details**                                                                                       |
|--------------------------------|---------------------------------------------------------------------------------------------------|
| `campaignName`                | Unique name of the campaign.                                                                     |
| `campaignId`                  | Unique numerical ID of the campaign.                                                             |
| `adGroupName`                  | Unique name of the ad group.                                                                     |
| `adGroupId`                   | Unique numerical ID of the ad group.                                                             |
| `keywordId`                   | Unique numerical ID of the keyword.                                                             |
| `keywordText`                 | Keyword or phrase used in bid.                                                                   |
| `asin`                        | The ASIN that is being advertised.                                                              |
| `otherAsin`                   | A non-dimensional metric for ASINs other than the one advertised.                                |
| `sku`                         | Unique SKU advertised.                                                                          |
| `currency`                    | A dimensional metric.                                                                            |
| `matchType`                   | One of: `broad`, `phrase`, or `exact`.                                                          |
| `attributedUnitsOrdered1dOtherSKU` | Number of other ASIN (SKU) units sold. 1 day.                                                 |
| `attributedUnitsOrdered7dOtherSKU` | Number of other ASIN (SKU) units sold. 7 days.                                                 |
| `attributedUnitsOrdered14dOtherSKU` | Number of other ASIN (SKU) units sold. 14 days.                                                |
| `attributedUnitsOrdered30dOtherSKU` | Number of other ASIN (SKU) units sold. 30 days.                                                 |
| `attributedSales1dOtherSKU`   | Sales for another ASIN (SKU). 1 day.                                                           |
| `attributedSales7dOtherSKU`   | Sales for another ASIN (SKU). 7 days.                                                          |
| `attributedSales14dOtherSKU`  | Sales for another ASIN (SKU). 14 days.                                                          |
| `attributedSales30dOtherSKU`  | Sales for another ASIN (SKU). 30 days.                                                          |

## Sponsored Brands Reporting

Sponsored Brands (SB) (formerly known as Headline Search Ads) are a type of ad product with different characteristics and page placement options from those of Sponsored Products. The Sponsored Brands reporting feature is designed to deliver reporting information only for SB campaigns via the API. To create or modify SB ads and campaigns, continue to use the web interface. The object that differentiates between Sponsored Products and Sponsored Brands is the `campaignType` object.

### Reporting Endpoints

Sponsored Brands reporting data is only available from the following endpoints:

- `/v1/campaigns/report`
- `/v1/adGroups/report`
- `/v1/keywords/report`

### Constraints of Sponsored Brands Reporting

- Sponsored Brands reporting data cannot be combined with Sponsored Products data into one report. Use `headlineSearch` for the `campaignType` to retrieve reporting data for SB campaigns.
- Only 14-day data is available for SB. Attribution windows of 1, 7, and 30-day intervals are not available.
- For Sponsored Brands, query segmentation or search-term reporting is not supported.

**Note:** Mock data is used in the sandbox test environment provided, and additional report intervals besides 14-day may be available in the sandbox only. Production environment enforces that only 14-day sales reporting data is available.

### New Reporting Fields with Sponsored Brands

Reporting for SB adds the following fields:

| **Report Type** | **New Fields**                                                                                     |
|-----------------|-----------------------------------------------------------------------------------------------------|
| Campaign        | `campaignType`, `campaignBudget`, `campaignBudgetType`, and `campaignStatus`                      |
| Ad Groups       | `campaignId`, `campaignName`, `campaignType`, `campaignBudget`, `campaignBudgetType`, `campaignStatus`, `adGroupName`, `adGroupId` |
| Keyword         | `campaignId`, `campaignName`, `adGroupId`, `adGroupName`, `campaignBudgetType`, `campaignStatus`, `keywordText`, and `matchType` |

Sponsored Brands entities are not included in the snapshot report. To obtain reporting on your SB campaigns, use the SB report metrics listed in the next section. These metrics can be used to request reports of type: `headlineSearch`.

**Note:** Certain metrics, if included in your report request, will return data for all SB campaigns including those without impressions or clicks.

### Sponsored Brands Report Metrics

| **Metric**                     | **Details**                                                                                       |
|--------------------------------|---------------------------------------------------------------------------------------------------|
| `campaignName`                 | Advertiser created campaign name.                                                                 |
| `campaignId`                  | Unique campaign ID.                                                                               |
| `campaignType`                 | One of: `headlineSearch` or `sponsoredProducts`.                                                  |
| `campaignStatus`               | Campaign’s current status.                                                                       |
| `campaignBudget`               | The campaign budget.                                                                              |
| `campaignBudgetType`           | One of: `daily` or `lifetime`.                                                                   |
| `adGroupName`                  | Unique AdGroup name.                                                                              |
| `adGroupId`                    | Unique AdGroup ID.                                                                                |
| `keywordText`                 | Keyword or phrase used in bid.                                                                    |
| `matchType`                   | One of: `broad`, `phrase`, or `exact`.                                                            |
| `impressions`                 | Total ad impressions.                                                                           |
| `clicks`                      | Total ad clicks.                                                                                |
| `cost`                        | Total cost of all clicks. Can be divided by clicks to obtain average CPC.                       |
| `attributedSales14d`          | Number of attributed sales occurring within 14 days of click on an ad.                         |
| `attributedSales14dSameSKU`   | Aggregate value of attributed sales occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |
| `attributedConversions14d`     | Number of attributed conversion events occurring within 14 days of click on ad.               |
| `attributedConversions14dSameSKU` | Number of attributed conversion events occurring within 14 days of click on ad where the purchased SKU was the same as the one advertised. |

---

Reference: https://advertising.amazon.com/API/docs/en-us/reference/1/reports