import { SelectWithSearch } from "@/components/ui/select-with-search";
import { useModelos } from "@/hooks/useModelos";

interface ModeloSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ModeloSelect = ({ value, onValueChange }: ModeloSelectProps) => {
  const { modelos, loading, error } = useModelos();

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
};