import { toast } from '@/components/ui/use-toast';

export function useToast() {
  return {
    toast: (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },
    dismiss: toast.dismiss,
  };
}
