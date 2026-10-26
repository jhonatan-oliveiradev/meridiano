# Metadados e compartilhamento

URL canônica: `https://meridiano.jhonatanoliveira.com/`, confirmada nos domínios do projeto Vercel. A aplicação usa navegação por fragmento; o sitemap contém apenas a raiz. Países e sessões locais não geram URLs públicas próprias.

Título, descrição, application-name, canonical, robots, Open Graph e Twitter Card ficam no HTML inicial, disponíveis sem JavaScript. Open Graph informa site, tipo website, idioma pt_BR, imagem JPEG, dimensões e texto alternativo. Twitter usa summary_large_image. Ícones existentes são preservados.

A imagem `dist/og-image.jpg` tem 1200 × 630, aproximadamente 60 KB e usa Space Grotesk/Manrope, paleta e globo do app. O território é produzido pelo mesmo gerador procedural (semente 1042), com estados e curvas de nível, sem dados de sessão.

Para editar a arte: execute `node scripts/render-og.mjs` após preparar as dependências/vendor. Abra `/og-preview.html` no servidor local, espere as fontes carregarem e capture a área de 1200 × 630 a partir de (0,0). Exporte como JPEG em `dist/og-image.jpg`. A imagem pronta é versionada; o build não depende de browser ou gerador de imagens. O HTML de autoria é excluído do build.

`robots.txt` indica o sitemap e não inclui rotas da API na indexação; não é controle de acesso. As URLs de imagem/canonical apontam para produção. A publicação do arquivo no domínio canônico ocorre ao promover para main; previews protegidos da Vercel podem impedir leitura por crawlers de redes sociais.
