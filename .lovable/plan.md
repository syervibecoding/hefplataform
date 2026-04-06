

# Plano: Nova Identidade Visual (HefSys) + CRUD completo de Produtos

## Resumo

Duas frentes: (1) trocar a identidade visual da plataforma para o design system "Neon Monolith" do DESIGN.md com a logo HefSys, e (2) adicionar edição e exclusão de produtos no seletor da sidebar.

---

## 1. Nova Identidade Visual

### 1.1 Logo
- Copiar `user-uploads://Logotipo_hefsys_-_fundo_transparente.png` para `src/assets/logo-hefsys.png`
- Substituir importações de `logo-white.png` e `logo-vivid-violet.png` nos dois lugares:
  - **Sidebar.tsx** (linha 3, 56): trocar logo e alt text para "HefSys"
  - **LoginPage.tsx** (linha 6, 29): trocar logo e alt text

### 1.2 Paleta de Cores (index.css)
Migrar do violeta para o design system "Neon Monolith":
- **Background**: `#0e0e0e` → HSL `0 0% 5.5%`
- **Primary**: lime `#b4f78d` → HSL `100 88% 76%`
- **Primary-foreground**: dark green `#266003` → HSL `100 95% 19%`
- **Card/Surface**: `#191919` → HSL `0 0% 10%`
- **Secondary/Muted**: `#1f1f1f` → HSL `0 0% 12%`
- **Border**: ghost border sutil `#484848` 15% opacity → HSL `0 0% 18%`
- **Foreground**: `#e0e0e0` → HSL `0 0% 88%`
- **Muted-foreground**: `#ababab` → HSL `0 0% 67%`
- **Sidebar**: mesma hierarquia tonal mas levemente mais escuro
- **Accent**: usar lime como accent
- Remover/atualizar tokens `--clix-*` para `--hef-*` com a nova paleta
- Atualizar `--ring` para lime

### 1.3 Tipografia
- Instalar `@fontsource/space-grotesk` e `@fontsource/manrope`
- **Space Grotesk**: headlines, display, títulos (font-bold, tracking-tight)
- **Manrope**: body text, labels
- Atualizar `tailwind.config.ts` font families
- Atualizar `body` font-family para Manrope
- Manter JetBrains Mono para dados numéricos

### 1.4 Tailwind Config
- Atualizar cores em `tailwind.config.ts` (renomear `clix` → `hef`)
- Atualizar animação `pulse-violet` → `pulse-lime`
- Ajustar keyframes para nova cor

### 1.5 Textos de branding
- Trocar "Clix Company" → "HefSys" e "Plataforma Interna" (manter ou ajustar) em Sidebar e LoginPage

---

## 2. CRUD Completo de Produtos (Editar + Excluir)

### 2.1 Sidebar.tsx — Botões de ação no dropdown
- Ao lado de cada produto no dropdown, adicionar ícones de **editar** (Pencil) e **excluir** (Trash2), visíveis apenas para admins
- Ícones pequenos no canto direito de cada item do dropdown

### 2.2 Dialog de Edição
- Reutilizar a mesma estrutura do dialog de criação
- Pré-preencher campos (nome, descrição, ícone)
- Chamar `editProduct.mutate` ao salvar

### 2.3 Dialog de Exclusão
- Confirmação simples com nome do produto
- Chamar `deleteProduct.mutate` ao confirmar
- Se o produto ativo for excluído, trocar para o primeiro produto disponível

### 2.4 Hook useProducts
- Já possui `editProduct` e `deleteProduct` — nenhuma mudança necessária no hook

---

## Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| `src/assets/logo-hefsys.png` | Novo (copiar upload) |
| `src/index.css` | Nova paleta, novas fontes |
| `tailwind.config.ts` | Fontes, cores, animações |
| `package.json` | Adicionar `@fontsource/space-grotesk`, `@fontsource/manrope` |
| `src/components/Sidebar.tsx` | Logo, branding, edit/delete dialogs |
| `src/pages/LoginPage.tsx` | Logo e branding |

