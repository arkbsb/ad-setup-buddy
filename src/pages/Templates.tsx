import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MessageTemplate {
  id: string;
  step_number: number;
  template_name: string;
  message_content: string;
  created_at: string;
  updated_at: string;
}

const Templates = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    step_number: 1,
    template_name: "",
    message_content: "",
  });

  const SETUP_STEPS = [
    { number: 1, title: "Recebimento do convite Meta Ads" },
    { number: 2, title: "Verificar conta de anúncios" },
    { number: 3, title: "Verificar forma de pagamento" },
    { number: 4, title: "Solicitar criativos" },
    { number: 5, title: "Configurar WhatsApp Business" },
    { number: 6, title: "Criar pixel" },
    { number: 7, title: "Criar públicos" },
    { number: 8, title: "Verificar integração Facebook/Instagram" },
    { number: 9, title: "Criar campanhas" },
    { number: 10, title: "Entrega final" },
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("step_number", { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      toast({
        title: "Erro ao carregar templates",
        description: "Não foi possível carregar os templates de mensagem.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.template_name.trim() || !formData.message_content.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e conteúdo do template são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("message_templates")
          .update({
            step_number: formData.step_number,
            template_name: formData.template_name,
            message_content: formData.message_content,
          })
          .eq("id", editingId);

        if (error) throw error;
        setEditingId(null);
      } else {
        const { error } = await supabase
          .from("message_templates")
          .insert({
            step_number: formData.step_number,
            template_name: formData.template_name,
            message_content: formData.message_content,
          });

        if (error) throw error;
        setIsCreating(false);
      }

      setFormData({ step_number: 1, template_name: "", message_content: "" });
      fetchTemplates();
      
      toast({
        title: "Template salvo!",
        description: "Template de mensagem foi salvo com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar template",
        description: "Ocorreu um erro ao salvar o template.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (template: MessageTemplate) => {
    setFormData({
      step_number: template.step_number,
      template_name: template.template_name,
      message_content: template.message_content,
    });
    setEditingId(template.id);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    try {
      const { error } = await supabase
        .from("message_templates")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      fetchTemplates();
      toast({
        title: "Template excluído!",
        description: "Template foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir template",
        description: "Ocorreu um erro ao excluir o template.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ step_number: 1, template_name: "", message_content: "" });
  };

  const getStepTitle = (stepNumber: number) => {
    const step = SETUP_STEPS.find(s => s.number === stepNumber);
    return step ? step.title : `Etapa ${stepNumber}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando templates...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b shadow-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Templates de Mensagens
              </h1>
              <p className="text-muted-foreground">
                Gerencie os templates de mensagens para cada etapa do setup
              </p>
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              disabled={isCreating || !!editingId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Form for creating/editing */}
          {(isCreating || editingId) && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle>
                  {editingId ? "Editar Template" : "Novo Template"}
                </CardTitle>
                <CardDescription>
                  Configure o template de mensagem para envio via webhook
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="step_number">Etapa</Label>
                  <Select
                    value={formData.step_number.toString()}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, step_number: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SETUP_STEPS.map((step) => (
                        <SelectItem key={step.number} value={step.number.toString()}>
                          {step.number}. {step.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="template_name">Nome do Template</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                    placeholder="Ex: Convite Meta Ads - Padrão"
                  />
                </div>

                <div>
                  <Label htmlFor="message_content">Conteúdo da Mensagem</Label>
                  <Textarea
                    id="message_content"
                    value={formData.message_content}
                    onChange={(e) => setFormData(prev => ({ ...prev, message_content: e.target.value }))}
                    placeholder="Digite o conteúdo da mensagem que será enviada..."
                    rows={6}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Templates list */}
          <div className="grid gap-6">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhum template cadastrado ainda.
                  </p>
                </CardContent>
              </Card>
            ) : (
              templates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {template.template_name}
                        </CardTitle>
                        <CardDescription>
                          Etapa {template.step_number}: {getStepTitle(template.step_number)}
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          disabled={isCreating || !!editingId}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(template.id)}
                          disabled={isCreating || !!editingId}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">
                        {template.message_content}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Templates;