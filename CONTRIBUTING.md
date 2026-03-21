# Guía de Contribución

¡Hola! Muchas gracias por tu interés en aportar al proyecto. Toda la ayuda es súper bienvenida. Para que tu Pull Request (PR) se revise y apruebe rápidamente, te compartimos los lineamientos principales del proyecto.

## 1. Alcance del Proyecto
DICIS-Tracker está diseñado para ser una herramienta de consulta rápida para estudiantes. 
* **Mantén el enfoque:** Evita proponer funcionalidades que lo conviertan en una herramienta de gestión personal (como paneles de usuario o registro histórico de materias). Por cuestiones de términos legales y enfoque, queremos evitar replicar los sistemas y plataformas oficiales de la universidad.

## 2. Rendimiento y Arquitectura
Dado que gran parte del tráfico proviene de dispositivos móviles, la eficiencia y el uso de batería son críticos.
* **Procesamiento en el Backend:** La lógica de negocio compleja, los filtros sobre listas grandes, y la validación de solapamientos deben procesarse en la API. El frontend debe mantenerse ligero y dedicarse principalmente a renderizar la información. Evita introducir ciclos de alta complejidad algorítmica en el cliente.
* **Optimización en el Cliente:** Minimiza las recargas constantes o el uso de temporizadores (`setInterval`) repetitivos en el frontend para actualizar datos, ya que esto degrada la experiencia en celulares y limita el uso del caché.

## 3. Manejo de Dependencias
Al ser una aplicación enfocada en la rapidez, somos rigurosos con el tamaño del proyecto.
* **Evalúa la necesidad:** Preferimos evitar incluir paquetes o librerías pesadas (como herramientas avanzadas de manejo de estado o virtualización) si la funcionalidad puede resolverse con el stack actual o usando enfoques más livianos. Toda nueva dependencia debe estar fuertemente justificada.

## 4. Diseño y Estilos
* **Coherencia Visual:** Procura mantener la coherencia con el diseño y la paleta de colores actual. Si deseas proponer un cambio general a la interfaz o implementar nuevos temas visuales, por favor abre un *Issue* primero para discutirlo antes de escribir el código.

## 5. Mantenibilidad e Infraestructura
El propósito a largo plazo del proyecto es mantenerlo **100% gratuito** apoyándonos en tiers gratuitos de plataformas como Vercel y GitHub Actions.
* **Eficiencia:** Cualquier contribución que mejore los tiempos de carga, reduzca consultas innecesarias, optimice la base de datos o disminuya tiempos de *build* es sumamente valorada.

## 6. Sugerencias para PRs
* **PRs Atómicos:** Mantén tus PRs enfocados en una sola cosa. Si deseas realizar mejoras de UI/componentes y a la vez modificar lógica profunda de los servicios, es mejor separarlos en PRs distintos. Esto facilita mucho su revisión e integración.

¡Gracias de nuevo por tu tiempo y tus aportes! Estamos emocionados de colaborar contigo.
