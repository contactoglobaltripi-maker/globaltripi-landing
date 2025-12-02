// Script for GlobalTripi landing page

/**
 * Función de ejemplo para integrar APIs externas en el futuro.
 * Recibe los datos del formulario y debe realizar las llamadas necesarias a los servicios
 * de las compañías de asistencia/seguro. Actualmente imprime los datos en la consola
 * como referencia. Más adelante se podrá conectar con APIs para convertir el sitio
 * en un metacomparador transaccional.
 */
function fetchQuotesFromAPI(formData) {
  // TODO: Implementar la lógica para enviar los datos del formulario a los distintos
  // proveedores a través de sus API y recoger sus cotizaciones.
  console.log('API placeholder: datos recibidos', formData);
}
document.addEventListener('DOMContentLoaded', () => {
  /* Carousel functionality */
  const slides = document.querySelectorAll('.slide');
  const prev = document.querySelector('.prev');
  const next = document.querySelector('.next');
  let currentIndex = 0;
  let carouselInterval;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
  }

  function nextSlide() {
    currentIndex = (currentIndex + 1) % slides.length;
    showSlide(currentIndex);
  }

  function prevSlide() {
    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
    showSlide(currentIndex);
  }

  function startCarousel() {
    // Reinicia cualquier intervalo existente antes de crear uno nuevo
    clearInterval(carouselInterval);
    // Inicializa un intervalo que avanza al siguiente slide cada 5 segundos
    carouselInterval = setInterval(() => {
      nextSlide();
    }, 5000);
  }

  function stopCarousel() {
    clearInterval(carouselInterval);
  }

  // Start the carousel on load
  startCarousel();

  // Control buttons
  if (prev && next) {
    prev.addEventListener('click', () => {
      stopCarousel();
      prevSlide();
      startCarousel();
    });
    next.addEventListener('click', () => {
      stopCarousel();
      nextSlide();
      startCarousel();
    });
  }

  /* Form submission */
  const form = document.getElementById('quoteForm');
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // Gather form data
    const formData = new FormData(form);
    const data = {};
    formData.forEach((value, key) => {
      // Combine checkbox values under the same name into array
      if (data[key]) {
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    });
    // Timestamp
    data.timestamp = new Date().toISOString();

    // Placeholder: connect with external APIs to fetch quotes from multiple providers
    // In el futuro se utilizará esta función para obtener cotizaciones de diferentes
    // compañías de asistencia y seguros de viaje. Por ahora es un stub.
    fetchQuotesFromAPI(data);

    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('quotes') || '[]');
    saved.push(data);
    localStorage.setItem('quotes', JSON.stringify(saved));

    // Envío de la solicitud al endpoint serverless que generará un archivo Excel y enviará el correo.
    fetch('/api/sendQuote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((response) => {
      if (response.ok) {
        alert('¡Gracias! Tu solicitud ha sido enviada automáticamente.');
      } else {
        alert('Hubo un problema al enviar tu solicitud. Inténtalo de nuevo más tarde.');
      }
    }).catch(() => {
      alert('Hubo un problema al enviar tu solicitud. Inténtalo de nuevo más tarde.');
    });

    // Llamada opcional a APIs externas para obtener cotizaciones comparadas
    // Esta función es un espacio reservado para futuras integraciones con proveedores de seguros.
    // fetchQuotesFromAPI(data);

    // Reset form
    form.reset();

    alert('¡Gracias! Tu solicitud ha sido enviada.');
  });

  /* Newsletter subscription */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailValue = document.getElementById('newsletterEmail').value.trim();
      if (emailValue) {
        // Guardar en localStorage o enviar a un servidor en el futuro
        const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
        subscribers.push({ email: emailValue, timestamp: new Date().toISOString() });
        localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
        alert('¡Gracias por suscribirte!');
        newsletterForm.reset();
      }
    });
  }

  /* Download data as CSV */
  const downloadButton = document.getElementById('downloadData');
  if (downloadButton) {
    downloadButton.addEventListener('click', () => {
      const saved = JSON.parse(localStorage.getItem('quotes') || '[]');
      if (saved.length === 0) {
        alert('No hay solicitudes registradas.');
        return;
      }
      // Build CSV header
      const headers = Object.keys(saved[0]);
      const csvRows = [headers.join(',')];
      saved.forEach((item) => {
        const row = headers.map((h) => {
          const value = item[h];
          return Array.isArray(value) ? `"${value.join('; ')}"` : `"${value}"`;
        }).join(',');
        csvRows.push(row);
      });
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'solicitudes_globaltripi.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  /* Dinámica de edades y QR para grupos de pasajeros */
  const pasajerosSelect = document.getElementById('pasajeros');
  const edadContainer = document.getElementById('edadContainer');
  const qrPopup = document.getElementById('qrPopup');
  if (pasajerosSelect) {
    const closePopupButton = qrPopup ? qrPopup.querySelector('.close') : null;
    pasajerosSelect.addEventListener('change', () => {
      const value = pasajerosSelect.value;
      // Oculta cualquier popup visible al cambiar el valor
      if (qrPopup) {
        qrPopup.style.display = 'none';
      }
      // Limpia el contenedor de edades antes de crear nuevos campos
      if (edadContainer) {
        edadContainer.innerHTML = '';
      }
      if (!value) {
        return;
      }
      // Si se selecciona 'more', mostrar el popup con el código QR
      if (value === 'more') {
        if (qrPopup) {
          qrPopup.style.display = 'flex';
        }
        return;
      }
      const num = parseInt(value, 10);
      if (!isNaN(num) && num > 0) {
        // Función para calcular la edad en años a partir de una fecha
        const calcularEdad = (fecha) => {
          const hoy = new Date();
          let edad = hoy.getFullYear() - fecha.getFullYear();
          const mes = hoy.getMonth() - fecha.getMonth();
          if (mes < 0 || (mes === 0 && hoy.getDate() < fecha.getDate())) {
            edad--;
          }
          return edad;
        };
        // Calcular la fecha máxima (hoy) en formato ISO para limitar el campo de fecha
        const hoyISO = new Date().toISOString().split('T')[0];
        for (let i = 1; i <= num; i++) {
          const entry = document.createElement('div');
          entry.className = 'age-entry';
          // Etiqueta para el campo de fecha de nacimiento
          const label = document.createElement('label');
          label.setAttribute('for', `dob_${i}`);
          label.textContent = `Fecha de nacimiento pasajero ${i}`;
          // Campo de fecha de nacimiento
          const dateInput = document.createElement('input');
          dateInput.type = 'date';
          dateInput.id = `dob_${i}`;
          dateInput.name = `dob_${i}`;
          dateInput.max = hoyISO;
          dateInput.required = true;
          // Elemento para mostrar la edad calculada
          const ageDisplay = document.createElement('span');
          ageDisplay.className = 'age-output';
          ageDisplay.id = `ageOutput_${i}`;
          // Campo oculto para almacenar la edad calculada
          const hiddenAge = document.createElement('input');
          hiddenAge.type = 'hidden';
          hiddenAge.id = `edad_${i}`;
          hiddenAge.name = `edad_${i}`;
          // Evento para actualizar la edad cuando cambia la fecha de nacimiento
          dateInput.addEventListener('change', (ev) => {
            const valor = ev.target.value;
            if (valor) {
              const fechaNac = new Date(valor);
              const edadCalculada = calcularEdad(fechaNac);
              hiddenAge.value = edadCalculada;
              ageDisplay.textContent = `${edadCalculada} años`;
            } else {
              hiddenAge.value = '';
              ageDisplay.textContent = '';
            }
          });
          // Añadir elementos al contenedor
          entry.appendChild(label);
          entry.appendChild(dateInput);
          entry.appendChild(ageDisplay);
          entry.appendChild(hiddenAge);
          edadContainer.appendChild(entry);
        }
      }
    });
    // Cerrar el popup cuando se hace clic en la 'x'
    if (closePopupButton) {
      closePopupButton.addEventListener('click', () => {
        qrPopup.style.display = 'none';
      });
    }
  }
});