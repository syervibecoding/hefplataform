# Persistir a página ativa

## Problema
Hoje, `activePage`, `activeProduct`, `selectedClient` e `selectedConsultoriaId` vivem apenas em `useState` dentro de `src/pages/Index.tsx`. Quando você sai da aba do navegador e volta, ou recarrega, o React monta tudo do zero e cai no estado inicial `"home"`.

## Solução
Salvar o estado de navegação no `localStorage` e restaurar na montagem do `Index`. Sem mudar rotas nem o resto da arquitetura — é só persistência leve do estado já existente.

### O que será persistido
- `activePage` (string)
- `activeProduct` (ProductId)
- `selectedClient` (objeto do cliente — para que "Detalhe do cliente" continue funcionando ao voltar)
- `selectedConsultoriaId` (string | null)

Tudo sob uma chave única, ex.: `hef:nav-state:v1`.

### Como vai funcionar
1. Na montagem do `Index`, ler o JSON salvo. Se existir e `activePage` for válido, usar como estado inicial em vez de `"home"`.
2. Um `useEffect` observa esses 4 estados e regrava o JSON sempre que mudam (debounce simples não é necessário, são mudanças raras).
3. Ao deslogar (no `AuthContext.signOut`), limpar a chave para que outro usuário não herde a navegação anterior.
4. Guardar a versão (`v1`) na chave para invalidar facilmente no futuro se o shape mudar.

### Detalhes técnicos
- Arquivo principal alterado: `src/pages/Index.tsx`.
  - Trocar `useState("home")` etc. por inicializadores lazy que leem do `localStorage`.
  - Adicionar `useEffect` que serializa `{ activePage, activeProduct, selectedClient, selectedConsultoriaId }`.
- Pequeno ajuste em `src/contexts/AuthContext.tsx`: no `signOut`, remover a chave `hef:nav-state:v1`.
- Sem mudanças em rotas, sem novas dependências.

### Fora de escopo
- Não vou migrar a navegação para URLs do React Router (`/clientes`, `/assistente`, etc.). Isso resolveria o mesmo problema de forma mais "web-nativa" (URL compartilhável, botão voltar do navegador), mas é uma mudança bem maior. Posso fazer depois se quiser.
