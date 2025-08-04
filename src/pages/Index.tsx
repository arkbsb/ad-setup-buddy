import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Users, BarChart3, MessageSquare } from "lucide-react";
import heroImage from "@/assets/hero-dashboard.jpg";
import gitaLogo from "@/assets/gita-logo.svg";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <img 
                src={gitaLogo} 
                alt="Gita Logo" 
                className="h-20 w-auto"
              />
            </div>
            <h1 className="text-5xl font-bold text-foreground mb-6">
              Sistema de Controle de 
              <span className="text-primary"> Setup de Tráfego</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Gerencie seus clientes de forma organizada e acompanhe cada etapa do processo 
              de setup de campanhas de tráfego pago com total controle e eficiência.
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                size="lg" 
                onClick={() => navigate("/auth")}
                className="bg-primary hover:bg-primary-hover"
              >
                Começar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="mt-16 max-w-4xl mx-auto">
            <img 
              src={heroImage} 
              alt="Dashboard do sistema de setup de tráfego"
              className="w-full rounded-xl shadow-elevated border"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-muted-foreground text-lg">
              Tudo que você precisa para gerenciar seus clientes de setup
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="text-center shadow-card">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Gestão de Clientes</CardTitle>
                <CardDescription>
                  Cadastre e organize todos os seus clientes em um só lugar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Cadastro completo do cliente</li>
                  <li>• Acompanhamento do progresso</li>
                  <li>• Status dos criativos</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center shadow-card">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fluxo de 10 Etapas</CardTitle>
                <CardDescription>
                  Processo estruturado em 10 etapas bem definidas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Convite Meta Ads</li>
                  <li>• Verificação de conta</li>
                  <li>• Configuração completa</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="text-center shadow-card">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Templates de Mensagens</CardTitle>
                <CardDescription>
                  Envie mensagens automáticas via webhook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Templates personalizáveis</li>
                  <li>• Envio automático</li>
                  <li>• Log de mensagens</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Pronto para organizar seus setups?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Comece a usar o sistema agora mesmo e tenha total controle sobre seus processos.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/auth")}
            className="bg-primary hover:bg-primary-hover"
          >
            Acessar o sistema
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
