const fs = require('fs');
const path = require('path');
const { exitWithError } = require('./error-handler');

const COMPONENT_TEMPLATE = `import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  children?: React.ReactNode;
};

export function {{componentName}}({
  className,
  children,
}: Props) {
  return (
    <div className={cn(`base-styles-here ${className}`)}>
      {children}
    </div>
  );
}

export function {{componentName}}Test() {
  return (
    <{{componentName}}>
      Test Content
    </{{componentName}}>
  );
}
`;

async function generateComponent() {
  try {
    const [componentName] = process.argv.slice(2);
    
    if (!componentName) {
      exitWithError('Component name required');
    }

    const componentsDir = path.join(__dirname, '../components/ui');
    const componentPath = path.join(componentsDir, `${componentName}.tsx`);

    if (fs.existsSync(componentPath)) {
      exitWithError('Component already exists');
    }

    const content = COMPONENT_TEMPLATE
      .replace(/\{\{componentName\}\}/g, componentName);

    fs.writeFileSync(componentPath, content);
    console.log(`Successfully created ${componentName} at ${componentPath}`);
    
  } catch (error) {
    exitWithError('Component generation failed', error);
  }
}

generateComponent();