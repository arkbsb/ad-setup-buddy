import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle2, Circle, Send } from "lucide-react";
import StepCard from "@/components/StepCard";

interface Client {
  id: string;
  name: string;
  phone: string;
  current_step: number;
  creatives_status: string;
  created_at: string;
  is_completed: boolean;
}

interface SetupProgress {
  id: string;
  step_number: number;
  completed: boolean;
  data: any;
  completed_at: string | null;
}

interface MessageTemplate {
  id: string;
  step_number: number;
  template_name: string;
  message_content: string;
}

interface SetupFlowProps {
  client: Client;
  onBack: () => void;
  onUpdate: () => void;
}

const SETUP_STEPS = [
  {
    number: 1,
    title: "Recebimento do convite Meta Ads",
    description: "Cliente deve aceitar o convite para a conta de anúncios",
    type: "checkbox" as const,
  },
  {
    number: 2,
    title: "Verificar conta de anúncios",
    description: "Confirmar se o cliente possui conta de anúncios ativa",
    type: "checkbox" as const,
    options: ["Possui conta", "Não possui conta"]
  },
  {
    number: 3,
    title: "Verificar forma de pagamento",
    description: "Confirmar método de pagamento configurado",
    type: "action" as const,
    actionText: "Solicitar configuração"
  },
  {
    number: 4,
    title: "Solicitar criativos",
    description: "Aguardar envio dos materiais criativos do cliente",
    type: "action" as const,
    actionText: "Marcar como aguardando cliente"
  },
  {
    number: 5,
    title: "Configurar WhatsApp Business",
    description: "Integração com WhatsApp Business API",
    type: "checkbox" as const,
  },
  {
    number: 6,
    title: "Criar pixel",
    description: "Configurar pixel de conversão",
    type: "input" as const,
    inputLabel: "Código do pixel"
  },
  {
    number: 7,
    title: "Criar públicos",
    description: "Definir públicos quentes e frios",
    type: "inputs" as const,
    inputLabels: ["Públicos quentes", "Públicos frios"]
  },
  {
    number: 8,
    title: "Verificar integração Facebook/Instagram",
    description: "Confirmar conexão entre as contas",
    type: "checkbox" as const,
  },
  {
    number: 9,
    title: "Criar campanhas",
    description: "Configurar as campanhas publicitárias",
    type: "input" as const,
    inputLabel: "Nomes das campanhas"
  },
  {
    number: 10,
    title: "Entrega final",
    description: "Revisão e entrega do projeto completo",
    type: "review" as const,
  },
];

const SetupFlow = ({ client, onBack, onUpdate }: SetupFlowProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progress, setProgress] = useState<SetupProgress[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
    fetchTemplates();
  }, [client.id]);

  const fetchProgress = async () => {
    try {
      const { data, error } = await supabase
        .from("setup_progress")
        .select("*")
        .eq("client_id", client.id)
        .order("step_number");

      if (error) {
        throw error;
      }

      setProgress(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar progresso",
        description: "Não foi possível carregar o progresso do cliente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("step_number");

      if (error) {
        throw error;
      }

      setTemplates(data || []);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    }
  };

  const handleStepComplete = async (stepNumber: number, data: any) => {
    try {
      const existingStep = progress.find(p => p.step_number === stepNumber);
      
      if (existingStep) {
        const { error } = await supabase
          .from("setup_progress")
          .update({
            completed: true,
            data: data,
            completed_at: new Date().toISOString(),
          })
          .eq("id", existingStep.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("setup_progress")
          .insert({
            client_id: client.id,
            step_number: stepNumber,
            completed: true,
            data: data,
            completed_at: new Date().toISOString(),
          });

        if (error) throw error;
      }

      await fetchProgress();
      onUpdate();

      toast({
        title: "Etapa concluída!",
        description: `Etapa ${stepNumber} foi marcada como concluída.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar progresso:", error);
      toast({
        title: "Erro ao salvar progresso",
        description: "Ocorreu um erro ao salvar o progresso da etapa.",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (stepNumber: number, templateId?: string) => {
    try {
      let template;
      
      if (templateId) {
        // Buscar template específico pelo ID
        const { data, error } = await supabase
          .from("message_templates")
          .select("*")
          .eq("id", templateId)
          .single();
          
        if (error) throw error;
        template = data;
      } else {
        // Fallback: buscar qualquer template da etapa
        const { data, error } = await supabase
          .from("message_templates")
          .select("*")
          .eq("step_number", stepNumber)
          .limit(1)
          .single();
          
        if (error) throw error;
        template = data;
      }
      
      if (!template) {
        toast({
          title: "Template não encontrado",
          description: `Não há template configurado para a etapa ${stepNumber}.`,
          variant: "destructive",
        });
        return;
      }

      // Coletar dados das etapas anteriores
      const previousStepsData = progress
        .filter(p => p.step_number < stepNumber && p.completed)
        .reduce((acc, p) => {
          acc[`step_${p.step_number}`] = p.data;
          return acc;
        }, {} as any);

      const webhookData = {
        client: {
          name: client.name,
          phone: client.phone,
        },
        step: stepNumber,
        template: template.message_content,
        data: previousStepsData,
      };

      // Enviar webhook
      const webhookUrl = "https://autowebhook.gita.work/webhook/gita-sistema-setup-mensagens";
      
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      // Log do webhook
      await supabase.from("webhooks_log").insert({
        client_id: client.id,
        step_number: stepNumber,
        webhook_data: webhookData,
        response_status: response.status,
        response_data: response.ok ? await response.text() : null,
      });

      if (response.ok) {
        toast({
          title: "Mensagem enviada!",
          description: `Mensagem da etapa ${stepNumber} foi enviada com sucesso.`,
        });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error("Erro ao enviar webhook:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: "Ocorreu um erro ao enviar a mensagem via webhook.",
        variant: "destructive",
      });
    }
  };

  const getStepProgress = (stepNumber: number) => {
    return progress.find(p => p.step_number === stepNumber);
  };

  const getProgressPercentage = () => {
    const completedSteps = progress.filter(p => p.completed).length;
    return (completedSteps / SETUP_STEPS.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {client.name}
                </h1>
                <p className="text-muted-foreground">{client.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <Badge variant={client.creatives_status === "approved" ? "default" : "secondary"}>
                  Criativos: {client.creatives_status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Etapa {client.current_step}/10
              </div>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="pb-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso geral</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-3" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {SETUP_STEPS.map((step) => {
            const stepProgress = getStepProgress(step.number);
            const isCompleted = stepProgress?.completed || false;
            const isCurrent = step.number === client.current_step;
            const isAccessible = step.number <= client.current_step;

            return (
              <StepCard
                key={step.number}
                step={step}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
                isAccessible={isAccessible}
                data={stepProgress?.data}
                onComplete={(data) => handleStepComplete(step.number, data)}
                onSendMessage={(templateId) => sendMessage(step.number, templateId)}
              />
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default SetupFlow;