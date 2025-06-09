interface ShareData {
  title: string;
  description: string;
  image: string;
  url: string;
  id: string;
}

// URL da página de vendas/marketing do app
const LANDING_PAGE_URL = "https://deliciadobem.com.br"; // Substitua pela URL real

export const generateShareText = (title: string, description: string) => {
  return `🍰 ${title}

✨ ${description}

🥄 Receita 100% sem glúten e sem lactose
📱 Descubra mais receitas deliciosas no DeliciasDoBem!

#SemGluten #SemLactose #ReceitaSaudavel #DeliciasDoBem`;
};

export const generateShareURL = (recipeId: string) => {
  // URL que redireciona para a página de vendas com tracking
  return `${LANDING_PAGE_URL}?ref=recipe&id=${recipeId}`;
};

export const shareToWhatsApp = (data: ShareData) => {
  const text = generateShareText(data.title, data.description);
  const url = generateShareURL(data.id);
  
  // Texto simples + URL (WhatsApp fará preview automático da imagem via Open Graph)
  const whatsappText = `${text}\n\n👇 Conheça o app:\n${url}`;
  
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
  window.open(whatsappUrl, '_blank');
};

export const shareToFacebook = (data: ShareData) => {
  const url = generateShareURL(data.id);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(generateShareText(data.title, data.description))}`;
  window.open(facebookUrl, '_blank');
};

export const shareToTwitter = (data: ShareData) => {
  const text = generateShareText(data.title, data.description);
  const url = generateShareURL(data.id);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank');
};

export const shareToInstagram = (data: ShareData) => {
  // Instagram não permite compartilhamento direto, então copiamos o texto
  const text = generateShareText(data.title, data.description);
  const url = generateShareURL(data.id);
  const fullText = `${text}\n\n👇 Link na bio:\n${url}`;
  
  navigator.clipboard.writeText(fullText);
  return {
    success: true,
    message: "Texto copiado! Cole no Instagram e adicione a imagem da receita.",
    text: fullText
  };
};

export const shareToLinkedIn = (data: ShareData) => {
  const url = generateShareURL(data.id);
  const text = generateShareText(data.title, data.description);
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(data.title)}&summary=${encodeURIComponent(text)}`;
  window.open(linkedinUrl, '_blank');
};

export const shareToTelegram = (data: ShareData) => {
  const text = generateShareText(data.title, data.description);
  const url = generateShareURL(data.id);
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
  window.open(telegramUrl, '_blank');
};

export const copyToClipboard = (data: ShareData) => {
  const text = generateShareText(data.title, data.description);
  const url = generateShareURL(data.id);
  const fullText = `${text}\n\n👇 Conheça o app:\n${url}`;
  
  return navigator.clipboard.writeText(fullText);
};

export const nativeShare = async (data: ShareData) => {
  const url = generateShareURL(data.id);
  const text = generateShareText(data.title, data.description);
  
  // Tentar compartilhar com imagem (quando suportado)
  if (navigator.canShare && data.image) {
    try {
      // Converter imagem para File se for uma URL
      const imageFile = await urlToFile(data.image, `${data.title}.jpg`, 'image/jpeg');
      
      const shareData = {
        title: `${data.title} - DeliciasDoBem`,
        text: text,
        url: url,
        files: [imageFile]
      };

      if (navigator.canShare(shareData)) {
        return navigator.share(shareData);
      }
    } catch (error) {
              // Compartilhamento com imagem falhou, usando apenas texto
    }
  }
  
  // Fallback para compartilhamento apenas com texto
  return navigator.share({
    title: `${data.title} - DeliciasDoBem`,
    text: text,
    url: url,
  });
};

// Função auxiliar para converter URL em File
const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new File([blob], filename, { type: mimeType });
}; 