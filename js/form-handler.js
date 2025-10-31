// form-handler.js

// Variables de control LOCAL (solo para UI, no para lógica de negocio)
let serverErrorCount = 0;  // Solo para errores del servidor

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contact-form');
    
    if (!form) {
        console.error('El formulario con id="contact-form" no fue encontrado.');
        return;
    }
    
    const submitButton = form.querySelector('button[type="submit"]');
    const responseDiv = document.getElementById('form-response');
    const telefonoInput = form.querySelector('input[name="telefono"]');
    const nombreInput = form.querySelector('input[name="nombre"]');
    const emailInput = form.querySelector('input[name="email"]');
    const servicioSelect = form.querySelector('select[name="servicio"]');
    
    // VALIDACIÓN DEL LADO DEL CLIENTE
    form.addEventListener('submit', function(event) {
        // Limpiar mensaje anterior
        if (responseDiv) {
            responseDiv.innerHTML = '';
            responseDiv.className = '';
        }
        
        // Validar nombre
        if (!nombreInput.value.trim()) {
            event.preventDefault();
            if (responseDiv) {
                responseDiv.innerHTML = '<div class="warning"><strong>Error de validación:</strong> El nombre es requerido.</div>';
                responseDiv.classList.add('warning');
            }
            setTimeout(() => {
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
            return false;
        }
        
        // Validar teléfono (10 dígitos)
        const telefonoLimpio = telefonoInput.value.replace(/\D/g, '');
        if (telefonoLimpio.length !== 10) {
            event.preventDefault();
            if (responseDiv) {
                responseDiv.innerHTML = '<div class="warning"><strong>Error de validación:</strong> El teléfono debe contener exactamente 10 dígitos.</div>';
                responseDiv.classList.add('warning');
            }
            setTimeout(() => {
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
            return false;
        }
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            event.preventDefault();
            if (responseDiv) {
                responseDiv.innerHTML = '<div class="warning"><strong>Error de validación:</strong> El correo electrónico no es válido.</div>';
                responseDiv.classList.add('warning');
            }
            setTimeout(() => {
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
            return false;
        }
        
        // Validar servicio
        if (!servicioSelect.value) {
            event.preventDefault();
            if (responseDiv) {
                responseDiv.innerHTML = '<div class="warning"><strong>Error de validación:</strong> Debes seleccionar un tipo de servicio.</div>';
                responseDiv.classList.add('warning');
            }
            setTimeout(() => {
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
            return false;
        }
    });
    
    // DESHABILITAR BOTÓN DURANTE ENVÍO
    form.addEventListener('htmx:beforeRequest', function() {
        console.log('Iniciando petición...');
        submitButton.disabled = true;
        
        if (responseDiv) {
            responseDiv.innerHTML = '';
            responseDiv.className = '';
        }
    });

    // PERMITIR INTERCAMBIO DE CONTENIDO EN ERRORES
    form.addEventListener('htmx:beforeSwap', function(event) {
        const statusCode = event.detail.xhr.status;
        console.log(`Status code recibido: ${statusCode}`);
        
        if (statusCode === 400 || statusCode === 429 || statusCode === 500) {
            console.log('Forzando intercambio de contenido para error');
            event.detail.shouldSwap = true;
            event.detail.isError = false;
        }
    });

    // MANEJAR RESPUESTAS
    form.addEventListener('htmx:afterSwap', function(event) {
        const xhr = event.detail.xhr;
        const statusCode = xhr.status;
        
        console.log(`Procesando respuesta con status: ${statusCode}`);
        
        // ERROR DE VALIDACIÓN (400)
        if (statusCode === 400) {
            console.log('Error de validación');
            
            if (responseDiv) {
                responseDiv.classList.add('warning');
            }
            
            setTimeout(() => {
                submitButton.disabled = false;
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
            
            return;
        }
        
        // RATE LIMITING (429) - El backend maneja TODO 
        if (statusCode === 429) {
            console.log('Rate limit excedido');
            
            // El backend ya envió el mensaje apropiado
            // Simplemente deshabilitamos el botón permanentemente
            form.reset();
            submitButton.disabled = true;
            
            return;
        }
        
        // ERROR DEL SERVIDOR (500)
        if (statusCode >= 500) {
            console.log('Error del servidor');
            serverErrorCount++;

            if (serverErrorCount >= 3) {
                console.log('Bloqueo permanente por 3 fallos del servidor');
                
                // El mensaje ya viene del backend, solo ajustamos UI
                form.reset();
                submitButton.disabled = true;
                
            } else {
                console.log(`Error temporal (${serverErrorCount}/3)`);
                
                setTimeout(() => {
                    submitButton.disabled = false;
                    if (responseDiv) {
                        responseDiv.innerHTML = ''; 
                        responseDiv.className = '';
                    }
                }, 5000);
            }
            
            return;
        }
        
        // ÉXITO (200)
        if (statusCode === 200) {
            console.log('Envío exitoso');
            
            serverErrorCount = 0; // Resetear errores
            form.reset();

            setTimeout(() => {
                submitButton.disabled = false;
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
        }
    });
    
    // ERROR DE RED 
    form.addEventListener('htmx:responseError', function() {
        console.error('Error de red');
        
        serverErrorCount++;
        
        if (serverErrorCount >= 3) {
            console.log('Bloqueo permanente');
            
            if (responseDiv) {
                responseDiv.innerHTML = '<div class="error permanent"><strong>No fue posible enviar tu mensaje.</strong> Por favor, contáctanos por <strong>WhatsApp</strong> o por <strong>Correo Electrónico</strong>.</div>';
                responseDiv.classList.add('permanent');
            }
            
            form.reset();
            submitButton.disabled = true;
            
        } else {
            if (responseDiv) {
                responseDiv.innerHTML = `<div class="warning"><strong>Error de conexión.</strong> Verifica tu internet. (Intento ${serverErrorCount}/3)</div>`;
                responseDiv.classList.add('warning');
            }
            
            setTimeout(() => {
                submitButton.disabled = false;
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
        }
    });
});