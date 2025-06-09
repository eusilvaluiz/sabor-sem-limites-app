# DeliciasDoBem - PWA & Compartilhamento

## 🚀 Novas Funcionalidades Implementadas

### 1. Sistema de Compartilhamento Inteligente

**Localização**: Ícone de compartilhamento nos cards de receita

**Funcionamento**:
- Clique no ícone Share nos cards de receita
- Abre modal com opções de compartilhamento
- **URL de destino**: Redireciona para `https://deliciadobem.com.br?ref=recipe&id={recipeId}` 
- **Conteúdo compartilhado**:
  ```
  🍰 [Título da Receita]
  ✨ [Descrição]
  🥄 Receita 100% sem glúten e sem lactose
  📱 Descubra mais receitas deliciosas no DeliciasDoBem!
  #SemGluten #SemLactose #ReceitaSaudavel #DeliciasDoBem
  ```

**Redes sociais suportadas**:
- ✅ WhatsApp
- ✅ Facebook  
- ✅ Instagram (copia texto + orientação)
- ✅ Compartilhamento nativo (mobile)

### 2. PWA (Progressive Web App)

**Funcionalidades**:
- ✅ Instalável na tela inicial (Android/iOS/Desktop)
- ✅ Funciona offline (cache de assets críticos)
- ✅ Banner de instalação automático
- ✅ Ícones e splash screens para todos os dispositivos
- ✅ Atalhos diretos (Chef LéIA, Favoritos, Categorias)

**Configuração**:
- **Manifest**: `/public/manifest.json`
- **Service Worker**: `/public/sw.js`
- **Hook personalizado**: `/src/hooks/usePWA.ts`
- **Componente de instalação**: `/src/components/InstallPWA.tsx`

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
```
/src/utils/shareUtils.ts          # Funções de compartilhamento
/src/components/ShareModal.tsx    # Modal de compartilhamento
/src/hooks/usePWA.ts             # Hook para PWA
/src/components/InstallPWA.tsx   # Banner de instalação
/public/manifest.json            # Manifest PWA
/public/sw.js                    # Service Worker
```

### Arquivos Modificados:
```
/src/components/RecipeCard.tsx   # Integração com ShareModal
/src/App.tsx                     # Registro SW + InstallPWA
/index.html                      # Meta tags PWA
```

## 🎯 Configurações Importantes

### 1. URL de Landing Page
**Arquivo**: `/src/utils/shareUtils.ts`
```typescript
const LANDING_PAGE_URL = "https://deliciadobem.com.br"; // ⚠️ ALTERAR PARA SUA URL
```

### 2. Ícones PWA Necessários
**Pasta**: `/public/icons/`
```
icon-16x16.png
icon-32x32.png  
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png
icon-384x384.png
icon-512x512.png
favicon.ico
```

### 3. Screenshots PWA (opcional)
**Pasta**: `/public/screenshots/`
```
desktop.png (1280x720)
mobile.png (375x812)
```

## 🚀 Como Testar

### Compartilhamento:
1. Abra qualquer receita
2. Clique no ícone Share
3. Teste diferentes redes sociais
4. Verifique se o link redireciona corretamente

### PWA:
1. Acesse via HTTPS (obrigatório)
2. Aguarde banner de instalação aparecer
3. Clique em "Instalar"
4. Teste funcionalidade offline
5. Verifique atalhos no menu do app instalado

## 🔧 Próximos Passos

1. **CRÍTICO - Open Graph**: Configurar na sua landing page (`deliciadobem.com.br`):
   ```html
   <!-- Quando URL for: deliciadobem.com.br?ref=recipe&id=123 -->
   <meta property="og:image" content="URL_DA_IMAGEM_DA_RECEITA" />
   <meta property="og:title" content="Título da Receita - DeliciasDoBem" />
   <meta property="og:description" content="Receita deliciosa sem glúten..." />
   <meta property="og:url" content="https://deliciadobem.com.br?ref=recipe&id=123" />
   ```

2. **Gerar ícones PWA**: Use ferramentas como PWA Asset Generator
3. **Configurar URL real**: Alterar `LANDING_PAGE_URL` em `shareUtils.ts`
4. **Screenshots**: Capturar telas do app para app stores
5. **Analytics**: Adicionar tracking para compartilhamentos

### ⚠️ **IMPORTANTE - Preview de Imagens**

Para que as imagens apareçam automaticamente no WhatsApp/Facebook/Twitter:

**SUA LANDING PAGE PRECISA**:
- Detectar o parâmetro `?id=123` na URL
- Buscar dados da receita correspondente
- Retornar as meta tags Open Graph corretas com a imagem da receita

**Exemplo PHP/Node.js**:
```php
$recipeId = $_GET['id'];
$recipe = getRecipeById($recipeId); // Sua função

echo '<meta property="og:image" content="' . $recipe->image . '" />';
echo '<meta property="og:title" content="' . $recipe->title . '" />';
```

## 📱 Compatibilidade

- ✅ **Android**: Chrome, Edge, Samsung Internet
- ✅ **iOS**: Safari (limitações no PWA)
- ✅ **Desktop**: Chrome, Edge, Opera
- ⚠️ **iOS PWA**: Algumas limitações (sem push notifications)

## 🎨 Customizações

### Cores do tema:
- **Primary**: `#ec4899` (pink-500)
- **Background**: `#ffffff`
- **Theme**: Rosa/pink

### Textos personalizáveis:
- Título do app no manifest
- Mensagens de compartilhamento
- Descrições dos atalhos 