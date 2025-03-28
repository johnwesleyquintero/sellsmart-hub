declare module "*.mdx" {
  let MDXComponent: (props: any) => JSX.Element;
  export default MDXComponent;
}

declare module "@mdx-js/react" {
  import { ComponentType, ReactNode } from "react";

  export interface MDXProviderProps {
    children: ReactNode;
    components: Record<string, ComponentType<any>>;
  }

  export class MDXProvider extends React.Component<MDXProviderProps> {}
}
