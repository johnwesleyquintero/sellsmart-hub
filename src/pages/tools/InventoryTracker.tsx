
import React, { useState } from 'react';
import { Package, AlertTriangle, Plus, Trash2, Save, Check, Settings } from 'lucide-react';
import ToolLayout from '@/components/ToolLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minThreshold: number;
  maxStock: number;
}

const InventoryTracker = () => {
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: '1',
      name: 'Wireless Headphones',
      sku: 'WH-001',
      currentStock: 15,
      minThreshold: 10,
      maxStock: 100
    },
    {
      id: '2',
      name: 'Phone Charger',
      sku: 'PC-002',
      currentStock: 8,
      minThreshold: 15,
      maxStock: 150
    },
    {
      id: '3',
      name: 'Smart Watch',
      sku: 'SW-003',
      currentStock: 28,
      minThreshold: 20,
      maxStock: 80
    }
  ]);
  
  const [newItem, setNewItem] = useState<Omit<InventoryItem, 'id'>>({
    name: '',
    sku: '',
    currentStock: 0,
    minThreshold: 0,
    maxStock: 0
  });
  
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const { toast } = useToast();
  
  const handleAddNewItem = () => {
    if (!newItem.name || !newItem.sku) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    const newItemWithId: InventoryItem = {
      ...newItem,
      id: Date.now().toString()
    };
    
    setItems([...items, newItemWithId]);
    setNewItem({
      name: '',
      sku: '',
      currentStock: 0,
      minThreshold: 0,
      maxStock: 0
    });
    setShowNewItemForm(false);
    
    toast({
      title: "Success",
      description: `${newItem.name} has been added to your inventory`,
    });
  };
  
  const handleRemoveItem = (id: string) => {
    const itemToRemove = items.find(item => item.id === id);
    setItems(items.filter(item => item.id !== id));
    
    toast({
      title: "Item Removed",
      description: `${itemToRemove?.name} has been removed from your inventory`,
    });
  };
  
  const getStockLevel = (item: InventoryItem) => {
    const percentage = (item.currentStock / item.maxStock) * 100;
    
    if (item.currentStock <= item.minThreshold) {
      return { color: "bg-red-500", text: "Low Stock", percentage };
    } else if (percentage >= 80) {
      return { color: "bg-green-500", text: "Good Stock", percentage };
    } else {
      return { color: "bg-amber-500", text: "Medium Stock", percentage };
    }
  };
  
  return (
    <ToolLayout 
      title="Inventory Tracker" 
      icon={<Package className="h-6 w-6" />}
      description="Track inventory levels and receive alerts for low stock and restocking needs."
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Inventory</h2>
          <Button 
            onClick={() => setShowNewItemForm(!showNewItemForm)}
            className="bg-sellsmart-teal hover:bg-sellsmart-teal/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
        
        {showNewItemForm && (
          <Card className="overflow-hidden border-sellsmart-teal/20">
            <CardContent className="p-4">
              <h3 className="font-medium mb-4">Add New Inventory Item</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Product Name*
                  </label>
                  <Input
                    id="name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    placeholder="e.g. Wireless Headphones"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="sku" className="text-sm font-medium">
                    SKU*
                  </label>
                  <Input
                    id="sku"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({...newItem, sku: e.target.value})}
                    placeholder="e.g. WH-001"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="currentStock" className="text-sm font-medium">
                    Current Stock
                  </label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={newItem.currentStock}
                    onChange={(e) => setNewItem({...newItem, currentStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="minThreshold" className="text-sm font-medium">
                    Min Threshold
                  </label>
                  <Input
                    id="minThreshold"
                    type="number"
                    value={newItem.minThreshold}
                    onChange={(e) => setNewItem({...newItem, minThreshold: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="maxStock" className="text-sm font-medium">
                    Max Stock
                  </label>
                  <Input
                    id="maxStock"
                    type="number"
                    value={newItem.maxStock}
                    onChange={(e) => setNewItem({...newItem, maxStock: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleAddNewItem}
                    className="w-full"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Save Item
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item) => {
              const stockLevel = getStockLevel(item);
              
              return (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            {item.currentStock <= item.minThreshold && (
                              <AlertTriangle className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span>
                              <span className="font-medium">{item.currentStock}</span> units in stock
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            item.currentStock <= item.minThreshold 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {stockLevel.text}
                          </span>
                        </div>
                        
                        <Progress value={stockLevel.percentage} className={stockLevel.color} />
                        
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Min: {item.minThreshold}</span>
                          <span>Max: {item.maxStock}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No inventory items</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding products to your inventory tracker
            </p>
            <Button onClick={() => setShowNewItemForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Item
            </Button>
          </div>
        )}
        
        {items.some(item => item.currentStock <= item.minThreshold) && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Low Stock Alert</h3>
                  <p className="text-sm text-red-700">
                    {items.filter(item => item.currentStock <= item.minThreshold).length} items are below their minimum threshold and need to be restocked soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="bg-muted p-4 rounded-lg mt-6">
          <h3 className="flex items-center text-sm font-medium">
            <Settings className="h-4 w-4 mr-2 text-sellsmart-teal" />
            Pro Features
          </h3>
          <p className="text-sm text-muted-foreground">
            Upgrade to Pro for automated stock alerts, Amazon inventory sync, forecasting tools, and more.
          </p>
        </div>
      </div>
    </ToolLayout>
  );
};

export default InventoryTracker;
