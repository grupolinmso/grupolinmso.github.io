// form-handler.js

let serverErrorCount = 0; 

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
        
        // Bloqueo inmediato del botón submit
        submitButton.disabled = true;
        submitButton.classList.add('htmx-request'); // Muestra el spinner
        

        // Limpiar mensaje anterior
        if (responseDiv) {
            responseDiv.innerHTML = '';
            responseDiv.className = '';
        }
        
        // Función helper para re-habilitar el botón en caso de error local
        const handleLocalError = (message) => {
            event.preventDefault(); // Detiene el envío de HTMX
            if (responseDiv) {
                responseDiv.innerHTML = `<div class="warning"><strong>Error de validación:</strong> ${message}</div>`;
                responseDiv.classList.add('warning');
            }

            submitButton.classList.remove('htmx-request');

            setTimeout(() => {
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
                // El setTimeout solo re-habilita el botón
                submitButton.disabled = false;
                
            }, 5000);
            return false;
        };

        // Validaciones
        if (!nombreInput.value.trim()) {
            return handleLocalError('El nombre es requerido.');
        }
        
        const telefonoLimpio = telefonoInput.value.replace(/\D/g, '');
        if (telefonoLimpio.length !== 10) {
            return handleLocalError('El teléfono debe contener 10 dígitos.');
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(emailInput.value)) {
            return handleLocalError('El correo electrónico no es válido.');
        }
        
        if (!servicioSelect.value) {
            return handleLocalError('Debes seleccionar un tipo de servicio.');
        }

        // Si todo pasa, el botón se queda deshabilitado y HTMX envía la petición
    });
    
    // DESHABILITAR COMO SEGURO
    form.addEventListener('htmx:beforeRequest', function() {
        console.log('Iniciando petición...');
        submitButton.disabled = true;
        submitButton.classList.add('htmx-request'); 
        
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
            if (responseDiv) { responseDiv.classList.add('warning'); }
            submitButton.classList.remove('htmx-request');
            setTimeout(() => {
                submitButton.disabled = false;
                if (responseDiv) {
                    responseDiv.innerHTML = '';
                    responseDiv.className = '';
                }
            }, 5000);
            return;
        }
        
        // RATE LIMITING (429)
        if (statusCode === 429) {
            console.log('Rate limit excedido');
            form.reset();
            submitButton.disabled = true;
            submitButton.classList.remove('htmx-request');
            return;
        }
        
        // ERROR DEL SERVIDOR (500)
        if (statusCode >= 500) {
            console.log('Error del servidor');
            serverErrorCount++;

            if (serverErrorCount >= 3) {
                console.log('Bloqueo permanente por 3 fallos del servidor');
                form.reset();
                submitButton.disabled = true;
                submitButton.classList.remove('htmx-request');
            } else {
                console.log(`Error temporal (${serverErrorCount}/3)`);
                submitButton.classList.remove('htmx-request');
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
            serverErrorCount = 0;
            form.reset();

            submitButton.classList.remove('htmx-request');

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
            submitButton.classList.remove('htmx-request');
            
        } else {
            submitButton.classList.remove('htmx-request');

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