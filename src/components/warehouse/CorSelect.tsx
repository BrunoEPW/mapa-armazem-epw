import { SelectWithSearch } from "@/components/ui/select-with-search";
import { useApiAttributes } from "@/hooks/useApiAttributes";
import { forwardRef, useImperativeHandle } from "react";

interface CorSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export interface CorSelectRef {
  refresh: () => void;
}

export const CorSelect = forwardRef<CorSelectRef, CorSelectProps>(
  ({ value, onValueChange }, ref) => {
    const { cores, coresLoading, coresError, refresh } = useApiAttributes();

    useImperativeHandle(ref, () => ({
      refresh
    }));

    // Convert to SelectWithSearch format
    const options = cores.map(cor => ({
      l: cor.l,
      d: cor.d
    }));

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Cor</label>
        <SelectWithSearch
          options={options}
          value={value}
          onValueChange={onValueChange}
          placeholder="Todas as cores"
          searchPlaceholder="Pesquisar cor..."
          emptyMessage="Nenhuma cor encontrada"
          loading={coresLoading}
          error={coresError}
          className="w-full"
        />
      </div>
    );
  }
);

CorSelect.displayName = "CorSelect";