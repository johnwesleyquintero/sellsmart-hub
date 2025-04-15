export class AmazonAlgorithms {
    static calculateInventoryRecommendation(salesData, leadTime, currentInventory) {
        // Actual implementation should be moved from route.ts
        return Math.max(...salesData) * leadTime - currentInventory;
    }
}
export var ProductCategory;
(function (ProductCategory) {
    ProductCategory["STANDARD"] = "standard";
    ProductCategory["OVERSIZE"] = "oversize";
    ProductCategory["HAZMAT"] = "hazmat";
    ProductCategory["APPAREL"] = "apparel";
})(ProductCategory || (ProductCategory = {}));
export var InventoryHealthStatus;
(function (InventoryHealthStatus) {
    InventoryHealthStatus["HEALTHY"] = "healthy";
    InventoryHealthStatus["LOW"] = "low";
    InventoryHealthStatus["EXCESS"] = "excess";
    InventoryHealthStatus["CRITICAL"] = "critical";
})(InventoryHealthStatus || (InventoryHealthStatus = {}));
