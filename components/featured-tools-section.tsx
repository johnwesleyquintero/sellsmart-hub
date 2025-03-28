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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAnalytics } from "@/lib/hooks/use-analytics";
import { motion } from "framer-motion";
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
import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import AcosCalculator from "./tools/acos-calculator";
import { BuildReportApp } from "./tools/build-report";
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
  const { trackEvent } = useAnalytics();

  const handleToolChange = (toolId: string) => {
    setActiveTab(toolId);
    trackEvent("tool_selected", { toolId });
  };

  const [isToolLoading, setIsToolLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsToolLoading(false), 1000);
  }, [activeTab]);

  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <section id="tools" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-purple-100/30 to-pink-100/50 dark:from-blue-950/50 dark:via-purple-950/30 dark:to-pink-950/50 blur-3xl"></div>
      </div>

      <motion.div
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="mx-auto max-w-5xl"
      >
        <div className="mb-12 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4">
              <span className="mr-2">⚡</span>
              Powered by{" "}
              <Link
                href="https://sellsmart-hub.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 font-medium hover:underline"
              >
                SellSmart
              </Link>
            </Badge>
            <h2 className="mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
              Amazon Seller Tools Suite
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Optimize your Amazon business with our comprehensive suite of
              tools designed to enhance listings, analyze performance, and boost
              sales.
            </p>
          </motion.div>
        </div>

        <div className="mb-8 flex justify-center gap-4">
          <TooltipProvider>
            {["amazon", "dev"].map((category) => (
              <Tooltip key={category}>
                <TooltipTrigger asChild>
                  <Button
                    variant={
                      activeToolCategory === category ? "default" : "outline"
                    }
                    onClick={() => setActiveToolCategory(category)}
                    className="relative overflow-hidden"
                  >
                    <span className="relative z-10">
                      {category === "amazon" ? "Amazon Tools" : "Dev Tools"}
                    </span>
                    {activeToolCategory === category && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute inset-0 bg-primary opacity-10"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {category === "amazon"
                      ? "Amazon seller optimization tools"
                      : "Development utilities"}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        <Tabs
          defaultValue="fba-calculator"
          className="mb-12"
          onValueChange={handleToolChange}
        >
          <div className="flex justify-center mb-8">
            <TabsList className="grid grid-cols-4 md:grid-cols-8">
              {tools.map((tool) => (
                <TooltipProvider key={tool.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TabsTrigger
                        value={tool.id}
                        className="flex flex-col items-center gap-1 p-3 relative"
                      >
                        {tool.icon}
                        <span className="text-xs hidden md:inline">
                          {tool.title}
                        </span>
                        {tool.status === "Beta" && (
                          <Badge
                            variant="secondary"
                            className="absolute -top-1 -right-1 text-[10px] px-1"
                          >
                            BETA
                          </Badge>
                        )}
                      </TabsTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{tool.description}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
                  <Badge variant="outline" className="font-mono">
                    {activeTool?.version}
                  </Badge>
                  <Badge
                    variant={
                      activeTool?.status === "Beta" ? "secondary" : "default"
                    }
                    className="animate-pulse"
                  >
                    {activeTool?.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isToolLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </div>
                </div>
              ) : (
                tools.map((tool) => (
                  <TabsContent key={tool.id} value={tool.id} className="mt-0">
                    <tool.component />
                  </TabsContent>
                ))
              )}
            </CardContent>
          </Card>
        </Tabs>
      </motion.div>
    </section>
  );
}
