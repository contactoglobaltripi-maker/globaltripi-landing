const nodemailer = require('nodemailer');
const XLSX = require('xlsx');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // El cuerpo puede venir como string o como objeto
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Fila con la info principal de la cotización
    const row = {
      Origen: body.origin || '',
      Destino: body.destination || '',
      Pasajeros: body.passengers || '',
      'Fecha salida': body.departureDate || '',
      'Fecha regreso': body.returnDate || '',
      'Correo cliente': body.email || '',
      WhatsApp: body.whatsapp || '',
      'SIM física': body.simType === 'physical' ? 'Sí' : 'No',
      'eSIM virtual': body.simType === 'virtual' ? 'Sí' : 'No',
      'Fechas nacimiento': (body.passengerBirthdates || []).join(', ')
    };

    // Crear libro y hoja de Excel en memoria
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([row]);
    XLSX.utils.book_append_sheet(wb, ws, 'Cotizacion');

    // Generar buffer del archivo .xlsx
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Transporter SMTP usando las variables de entorno de Vercel
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

    // Enviar correo con el Excel adjunto
    await transporter.sendMail({
      from: `"GlobalTripi" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: 'Nueva solicitud de cotización desde la web',
      text: 'Adjuntamos el archivo con la solicitud de cotización.',
      attachments: [
        {
          filename: 'cotizacion-globaltripi.xlsx',
          content: buffer
        }
      ]
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Error en /api/sendQuote:', error);
    return res.status(500).json({ error: 'Error enviando la cotización' });
  }
};
