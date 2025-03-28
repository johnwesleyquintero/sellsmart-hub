declare module "@/components/ui/*" {
  export * from "@/components/ui/types";
}

declare module "@/components/*" {
  const Component: React.FC;
  export default Component;
}
