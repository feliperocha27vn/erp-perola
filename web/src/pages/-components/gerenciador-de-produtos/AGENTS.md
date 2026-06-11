# AGENTS.md — gerenciador-de-produtos

## Regra de Arquitetura

Componentes complexos de UI nesta área devem utilizar obrigatoriamente o Pattern de Composição (Composition Pattern), com subcomponentes focados e API por namespace.

## Objetivo

Essa regra existe para evitar prop drilling excessivo e impedir a formação de God Components com responsabilidades misturadas.

## Referência na base

A refatoração de `product-card.tsx` estabelece o padrão oficial desta pasta:

- `ProductCard.Root`
- `ProductCard.Header`
- `ProductCard.Image`
- `ProductCard.Actions`
- `ProductCard.EditForm`

Novos componentes com múltiplas responsabilidades devem seguir essa mesma abordagem.
