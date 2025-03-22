
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import KeywordResearch from "./pages/tools/KeywordResearch";
import InventoryTracker from "./pages/tools/InventoryTracker";
import ListingOptimizer from "./pages/tools/ListingOptimizer";
import PPCCampaignAudit from "./pages/tools/PPCCampaignAudit";
import ReviewManagement from "./pages/tools/ReviewManagement";
import SalesAnalytics from "./pages/tools/SalesAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* Tool Routes */}
          <Route path="/tools/keyword-research" element={<KeywordResearch />} />
          <Route path="/tools/inventory-tracker" element={<InventoryTracker />} />
          <Route path="/tools/listing-optimizer" element={<ListingOptimizer />} />
          <Route path="/tools/ppc-audit" element={<PPCCampaignAudit />} />
          <Route path="/tools/review-management" element={<ReviewManagement />} />
          <Route path="/tools/sales-analytics" element={<SalesAnalytics />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
