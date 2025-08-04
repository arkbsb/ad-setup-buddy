import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, LogOut, Users, Clock, CheckCircle, MessageSquare, FileCheck, Search, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import ClientForm from "@/components/ClientForm";
import SetupFlow from "@/components/SetupFlow";
import gitaLogo from "@/assets/gita-logo.svg";

interface Client {
  id: string;
  name: string;
  phone: string;
  current_step: number;
  creatives_status: string;
  captions_status?: string;
  created_at: string;
  is_completed: boolean;
}

const Dashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientForm, setShowClientForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      setClients(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteClient = async (clientId: string) => {
    setDeletingId(clientId);
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: "Cliente excluído com sucesso",
        description: "O cliente foi removido do sistema.",
      });

      fetchClients();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast({
        title: "Erro ao excluir cliente",
        description: "Não foi possível excluir o cliente. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Aguardando</Badge>;
      case "received":
        return <Badge className="bg-blue-600 text-white">Recebidos</Badge>;
      case "approved":
        return <Badge className="bg-success text-success-foreground">Aprovado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "received":
        return <FileCheck className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getProgressPercentage = (currentStep: number) => {
    return Math.min((currentStep - 1) / 10 * 100, 100);
  };

  const getConsolidatedStatus = (creativesStatus: string, captionsStatus?: string) => {
    // Se não tem captions_status, usa apenas o creatives_status
    if (!captionsStatus) return creativesStatus;
    
    // Lógica para status consolidado
    if (creativesStatus === 'approved' && captionsStatus === 'approved') {
      return 'approved';
    }
    if (creativesStatus === 'received' || captionsStatus === 'received') {
      return 'received';
    }
    return 'pending';
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedClient) {
    return (
      <SetupFlow 
        client={selectedClient} 
        onBack={() => setSelectedClient(null)}
        onUpdate={fetchClients}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img 
                src={gitaLogo} 
                alt="Gita Logo" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Setup de Tráfego
                </h1>
                <p className="text-muted-foreground mt-1">
                  Gerencie seus clientes e processos de setup
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/templates">
                <Button variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Templates
                </Button>
              </Link>
              <Button
                onClick={() => setShowClientForm(true)}
                className="bg-primary hover:bg-primary-hover"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => !c.is_completed).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => c.is_completed).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients List */}
        <Card>
          <CardHeader>
            <CardTitle>Clientes</CardTitle>
            <CardDescription>
              Lista de todos os clientes e seu progresso no setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Pesquisar cliente por nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 max-w-sm"
                />
              </div>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando clientes...</p>
              </div>
            ) : clients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Nenhum cliente cadastrado ainda.
                </p>
                <Button onClick={() => setShowClientForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar primeiro cliente
                </Button>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {searchTerm ? 'Nenhum cliente encontrado com esse nome.' : 'Nenhum cliente cadastrado ainda.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                 {filteredClients.map((client) => (
                    <div
                      key={client.id}
                      className="border rounded-lg p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => setSelectedClient(client)}
                        >
                          <h3 className="font-semibold text-lg">{client.name}</h3>
                          <p className="text-muted-foreground">{client.phone}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right space-y-2">
                           {/* Status dos Criativos */}
                           {client.creatives_status && (
                             <div className="flex items-center gap-2 justify-end">
                               <span className="text-xs text-muted-foreground">Criativos:</span>
                               {client.creatives_status === 'pending' && (
                                 <span className="flex items-center gap-1 text-yellow-600 text-sm">
                                   <Clock className="w-3 h-3" />
                                   Aguardando envio
                                 </span>
                               )}
                               {client.creatives_status === 'received' && (
                                 <span className="flex items-center gap-1 text-blue-600 text-sm">
                                   <FileCheck className="w-3 h-3" />
                                   Em análise
                                 </span>
                               )}
                               {client.creatives_status === 'approved' && (
                                 <span className="flex items-center gap-1 text-green-600 text-sm">
                                   <CheckCircle className="w-3 h-3" />
                                   Aprovados
                                 </span>
                               )}
                             </div>
                           )}
                           
                           {/* Status das Legendas */}
                           {client.captions_status && (
                             <div className="flex items-center gap-2 justify-end">
                               <span className="text-xs text-muted-foreground">Legendas:</span>
                               {client.captions_status === 'pending' && (
                                 <span className="flex items-center gap-1 text-yellow-600 text-sm">
                                   <Clock className="w-3 h-3" />
                                   Aguardando envio
                                 </span>
                               )}
                               {client.captions_status === 'received' && (
                                 <span className="flex items-center gap-1 text-blue-600 text-sm">
                                   <FileCheck className="w-3 h-3" />
                                   Em análise
                                 </span>
                               )}
                               {client.captions_status === 'approved' && (
                                 <span className="flex items-center gap-1 text-green-600 text-sm">
                                   <CheckCircle className="w-3 h-3" />
                                   Aprovados
                                 </span>
                               )}
                             </div>
                           )}
                           
                           {/* Se não há nenhum status, mostrar - */}
                           {!client.creatives_status && !client.captions_status && (
                             <span className="text-gray-400 text-sm">-</span>
                           )}
                           
                           <div className="text-sm text-muted-foreground">
                             Etapa {client.current_step}/10
                           </div>
                          </div>
                          
                          {/* Delete Button with Confirmation Dialog */}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingId === client.id}
                              >
                                {deletingId === client.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Tem certeza que deseja excluir 
                                  o cliente <strong>{client.name}</strong>?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      
                      <div 
                        className="space-y-2 cursor-pointer"
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex justify-between text-sm">
                          <span>Progresso</span>
                          <span>{Math.round(getProgressPercentage(client.current_step))}%</span>
                        </div>
                        <Progress 
                          value={getProgressPercentage(client.current_step)} 
                          className="h-2"
                        />
                      </div>
                    </div>
                 ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Client Form Modal */}
      {showClientForm && (
        <ClientForm
          onClose={() => setShowClientForm(false)}
          onSuccess={() => {
            setShowClientForm(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;