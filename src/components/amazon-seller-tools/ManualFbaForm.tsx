import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import type { FbaCalculationInput } from './fba-calculator';

interface ManualFbaFormProps {
  initialValues: FbaCalculationInput;
  onSubmit: (values: FbaCalculationInput) => void;
  onReset: () => void;
}

export default function ManualFbaForm({
  initialValues,
  onSubmit,
  onReset,
}: ManualFbaFormProps) {
  const { toast } = useToast();
  const [values, setValues] = React.useState<FbaCalculationInput>(initialValues);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev: any) => ({
      ...prev,
      [name]: name === 'product' ? value : Number(value)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate inputs
    if (!values.product.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Product name is required',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    if (values.cost < 0 || values.price < 0 || values.fees < 0) {
      toast({
        title: 'Validation Error',
        description: 'All monetary values must be non-negative',
        variant: 'destructive',
      });
      setIsSubmitting(false);
      return;
    }

    onSubmit(values);
    setIsSubmitting(false);
  };

  const handleReset = () => {
    setValues(initialValues);
    onReset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="product">Product Name*</Label>
        <Input
          id="product"
          name="product"
          value={values.product}
          onChange={handleChange}
          placeholder="Enter product name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Product Cost ($)*</Label>
        <Input
          id="cost"
          name="cost"
          type="number"
          value={values.cost}
          onChange={handleChange}
          placeholder="e.g., 10.50"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Selling Price ($)*</Label>
        <Input
          id="price"
          name="price"
          type="number"
          value={values.price}
          onChange={handleChange}
          placeholder="e.g., 29.99"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="fees">Amazon Fees ($)*</Label>
        <Input
          id="fees"
          name="fees"
          type="number"
          value={values.fees}
          onChange={handleChange}
          placeholder="e.g., 5.75"
          min="0"
          step="0.01"
          required
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          Calculate
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
          disabled={isSubmitting}
        >
          Reset
        </Button>
      </div>
    </form>
  );
}