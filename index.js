const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');

try {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  ffmpeg.setFfmpegPath(ffmpegPath);
} catch (error) {
  console.warn("AVISO: Para garantir o funcionamento em qualquer máquina, instale o ffmpeg via npm: 'npm install @ffmpeg-installer/ffmpeg'");
}

const app = express();
const PORT = 3000;

// Definição dos diretórios
const UPLOADS_DIR = 'uploads/';
const CONVERTED_DIR = 'converted/';

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);
if (!fs.existsSync(CONVERTED_DIR)) fs.mkdirSync(CONVERTED_DIR);

app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ dest: UPLOADS_DIR });

// Rota GET para servir o formulário HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('Nenhum arquivo foi enviado.');
  }

  const inputPath = req.file.path;
  const originalName = path.parse(req.file.originalname).name; 
  const outputFilename = `${originalName}.mp3`;
  const outputPath = path.join(CONVERTED_DIR, outputFilename);

  console.log(`Convertendo: ${req.file.originalname} -> ${outputFilename}`);

  ffmpeg(inputPath)
    .toFormat('mp3')
    .on('end', () => {
      console.log('Conversão finalizada com sucesso.');
      fs.unlinkSync(inputPath); 
      res.download(outputPath, outputFilename, (err) => {
        if (err) {
          console.error("Erro ao enviar o arquivo para download:", err);
        }
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', err => {
      console.error(err);
      fs.unlinkSync(inputPath);
      res.status(500).send('Erro ao converter o vídeo.');
    })
    .save(outputPath);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});