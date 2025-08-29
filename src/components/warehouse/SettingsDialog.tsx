import React, { useState } from 'react';
import { Settings, Download, Upload, Mail, Clock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWarehouse } from '@/contexts/WarehouseContext';
import { useToast } from '@/hooks/use-toast';
import { useDataReset } from '@/hooks/useDataReset';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface SettingsDialogProps {
  children: React.ReactNode;
}

interface EmailSettings {
  smtpServer: string;
  smtpPort: string;
  senderEmail: string;
  senderPassword: string;
  recipientEmails: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
}

const SettingsDialog = ({ children }: SettingsDialogProps) => {
  const { materials, products, movements, clearAllData } = useWarehouse();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>(() => {
    const saved = localStorage.getItem('warehouse_email_settings');
    return saved ? JSON.parse(saved) : {
      smtpServer: '',
      smtpPort: '587',
      senderEmail: '',
      senderPassword: '',
      recipientEmails: '',
      frequency: 'weekly',
      enabled: false
    };
  });

  // Manual backup function
  const exportManualBackup = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Materials backup data
      const materialsData = materials.map(material => ({
        'ID Material': material.id,
        'Produto ID': material.productId,
        'Modelo': material.product.modelo,
        'Família': material.product.familia,
        'Acabamento': material.product.acabamento,
        'Cor': material.product.cor,
        'Comprimento (mm)': material.product.comprimento,
        'Código': material.product.codigo || '',
        'Descrição': material.product.descricao || '',
        'Quantidade': material.pecas,
        'Estante': material.location.estante,
        'Prateleira': material.location.prateleira,
        'Posição': material.location.posicao || '',
        'Localização Completa': `${material.location.estante}${material.location.prateleira}${material.location.posicao ? `-${material.location.posicao}` : ''}`,
        'Data Backup': format(new Date(), 'dd/MM/yyyy HH:mm:ss')
      }));

      const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
      XLSX.utils.book_append_sheet(wb, wsMaterials, 'Materiais');

      // Products backup data
      const productsData = products.map(product => ({
        'ID': product.id,
        'Família': product.familia,
        'Modelo': product.modelo,
        'Acabamento': product.acabamento,
        'Cor': product.cor,
        'Comprimento (mm)': product.comprimento,
        'Código': product.codigo || '',
        'Descrição': product.descricao || '',
        'Foto': product.foto || ''
      }));
      
      const wsProducts = XLSX.utils.json_to_sheet(productsData);
      XLSX.utils.book_append_sheet(wb, wsProducts, 'Produtos');

      // Movements backup data
      const movementsData = movements.map(movement => {
        const material = materials.find(m => m.id === movement.materialId);
        return {
          'ID Movimento': movement.id,
          'Material ID': movement.materialId,
          'Modelo Material': material?.product.modelo || 'N/A',
          'Família': material?.product.familia || 'N/A',
          'Localização': material ? `${material.location.estante}${material.location.prateleira}` : 'N/A',
          'Tipo': movement.type === 'entrada' ? 'Entrada' : 'Saída',
          'Quantidade': movement.pecas,
          'NORC': movement.norc,
          'Data': movement.date,
          'Data Formatada': format(new Date(movement.date), 'dd/MM/yyyy')
        };
      });

      const wsMovements = XLSX.utils.json_to_sheet(movementsData);
      XLSX.utils.book_append_sheet(wb, wsMovements, 'Movimentos');

      const filename = `backup_warehouse_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast({
        title: "Backup exportado com sucesso",
        description: `Ficheiro ${filename} transferido com materiais, produtos e movimentos`,
      });
    } catch (error) {
      console.error('Error exporting backup:', error);
      toast({
        title: "Erro ao exportar backup",
        description: "Ocorreu um erro durante a exportação",
        variant: "destructive",
      });
    }
  };

  // Upload backup function
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Check if backup has the expected sheets
        const hasBackupData = workbook.SheetNames.includes('Materiais') || 
                             workbook.SheetNames.includes('Backup Materiais') ||
                             workbook.SheetNames.includes('Produtos') ||
                             workbook.SheetNames.includes('Movimentos');
        
        if (!hasBackupData) {
          toast({
            title: "Formato de ficheiro inválido",
            description: "O ficheiro não contém dados de backup válidos",
            variant: "destructive",
          });
          return;
        }

        // For now, just show success - actual import would need more complex logic
        toast({
          title: "Ficheiro de backup válido",
          description: "O ficheiro foi validado. A funcionalidade de restauro estará disponível em breve.",
        });

      } catch (error) {
        console.error('Error reading backup file:', error);
        toast({
          title: "Erro ao ler ficheiro",
          description: "Não foi possível processar o ficheiro de backup",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    
    // Reset input
    event.target.value = '';
  };

  // Clear mock data function
  const handleClearMockData = async () => {
    try {
      setIsClearing(true);
      console.log('🧹 [handleClearMockData] Starting mock data cleanup...');

      // Clear all localStorage keys that might contain mock data
      const keysToRemove = [
        'warehouse-materials',
        'warehouse-products',
        'warehouse-movements',
        'warehouse-materials-backup',
        'warehouse-products-backup',
        'warehouse-movements-backup',
        'warehouse-backup-metadata',
        'warehouse-migrated',
        'supabase-migration-completed'
      ];

      keysToRemove.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          console.log(`🗑️ [handleClearMockData] Removing ${key}`);
          localStorage.removeItem(key);
        }
      });

      console.log('✅ [handleClearMockData] Mock data cleanup completed');
      toast({
        title: "Dados mock removidos",
        description: "Todos os dados mock foram limpos. A página será recarregada.",
      });
      
      // Reload page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ [handleClearMockData] Error clearing mock data:', error);
      toast({
        title: "Erro ao limpar dados",
        description: "Ocorreu um erro durante a limpeza dos dados mock",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  // Save email settings
  const saveEmailSettings = () => {
    try {
      localStorage.setItem('warehouse_email_settings', JSON.stringify(emailSettings));
      toast({
        title: "Definições guardadas",
        description: "As configurações de email foram guardadas com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao guardar",
        description: "Não foi possível guardar as definições",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Definições do Sistema
          </DialogTitle>
          <DialogDescription>
            Gerir backups, configurações de email e outras definições do sistema
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual-backup" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="manual-backup">Backup Manual</TabsTrigger>
            <TabsTrigger value="upload-backup">Carregar Backup</TabsTrigger>
            <TabsTrigger value="automatic-backup">Backup Automático</TabsTrigger>
            <TabsTrigger value="cleanup">Limpeza</TabsTrigger>
          </TabsList>

          <TabsContent value="manual-backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Exportar Backup Manual
                </CardTitle>
                <CardDescription>
                  Exportar todos os materiais em stock e suas localizações para um ficheiro Excel
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <Label className="font-medium">Dados a incluir:</Label>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Informações completas dos materiais</li>
                      <li>Localizações detalhadas (estante, prateleira)</li>
                      <li>Dados dos produtos associados</li>
                      <li>Histórico completo de movimentos</li>
                      <li>Códigos e descrições</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Estatísticas atuais:</Label>
                    <div className="space-y-1 text-muted-foreground">
                      <div>Materiais: {materials.length}</div>
                      <div>Produtos: {products.length}</div>
                      <div>Movimentos: {movements.length}</div>
                      <div>Total de peças: {materials.reduce((sum, m) => sum + m.pecas, 0)}</div>
                    </div>
                  </div>
                </div>
                <Button onClick={exportManualBackup} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Backup Agora
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload-backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Carregar Backup
                </CardTitle>
                <CardDescription>
                  Importar dados de um ficheiro de backup Excel previamente exportado
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <Label htmlFor="backup-upload" className="text-lg font-medium cursor-pointer">
                      Clique para selecionar um ficheiro de backup
                    </Label>
                    <p className="text-sm text-muted-foreground mt-2">
                      Formatos aceites: .xlsx, .xls
                    </p>
                    <Input
                      id="backup-upload"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-800">Atenção:</p>
                        <p className="text-yellow-700">
                          O carregamento de backup irá substituir todos os dados atuais. 
                          Certifique-se de que fez um backup dos dados atuais antes de prosseguir.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="automatic-backup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configuração de Backup Automático
                </CardTitle>
                <CardDescription>
                  Configurar envio automático de backups por email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp-server">Servidor SMTP</Label>
                    <Input
                      id="smtp-server"
                      placeholder="smtp.gmail.com"
                      value={emailSettings.smtpServer}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpServer: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp-port">Porta SMTP</Label>
                    <Input
                      id="smtp-port"
                      placeholder="587"
                      value={emailSettings.smtpPort}
                      onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-email">Email do remetente</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    placeholder="backup@empresa.com"
                    value={emailSettings.senderEmail}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, senderEmail: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-password">Senha do email</Label>
                  <Input
                    id="sender-password"
                    type="password"
                    placeholder="Senha da aplicação"
                    value={emailSettings.senderPassword}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, senderPassword: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient-emails">Emails de destino</Label>
                  <Input
                    id="recipient-emails"
                    placeholder="admin@empresa.com, backup@empresa.com"
                    value={emailSettings.recipientEmails}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, recipientEmails: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separar múltiplos emails com vírgulas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequência do backup</Label>
                  <Select 
                    value={emailSettings.frequency} 
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                      setEmailSettings(prev => ({ ...prev, frequency: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diariamente</SelectItem>
                      <SelectItem value="weekly">Semanalmente</SelectItem>
                      <SelectItem value="monthly">Mensalmente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-800">Nota:</p>
                      <p className="text-blue-700">
                        Para ativar o backup automático por email, será necessário configurar 
                        uma função Supabase Edge Function. As definições são guardadas localmente 
                        para futura implementação.
                      </p>
                    </div>
                  </div>
                </div>

                <Button onClick={saveEmailSettings} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cleanup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Limpeza de Dados Mock
                </CardTitle>
                <CardDescription>
                  Remover todos os dados mock/teste do localStorage para garantir que apenas produtos da API são utilizados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-orange-800">Atenção:</p>
                      <p className="text-orange-700">
                        Esta ação irá remover todos os materiais e produtos mock/teste do sistema. 
                        Apenas produtos obtidos da API serão mantidos. Esta ação não pode ser desfeita.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-medium">O que será removido:</Label>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
                    <li>Todos os materiais com produtos mock</li>
                    <li>Produtos de teste/exemplo</li>
                    <li>Backups contendo dados mock</li>
                    <li>Cache de dados antigos</li>
                  </ul>
                </div>

                <Button 
                  onClick={handleClearMockData} 
                  variant="destructive" 
                  className="w-full"
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      A limpar dados mock...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Limpar Todos os Dados Mock
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;