import { SelectWithSearch } from "@/components/ui/select-with-search";
import { useModelos } from "@/hooks/useModelos";
import { forwardRef, useImperativeHandle } from "react";

interface ModeloSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export interface ModeloSelectRef {
  refresh: () => void;
}

export const ModeloSelect = forwardRef<ModeloSelectRef, ModeloSelectProps>(
  ({ value, onValueChange }, ref) => {
    const { modelos, loading, error, refresh } = useModelos();

    useImperativeHandle(ref, () => ({
      refresh
    }));

    // Convert to SelectWithSearch format
    const options = modelos.map(modelo => ({
      l: modelo.codigo,
      d: modelo.descricao
    }));

    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">Modelo</label>
        <SelectWithSearch
          options={options}
          value={value}
          onValueChange={onValueChange}
          placeholder="Todos os modelos"
          searchPlaceholder="Pesquisar modelo..."
          emptyMessage="Nenhum modelo encontrado"
          loading={loading}
          error={error}
          className="w-full"
        />
      </div>
    );
  }
);

ModeloSelect.displayName = "ModeloSelect";