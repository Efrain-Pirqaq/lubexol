# Reglas de negocio

- La unidad comercial principal propuesta es la caja; validar excepciones por producto.
- Unidades por caja deben ser un dato explícito por presentación, nunca inferido.
- Precio, moneda, vendedor, vigencia y condiciones deben mostrarse solo si están confirmados.
- Cada vendedor debe tener un destino de contacto autorizado y validado.
- La web no confirma stock, reserva, entrega ni venta por generar un mensaje.
- El cliente revisa el mensaje antes de enviarlo.
- Los artículos pueden enlazar a productos relacionados, pero no deben afirmar disponibilidad o precio no verificados.
- Las reglas comerciales específicas se configuran por implementación, no se codifican como constantes del núcleo.
