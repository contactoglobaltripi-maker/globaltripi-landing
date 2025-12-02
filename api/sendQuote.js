const XLSX = require('xlsx');
const nodemailer = require('nodemailer');
const fs = require('fs');
const os = require('os');
const path = require('path');

/*
 * Endpoint API para procesar las solicitudes de cotización.
 * Recibe los datos del formulario, genera un archivo Excel
 * con la información y lo envía por correo electrónico a la
 * dirección especificada en las variables de entorno.
 */
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }
  let data = req.body;
  // El cuerpo puede venir como cadena; convertir a objeto
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (err) {
      res.status(400).json({ success: false, error: 'Invalid JSON body' });
      return;
    }
  }
  try {
    // Generar libro y hoja de cálculo
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet([data]);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Cotizacion');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    // Guardar en archivo temporal
    const filePath = path.join(os.tmpdir(), `cotizacion_${Date.now()}.xlsx`);
    fs.writeFileSync(filePath, buffer);
    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    // Configurar opciones de correo
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.TO_EMAIL || 'contacto@globaltripi.co',
      subject: 'Nueva solicitud de cotización de GlobalTripi',
      text: 'Adjunto encontrarás la solicitud en formato Excel.',
      attachments: [
        {
          filename: 'cotizacion.xlsx',
          path: filePath,
        },
      ],
    };
    // Enviar correo
    await transporter.sendMail(mailOptions);
    // Eliminar archivo temporal
    fs.unlinkSync(filePath);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};