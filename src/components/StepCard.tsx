import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CheckCircle2, Circle, Send, Clock } from "lucide-react";

interface StepConfig {
  number: number;
  title: string;
  description: string;
  type: "checkbox" | "action" | "input" | "inputs" | "review";
  options?: string[];
  actionText?: string;
  inputLabel?: string;
  inputLabels?: string[];
}

interface MessageTemplate {
  id: string;
  step_number: number;
  template_name: string;
  message_content: string;
}

interface StepCardProps {
  step: StepConfig;
  isCompleted: boolean;
  isCurrent: boolean;
  isAccessible: boolean;
  data: any;
  onComplete: (data: any) => void;
  onSendMessage: (templateId?: string, stepData?: any) => void;
  clientId: string;
}

const StepCard = ({
  step,
  isCompleted,
  isCurrent,
  isAccessible,
  data,
  onComplete,
  onSendMessage,
  clientId,
}: StepCardProps) => {
  const [localData, setLocalData] = useState(data || {});
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [manualData, setManualData] = useState(data?.manual_info || "");
  const [paymentLink, setPaymentLink] = useState(data?.payment_link || "");
  // Estados para etapa 4 - Toggles e status separados
  const [waitingCreatives, setWaitingCreatives] = useState(data?.waiting_creatives || false);
  const [waitingCaptions, setWaitingCaptions] = useState(data?.waiting_captions || false);
  const [creativesStatus, setCreativesStatus] = useState(data?.creatives_status || 'pending');
  const [captionsStatus, setCaptionsStatus] = useState(data?.captions_status || 'pending');
  const [creativesInfo, setCreativesInfo] = useState(data?.creatives_info || '');
  const [adsContent, setAdsContent] = useState(data?.ads_content || '');

  useEffect(() => {
    setIsExpanded(isCurrent);
  }, [isCurrent]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Autosave para etapa 4 quando toggles mudam
  useEffect(() => {
    if (step.number === 4 && (data?.waiting_creatives !== undefined || data?.waiting_captions !== undefined)) {
      handleAutoSave();
    }
  }, [waitingCreatives, waitingCaptions, creativesStatus, captionsStatus]);

  const handleAutoSave = async () => {
    if (step.number !== 4) return;
    
    // Determinar o status baseado nos toggles e seleções
    let combinedStatus = null;
    
    if (waitingCreatives || waitingCaptions) {
      // Priorizar o status mais "atrasado"
      if ((waitingCreatives && creativesStatus === 'pending') || 
          (waitingCaptions && captionsStatus === 'pending')) {
        combinedStatus = 'pending';
      } else if ((waitingCreatives && creativesStatus === 'received') || 
                 (waitingCaptions && captionsStatus === 'received')) {
        combinedStatus = 'received';
      } else if ((waitingCreatives && creativesStatus === 'approved') && 
                 (waitingCaptions && captionsStatus === 'approved')) {
        combinedStatus = 'approved';
      } else if ((waitingCreatives && creativesStatus === 'approved' && !waitingCaptions) ||
                 (waitingCaptions && captionsStatus === 'approved' && !waitingCreatives)) {
        combinedStatus = 'approved';
      }
    }
    
    const dataToSave = {
      ...localData,
      manual_info: manualData,
      waiting_creatives: waitingCreatives,
      waiting_captions: waitingCaptions,
      creatives_status: waitingCreatives ? creativesStatus : null,
      captions_status: waitingCaptions ? captionsStatus : null,
      creatives_info: creativesInfo,
      ads_content: adsContent
    };
    
    onComplete(dataToSave);
    
    // Atualizar status individuais na tabela clients
    await supabase
      .from('clients')
      .update({ 
        creatives_status: waitingCreatives ? creativesStatus : null,
        captions_status: waitingCaptions ? captionsStatus : null
      })
      .eq('id', clientId);
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('step_number', { ascending: true })
        .order('template_name', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const handleSave = async () => {
    const dataToSave = {
      ...localData,
      manual_info: manualData,
      ...(step.number === 3 && { payment_link: paymentLink }),
      ...(step.number === 4 && { 
        waiting_creatives: waitingCreatives,
        waiting_captions: waitingCaptions,
        creatives_status: waitingCreatives ? creativesStatus : null,
        captions_status: waitingCaptions ? captionsStatus : null,
        creatives_info: creativesInfo,
        ads_content: adsContent
      })
    };
    
    onComplete(dataToSave);
    
    // Atualizar status na tabela clients quando for etapa 4
    if (step.number === 4) {
      // Determinar o status baseado nos toggles e seleções
      let combinedStatus = null;
      
      if (waitingCreatives || waitingCaptions) {
        // Priorizar o status mais "atrasado"
        if ((waitingCreatives && creativesStatus === 'pending') || 
            (waitingCaptions && captionsStatus === 'pending')) {
          combinedStatus = 'pending';
        } else if ((waitingCreatives && creativesStatus === 'received') || 
                   (waitingCaptions && captionsStatus === 'received')) {
          combinedStatus = 'received';
        } else if ((waitingCreatives && creativesStatus === 'approved') && 
                   (waitingCaptions && captionsStatus === 'approved')) {
          combinedStatus = 'approved';
        } else if ((waitingCreatives && creativesStatus === 'approved' && !waitingCaptions) ||
                   (waitingCaptions && captionsStatus === 'approved' && !waitingCreatives)) {
          combinedStatus = 'approved';
        }
      }
      
      await supabase
        .from('clients')
        .update({ 
          creatives_status: waitingCreatives ? creativesStatus : null,
          captions_status: waitingCaptions ? captionsStatus : null
        })
        .eq('id', clientId);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setLocalData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStepIcon = () => {
    if (isCompleted) {
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    }
    if (isCurrent) {
      return <Clock className="h-5 w-5 text-warning" />;
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />;
  };

  const renderStepContent = () => {
    switch (step.type) {
      case "checkbox":
        if (step.options) {
          return (
            <div className="space-y-4">
              <RadioGroup
                value={localData.selected || ""}
                onValueChange={(value) => handleInputChange("selected", value)}
              >
                {step.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`step-${step.number}`}
                checked={localData.completed || false}
                onCheckedChange={(checked) => handleInputChange("completed", checked)}
              />
              <Label htmlFor={`step-${step.number}`}>
                Etapa concluída
              </Label>
            </div>
          );
        }

      case "action":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Clique no botão para executar a ação desta etapa.
            </p>
            <Button
              variant="secondary"
              onClick={() => handleInputChange("actionExecuted", true)}
            >
              {step.actionText}
            </Button>
            {localData.actionExecuted && (
              <p className="text-sm text-success">✓ Ação executada</p>
            )}
          </div>
        );

      case "input":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor={`input-${step.number}`}>
                {step.inputLabel}
              </Label>
              <Input
                id={`input-${step.number}`}
                value={localData.input || ""}
                onChange={(e) => handleInputChange("input", e.target.value)}
                placeholder={`Digite ${step.inputLabel?.toLowerCase()}`}
              />
            </div>
          </div>
        );

      case "inputs":
        return (
          <div className="space-y-4">
            {step.inputLabels?.map((label, index) => (
              <div key={index}>
                <Label htmlFor={`input-${step.number}-${index}`}>
                  {label}
                </Label>
                <Textarea
                  id={`input-${step.number}-${index}`}
                  value={localData[`input_${index}`] || ""}
                  onChange={(e) => handleInputChange(`input_${index}`, e.target.value)}
                  placeholder={`Digite ${label.toLowerCase()}`}
                  rows={3}
                />
              </div>
            ))}
          </div>
        );

      case "review":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Revise todas as informações e confirme a entrega final do projeto.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`review-${step.number}`}
                checked={localData.reviewed || false}
                onCheckedChange={(checked) => handleInputChange("reviewed", checked)}
              />
              <Label htmlFor={`review-${step.number}`}>
                Confirmo que o projeto foi entregue
              </Label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canComplete = () => {
    switch (step.type) {
      case "checkbox":
        return step.options ? localData.selected : localData.completed;
      case "action":
        return localData.actionExecuted;
      case "input":
        return localData.input?.trim();
      case "inputs":
        return step.inputLabels?.every((_, index) => localData[`input_${index}`]?.trim());
      case "review":
        return localData.reviewed;
      default:
        return false;
    }
  };

  return (
    <Card className={`transition-all ${
      isCurrent ? "ring-2 ring-primary shadow-elevated" : 
      isCompleted ? "border-success/50" : 
      !isAccessible ? "opacity-50" : ""
    }`}>
      <CardHeader
        className="cursor-pointer"
        onClick={() => isAccessible && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStepIcon()}
            <div>
              <CardTitle className="text-lg">
                {step.number}. {step.title}
              </CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && isAccessible && (
        <CardContent className="space-y-6">
          {/* Formulário da etapa */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground">Informações da Etapa</h4>
            {renderStepContent()}
          </div>
          
          {/* Campo específico para etapa 3 - Link de Pagamento */}
          {step.number === 3 && (
            <div className="space-y-2">
              <Label htmlFor={`payment-link-${step.number}`}>Link de Pagamento</Label>
              <Input
                id={`payment-link-${step.number}`}
                type="url"
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
                placeholder="Cole aqui o link de pagamento..."
              />
            </div>
          )}

          {/* Campos específicos para etapa 4 - Criativos com Toggles */}
          {step.number === 4 && (
            <>
              {/* Toggle Criativos */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Aguardando Criativos</Label>
                  <Switch
                    checked={waitingCreatives}
                    onCheckedChange={setWaitingCreatives}
                  />
                </div>
                {waitingCreatives && (
                  <Select value={creativesStatus} onValueChange={setCreativesStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">⏳ Aguardando envio do cliente</SelectItem>
                      <SelectItem value="received">📥 Recebidos - em análise</SelectItem>
                      <SelectItem value="approved">✅ Aprovados - prontos para uso</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Toggle Legendas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Aguardando Legendas/Copys</Label>
                  <Switch
                    checked={waitingCaptions}
                    onCheckedChange={setWaitingCaptions}
                  />
                </div>
                {waitingCaptions && (
                  <Select value={captionsStatus} onValueChange={setCaptionsStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">⏳ Aguardando envio do cliente</SelectItem>
                      <SelectItem value="received">📥 Recebidos - em análise</SelectItem>
                      <SelectItem value="approved">✅ Aprovados - prontos para uso</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Campos de detalhes existentes */}
              <div className="space-y-2">
                <Label>Detalhes dos Criativos</Label>
                <Textarea
                  value={creativesInfo}
                  onChange={(e) => setCreativesInfo(e.target.value)}
                  placeholder="Ex: 3 vídeos de 15s, 5 imagens 1080x1080..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Copys/Legendas dos Anúncios</Label>
                <Textarea
                  value={adsContent}
                  onChange={(e) => setAdsContent(e.target.value)}
                  placeholder="Cole as legendas aprovadas para os anúncios..."
                  rows={4}
                />
              </div>
            </>
          )}
          
          {/* Campo de informações manuais - SEMPRE visível */}
          <div className="space-y-2">
            <Label htmlFor={`manual-${step.number}`}>Informações desta etapa</Label>
            <Textarea
              id={`manual-${step.number}`}
              value={manualData}
              onChange={(e) => setManualData(e.target.value)}
              placeholder="Adicione informações relevantes desta etapa..."
              rows={3}
            />
          </div>
          
          {/* Seletor de templates e envio de mensagem - SEMPRE visível */}
          <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
            <h4 className="text-sm font-medium text-foreground">Template de Mensagem</h4>
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-2">
                <Label>Template de mensagem</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name} {template.step_number && `(Etapa ${template.step_number})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => onSendMessage(selectedTemplate, {
                  ...localData,
                  manual_info: manualData,
                  ...(step.number === 3 && { payment_link: paymentLink }),
                  ...(step.number === 4 && { 
                    waiting_creatives: waitingCreatives,
                    waiting_captions: waitingCaptions,
                    creatives_status: waitingCreatives ? creativesStatus : null,
                    captions_status: waitingCaptions ? captionsStatus : null,
                    creatives_info: creativesInfo,
                    ads_content: adsContent
                  })
                })}
                variant="secondary"
                disabled={!selectedTemplate}
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar Mensagem
              </Button>
            </div>
            
            {selectedTemplate && (
              <div className="p-3 bg-background border rounded text-sm">
                <p className="text-muted-foreground mb-2">Preview:</p>
                <p className="text-foreground">
                  {templates.find(t => t.id === selectedTemplate)?.message_content}
                </p>
              </div>
            )}
          </div>

          {/* Botões de ação */}
          {!isCompleted && (
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={!canComplete()}
                className="bg-primary hover:bg-primary/90"
              >
                Marcar como concluída
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="p-3 bg-success/10 rounded-lg border border-success/20">
              <p className="text-sm text-success font-medium">
                ✓ Etapa concluída em {new Date().toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default StepCard;