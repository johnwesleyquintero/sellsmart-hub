
export function useToast() {
  const { toast, dismiss } = useToastUI;
  return {
    toast: (title: string, description?: string) => {
      toast({
        title,
        description,
      });
    },
    dismiss,
  };
}
