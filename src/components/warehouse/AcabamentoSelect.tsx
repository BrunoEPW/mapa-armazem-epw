import { SelectWithSearch } from "@/components/ui/select-with-search";
import { useApiAttributes } from "@/hooks/useApiAttributes";
import { forwardRef, useImperativeHandle } from "react";

interface AcabamentoSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export interface AcabamentoSelectRef {
  refresh: () => void;
}

export const AcabamentoSelect = forwardRef<AcabamentoSelectRef, AcabamentoSelectProps>(
  ({ value, onValueChange }, ref) => {
    const { acabamentos, acabamentosLoading, acabamentosError, refresh } = useApiAttributes();

    useImperativeHandle(ref, () => ({
      refresh
    }));

    // Convert to SelectWithSearch format
    const options = acabamentos.map(cor => ({
      l: cor.l,
      d: cor.d
    }));

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Acabamento</label>
        <SelectWithSearch
          options={options}
          value={value}
          onValueChange={onValueChange}
          placeholder="Todos os acabamentos"
          searchPlaceholder="Pesquisar acabamento..."
          emptyMessage="Nenhum acabamento encontrado"
          loading={acabamentosLoading}
          error={acabamentosError}
          className="w-full"
        />
      </div>
    );
  }
);

AcabamentoSelect.displayName = "AcabamentoSelect";