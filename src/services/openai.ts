import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface Recipe {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  servings: number;
  ingredients: string;
  instructions: string;
  difficulty: 'Fácil' | 'Médio' | 'Difícil';
  is_gluten_free: boolean;
  is_lactose_free: boolean;
}

export const aiService = {
  // 1. CHEF LÉIA - Chat geral usando Assistant
  async chatWithChefLeia(message: string, threadId?: string) {
    try {
      console.log('🗣️ AIService - Iniciando chat com Chef LéIA:', { message, threadId });
      
      // Por enquanto, usar chat simples até resolver problema com Assistant API
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: "Você é a Chef LéIA, uma assistente especialista em nutrição, dietas e alimentação saudável, especialmente receitas sem glúten e lactose. Seja amigável, útil e focada em culinária saudável." 
          },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      console.log('🗣️ AIService - Resposta OpenAI recebida:', response.choices[0].message.content);

      return {
        threadId: threadId || 'temp-thread-' + Date.now(),
        response: response.choices[0].message.content || ''
      };
    } catch (error) {
      console.error('🗣️ AIService - Erro no chat com Chef LéIA:', error);
      throw error;
    }
  },

  // 2. AJUSTAR PORÇÕES - Prompt específico
  async adjustServings(recipe: Recipe, newServings: number) {
    try {
      const prompt = `Ajuste esta receita de ${recipe.servings} para ${newServings} porções.

RECEITA: ${recipe.title}

INGREDIENTES ORIGINAIS:
${recipe.ingredients}

INSTRUÇÕES:
- Mantenha as proporções corretas
- Retorne apenas a lista de ingredientes ajustada
- Use o mesmo formato da receita original
- Seja preciso nas medidas

INGREDIENTES AJUSTADOS:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Erro ao ajustar porções:', error);
      throw error;
    }
  },

  // 3. SUBSTITUIR INGREDIENTES - Prompt específico  
  async substituteIngredients(recipe: Recipe, ingredientsToReplace: string[], reason?: string) {
    try {
      const reasonText = reason ? `Motivo: ${reason}` : 'Motivo: Preferência pessoal';
      
      const prompt = `Substitua ingredientes nesta receita mantendo o sabor e textura.

RECEITA: ${recipe.title}
${reasonText}

INGREDIENTES ORIGINAIS:
${recipe.ingredients}

INGREDIENTES A SUBSTITUIR:
${ingredientsToReplace.join(', ')}

INSTRUÇÕES:
- Sugira substitutos adequados para cada ingrediente
- Mantenha a receita sem glúten: ${recipe.is_gluten_free ? 'SIM' : 'NÃO'}
- Mantenha a receita sem lactose: ${recipe.is_lactose_free ? 'SIM' : 'NÃO'}
- Explique brevemente cada substituição
- Retorne a lista completa de ingredientes com as substituições

INGREDIENTES SUBSTITUÍDOS:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 1200
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Erro ao substituir ingredientes:', error);
      throw error;
    }
  },

  // 4. CALCULAR NUTRIÇÃO - Prompt específico
  async calculateNutrition(recipe: Recipe) {
    try {
      const prompt = `Calcule os valores nutricionais desta receita por porção.

RECEITA: ${recipe.title}
PORÇÕES: ${recipe.servings}

INGREDIENTES:
${recipe.ingredients}

INSTRUÇÕES:
- Calcule por porção individual
- Seja preciso nos cálculos
- Retorne em formato estruturado

Retorne apenas:
Calorias: X kcal
Proteínas: X g
Carboidratos: X g
Gorduras: X g
Fibras: X g

Breve análise nutricional da receita.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Erro ao calcular nutrição:', error);
      throw error;
    }
  },

  // 5. CONVERTER UNIDADES - Prompt específico
  async convertUnits(recipe: Recipe, fromUnit: string, toUnit: string, amount?: string) {
    try {
      const amountText = amount ? `quantidade específica: ${amount}` : 'todas as medidas relevantes';
      
      const prompt = `Converta as unidades de medida nesta receita.

RECEITA: ${recipe.title}

INGREDIENTES:
${recipe.ingredients}

CONVERSÃO: de ${fromUnit} para ${toUnit}
ITEM: ${amountText}

INSTRUÇÕES:
- Converta apenas as medidas solicitadas
- Mantenha a precisão das conversões
- Use medidas práticas para cozinha
- Retorne a lista completa de ingredientes com as conversões

INGREDIENTES CONVERTIDOS:`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Erro ao converter unidades:', error);
      throw error;
    }
  },

  // 6. CHAT CONTEXTUAL - Pergunta específica sobre a receita
  async askAboutRecipe(recipe: Recipe, question: string) {
    try {
      const prompt = `Você é a Chef LéIA, especialista em receitas sem glúten e lactose. Responda sobre esta receita específica.

RECEITA: ${recipe.title}
DESCRIÇÃO: ${recipe.description}
DIFICULDADE: ${recipe.difficulty}
PORÇÕES: ${recipe.servings}
SEM GLÚTEN: ${recipe.is_gluten_free ? 'Sim' : 'Não'}
SEM LACTOSE: ${recipe.is_lactose_free ? 'Sim' : 'Não'}

INGREDIENTES:
${recipe.ingredients}

MODO DE PREPARO:
${recipe.instructions}

PERGUNTA DO USUÁRIO: ${question}

Responda de forma útil e específica sobre esta receita. Se a pergunta não for relacionada à receita, redirecione gentilmente para questões sobre o preparo, ingredientes ou dicas.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", 
        messages: [
          { 
            role: "system", 
            content: "Você é a Chef LéIA, uma chef especialista em receitas sem glúten e lactose. Seja útil, amigável e focada em culinária saudável." 
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('Erro no chat sobre receita:', error);
      throw error;
    }
  }
};

// Função auxiliar para validar se as chaves estão configuradas
export const validateOpenAIConfig = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const assistantId = import.meta.env.VITE_CHEF_LEIA_ASSISTANT_ID;
  
  if (!apiKey || apiKey === 'sk-xxx...') {
    throw new Error('Chave da API OpenAI não configurada');
  }
  
  if (!assistantId || assistantId === 'asst_xxx...') {
    throw new Error('Assistant ID da Chef LéIA não configurado');
  }
  
  return true;
}; 