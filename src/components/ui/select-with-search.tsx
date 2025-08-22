import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

interface SelectWithSearchProps {
  options: Array<{ l: string; d: string }>;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  loading?: boolean;
  error?: string | null;
}

const SelectWithSearch = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectWithSearchProps
>(({
  options,
  value,
  onValueChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Pesquisar...",
  emptyMessage = "Nenhuma opção encontrada",
  disabled = false,
  className,
  loading = false,
  error = null,
  ...props
}, ref) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter(option =>
      option.d.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.l.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Clear search when closing
  React.useEffect(() => {
    if (!open) {
      setSearchQuery("");
    }
  }, [open]);

  // Get display text for selected value
  const selectedOption = options.find(opt => opt.l === value);
  const displayValue = value === "all" ? placeholder : selectedOption?.d || value;

  return (
    <SelectPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={(value) => {
        console.log('🔍 [SelectWithSearch] Value changed to:', value);
        console.log('🔍 [SelectWithSearch] Available options:', options.slice(0, 3));
        onValueChange(value);
      }}
      disabled={disabled || loading}
    >
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
        {...props}
      >
        <SelectPrimitive.Value>
          {loading ? "Carregando..." : error ? "Erro na API" : displayValue}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "relative z-[10000] max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          )}
          style={{
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            borderColor: 'hsl(var(--border))',
            zIndex: 10000
          }}
          position="popper"
        >
          <div className="flex items-center border-b border-border p-2">
            <Search className="w-4 h-4 text-muted-foreground mr-2" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
          </div>

          <SelectPrimitive.Viewport className="p-1">
            {/* Always show "Todos" option at the top */}
            <SelectPrimitive.Item
              value="all"
              className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
              </span>
              <SelectPrimitive.ItemText>{placeholder}</SelectPrimitive.ItemText>
            </SelectPrimitive.Item>

            {/* Show error message if API failed */}
            {error && (
              <SelectPrimitive.Item
                value="api-error"
                disabled
                className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-muted-foreground"
              >
                <SelectPrimitive.ItemText>
                  ⚠️ API EPW indisponível - usando dados locais
                </SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            )}

            {/* Show filtered options */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <SelectPrimitive.Item
                  key={option.l}
                  value={option.l}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                >
                  <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="h-4 w-4" />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                  <SelectPrimitive.ItemText>{option.d}</SelectPrimitive.ItemText>
                </SelectPrimitive.Item>
              ))
            ) : searchQuery ? (
              <div className="relative flex w-full select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : null}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
});

SelectWithSearch.displayName = "SelectWithSearch";

export { SelectWithSearch };