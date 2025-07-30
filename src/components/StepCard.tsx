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
  onSendMessage: (templateId?: string) => void;
}

const StepCard = ({
  step,
  isCompleted,
  isCurrent,
  isAccessible,
  data,
  onComplete,
  onSendMessage,
}: StepCardProps) => {
  const [localData, setLocalData] = useState(data || {});
  const [isExpanded, setIsExpanded] = useState(isCurrent);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    setIsExpanded(isCurrent);
  }, [isCurrent]);

  useEffect(() => {
    if (isAccessible && !isCompleted) {
      fetchTemplates();
    }
  }, [step.number, isAccessible, isCompleted]);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .eq('step_number', step.number)
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
      
      // Auto-selecionar o primeiro template se houver apenas um
      if (data && data.length === 1) {
        setSelectedTemplate(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    }
  };

  const handleSave = () => {
    onComplete(localData);
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
          
          {/* Seletor de templates e envio de mensagem */}
          {!isCompleted && templates.length > 0 && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <h4 className="text-sm font-medium text-foreground">Template de Mensagem</h4>
              <div className="space-y-3">
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um template para enviar" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedTemplate && (
                  <div className="p-3 bg-background border rounded text-sm">
                    <p className="text-muted-foreground mb-2">Preview:</p>
                    <p className="text-foreground">
                      {templates.find(t => t.id === selectedTemplate)?.message_content}
                    </p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => onSendMessage(selectedTemplate)}
                  disabled={!selectedTemplate}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Mensagem
                </Button>
              </div>
            </div>
          )}

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