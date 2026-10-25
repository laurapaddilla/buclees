# Input

Campo de texto con etiqueta, ayuda y mensaje de error.

- **Qué aporta quien lo usa:** `label` (obligatorio salvo en buscadores con `aria-label`), `hint` opcional, `error` cuando la validación falla y los props nativos de `<input>`.
- La etiqueta va siempre visible encima; el placeholder es un ejemplo, no la etiqueta.
- El error se escribe en positivo y dice cómo arreglarlo («Escribe un número de vueltas»). Se anuncia con el prefijo «Error:» y borde `danger`.

**No:** etiquetas solo como placeholder; mensajes del tipo «Campo inválido».
