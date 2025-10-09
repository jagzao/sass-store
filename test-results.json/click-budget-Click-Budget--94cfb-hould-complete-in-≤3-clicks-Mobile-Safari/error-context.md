# Page snapshot

```yaml
- generic [active] [ref=e1]:
    - alert [ref=e2]
    - generic [ref=e5]:
        - generic [ref=e6]:
            - generic [ref=e7]: 🔍
            - heading "404" [level=1] [ref=e8]:
                - text: "4"
                - generic [ref=e9]: "0"
                - text: "4"
        - generic [ref=e10]:
            - heading "Página no encontrada" [level=2] [ref=e11]
            - paragraph [ref=e12]: La página que buscas no existe o fue movida.
        - generic [ref=e13]:
            - link "🏠 Volver al Inicio" [ref=e14]:
                - /url: /
                - generic [ref=e15]: 🏠
                - text: Volver al Inicio
            - button "⬅️ Página Anterior" [ref=e16] [cursor=pointer]:
                - generic [ref=e17] [cursor=pointer]: ⬅️
                - text: Página Anterior
        - generic [ref=e18]:
            - paragraph [ref=e19]: ¿Sigues teniendo problemas?
            - generic [ref=e20]:
                - link "📞 Contactar Soporte" [ref=e21]:
                    - /url: /support
                - link "✉️ Enviar Email" [ref=e22]:
                    - /url: mailto:help@zo.dev
```
