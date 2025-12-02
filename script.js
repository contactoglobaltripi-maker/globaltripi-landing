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

    // Compose email (mailto)
    // Dirección de correo donde se enviará el consolidado de cotizaciones
    // Puedes modificarla según tus necesidades. Por defecto utilizamos el dominio .co
    const adminEmail = 'contacto@globaltripi.com';
    const subject = encodeURIComponent('Solicitud de cotización de viaje');
    let body = 'Nueva solicitud de cotización:%0D%0A%0D%0A';
    Object.keys(data).forEach((key) => {
      body += `${key}: ${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}%0D%0A`;
    });
    // Create a mailto link
    const mailtoLink = `mailto:${adminEmail}?subject=${subject}&body=${body}`;

    // Open the mailto link in the user's email client
    window.location.href = mailtoLink;

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
});