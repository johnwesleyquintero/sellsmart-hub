"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Calculator,
  CheckSquare,
  DollarSign,
  FileText,
  Filter,
  Search,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BuildReportApp } from "./tools/build-report";
import AcosCalculator from "./tools/acos-calculator";
import DescriptionEditor from "./tools/description-editor";
import FbaCalculator from "./tools/fba-calculator";
import KeywordAnalyzer from "./tools/keyword-analyzer";
import KeywordDeduplicator from "./tools/keyword-deduplicator";
import LighthouseAudit from "./tools/lighthouse-audit";
import ListingQualityChecker from "./tools/listing-quality-checker";
import PpcCampaignAuditor from "./tools/ppc-campaign-auditor";
import SalesEstimator from "./tools/sales-estimator";

const amazonTools = [
  {
    id: "fba-calculator",
    title: "FBA Calculator",
    description:
      "Calculate the profitability of selling products on Amazon using Fulfillment by Amazon (FBA).",
    icon: <Calculator className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.0.0",
    component: FbaCalculator,
  },
  {
    id: "keyword-analyzer",
    title: "Keyword Analyzer",
    description:
      "Identify high-volume, relevant keywords for Amazon product listings.",
    icon: <Search className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.1.0",
    component: KeywordAnalyzer,
  },
  {
    id: "listing-quality-checker",
    title: "Listing Quality Checker",
    description:
      "Analyze Amazon product listings for completeness and SEO best practices.",
    icon: <CheckSquare className="h-5 w-5 text-primary" />,
    status: "Beta",
    version: "0.9.0",
    component: ListingQualityChecker,
  },
  {
    id: "ppc-campaign-auditor",
    title: "PPC Campaign Auditor",
    description:
      "Audit Amazon PPC campaigns to identify areas for improvement.",
    icon: <BarChart className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.2.0",
    component: PpcCampaignAuditor,
  },
  {
    id: "description-editor",
    title: "Description Editor",
    description:
      "Create and optimize Amazon product descriptions with a rich text editor.",
    icon: <FileText className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.0.1",
    component: DescriptionEditor,
  },
  {
    id: "keyword-deduplicator",
    title: "Keyword Deduplicator",
    description:
      "Identify and remove duplicate keywords from Amazon product listings.",
    icon: <Filter className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.0.0",
    component: KeywordDeduplicator,
  },
  {
    id: "acos-calculator",
    title: "ACoS Calculator",
    description:
      "Calculate the Advertising Cost of Sales (ACoS) for Amazon PPC campaigns.",
    icon: <DollarSign className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.0.0",
    component: AcosCalculator,
  },
  {
    id: "sales-estimator",
    title: "Sales Estimator",
    description:
      "Estimate potential sales for Amazon products based on category and competition.",
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    status: "Beta",
    version: "0.8.0",
    component: SalesEstimator,
  },
];

const devTools = [
  {
    id: "build-report",
    title: "Build Report",
    description: "Parse and format build reports into markdown.",
    icon: <FileText className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.0.0",
    component: BuildReportApp,
  },
  {
    id: "lighthouse-audit",
    title: "Lighthouse Audit",
    description:
      "Audit web pages for performance, accessibility, and SEO using Lighthouse.",
    icon: <TrendingUp className="h-5 w-5 text-primary" />,
    status: "Active",
    version: "1.0.0",
    component: LighthouseAudit,
  },
];

export default function FeaturedToolsSection() {
  const [activeTab, setActiveTab] = useState("fba-calculator");
  const [activeToolCategory, setActiveToolCategory] = useState("amazon");
  const tools = activeToolCategory === "amazon" ? amazonTools : devTools;
  const activeTool = tools.find((tool) => tool.id === activeTab);

  return (
    <section id="tools" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-purple-100/50 dark:from-blue-950/50 dark:to-purple-950/50 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <Badge variant="secondary" className="mb-4">
            Powered by
            <Link
              href="https://sellsmart-hub.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              SellSmart
            </Link>
          </Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            My Tools Suite
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            My collection of tools I've developed to help Amazon sellers
            optimize their listings, analyze performance, and increase sales and
            additional utility tools for development and general use for free.
          </p>
        </div>

        <div className="mb-8 flex justify-center gap-4">
          <Button
            variant={activeToolCategory === "amazon" ? "default" : "outline"}
            onClick={() => setActiveToolCategory("amazon")}
          >
            Amazon Tools
          </Button>
          <Button
            variant={activeToolCategory === "dev" ? "default" : "outline"}
            onClick={() => setActiveToolCategory("dev")}
          >
            Dev Tools
          </Button>
        </div>

        <Tabs
          defaultValue="fba-calculator"
          className="mb-12"
          onValueChange={setActiveTab}
        >
          <div className="flex justify-center mb-8">
            <TabsList
              className={`grid ${activeToolCategory === "amazon" ? "grid-cols-4 md:grid-cols-8" : "grid-cols-2"}`}
            >
              {tools.map((tool) => (
                <TabsTrigger
                  key={tool.id}
                  value={tool.id}
                  className="flex flex-col items-center gap-1 p-3"
                >
                  {tool.icon}
                  <span className="text-xs hidden md:inline">{tool.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {activeTool?.icon}
                    {activeTool?.title}
                  </CardTitle>
                  <CardDescription>{activeTool?.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      activeTool?.status === "Active" ? "default" : "secondary"
                    }
                  >
                    {activeTool?.status}
                  </Badge>
                  <Badge variant="outline">v{activeTool?.version}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tools.map((tool) => (
                <TabsContent key={tool.id} value={tool.id} className="mt-0">
                  <tool.component />
                </TabsContent>
              ))}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </section>
  );
}
