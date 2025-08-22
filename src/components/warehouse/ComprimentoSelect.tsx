import { SelectWithSearch } from "@/components/ui/select-with-search";
import { useApiAttributes } from "@/hooks/useApiAttributes";
import { forwardRef, useImperativeHandle } from "react";

interface ComprimentoSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export interface ComprimentoSelectRef {
  refresh: () => void;
}

export const ComprimentoSelect = forwardRef<ComprimentoSelectRef, ComprimentoSelectProps>(
  ({ value, onValueChange }, ref) => {
    const { comprimentos, comprimentosLoading, comprimentosError, refresh } = useApiAttributes();

    useImperativeHandle(ref, () => ({
      refresh
    }));

    // Convert to SelectWithSearch format
    const options = comprimentos.map(comprimento => ({
      l: comprimento.l,
      d: comprimento.d
    }));

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Comprimento</label>
        <SelectWithSearch
          options={options}
          value={value}
          onValueChange={onValueChange}
          placeholder="Todos os comprimentos"
          searchPlaceholder="Pesquisar comprimento..."
          emptyMessage="Nenhum comprimento encontrado"
          loading={comprimentosLoading}
          error={comprimentosError}
          className="w-full"
        />
      </div>
    );
  }
);

ComprimentoSelect.displayName = "ComprimentoSelect";