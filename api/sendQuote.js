const nodemailer = require('nodemailer');
const XLSX = require('xlsx');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // El cuerpo puede venir como string o como objeto
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Mapeamos los nombres de campos del formulario a columnas del Excel
    const row = {
      Origen: body.origen || '',
      Destino: body.destino || '',
      Pasajeros: body.pasajeros || '',
      'Fecha salida': body.fechaInicio || '',
      'Fecha regreso': body.fechaFin || '',
      'Correo cliente': body.email || '',
      'SIM física': body.sim ? 'Sí' : 'No',
      'eSIM virtual': body.esim ? 'Sí' : 'No',
      'Fechas nacimiento': '' // se rellenará a continuación
    };

    // Recoger fechas de nacimiento de los campos dob_1, dob_2, etc.
    const fechasNac = [];
    Object.keys(body).forEach((key) => {
      if (key.startsWith('dob_')) {
        fechasNac.push(body[key]);
      }
    });
    row['Fechas nacimiento'] = fechasNac.join(', ');

    // Crear el libro de Excel en memoria
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([row]);
    XLSX.utils.book_append_sheet(wb, ws, 'Cotizacion');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Configurar transporte SMTP con las variables de entorno
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const toEmail = process.env.TO_EMAIL || process.env.SMTP_USER;

    // Enviar correo con el archivo adjunto
    await transporter.sendMail({
      from: `"GlobalTripi" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'Nueva solicitud de cotización desde la web',
      text: 'Adjuntamos archivo con los datos de la cotización.',
      attachments: [
        {
          filename: 'cotizacion-globaltripi.xlsx',
          content: buffer
        }
      ]
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error en /api/sendQuote:', err);
    return res.status(500).json({ error: 'Error enviando la cotización' });
  }
};
