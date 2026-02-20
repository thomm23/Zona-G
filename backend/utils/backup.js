// utils/backup.js
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

const backupDir = path.resolve(__dirname, '../backups');

// Crear directorio de backups si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const hacerBackup = () => {
  return new Promise((resolve, reject) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.sqlite`);

    // Leer la base de datos actual
    const dbPath = path.resolve(__dirname, '../database.sqlite');

    try {
      // Copiar archivo de base de datos
      fs.copyFileSync(dbPath, backupPath);
      console.log(`✅ Backup creado: ${backupPath}`);

      // Mantener solo los últimos 10 backups
      const files = fs.readdirSync(backupDir).sort().reverse();
      if (files.length > 10) {
        for (let i = 10; i < files.length; i++) {
          const antiguoBackup = path.join(backupDir, files[i]);
          fs.unlinkSync(antiguoBackup);
          console.log(`🗑️ Backup antiguo eliminado: ${files[i]}`);
        }
      }

      resolve({ success: true, path: backupPath });
    } catch (err) {
      console.error('❌ Error al hacer backup:', err);
      reject(err);
    }
  });
};

// Hacer backup cada 6 horas
const iniciarBackupAutomatico = () => {
  // Hacer backup al iniciar
  hacerBackup().catch(err => console.error('Error en backup inicial:', err));

  // Hacer backup cada 6 horas (6 * 60 * 60 * 1000 ms)
  setInterval(() => {
    hacerBackup().catch(err => console.error('Error en backup automático:', err));
  }, 6 * 60 * 60 * 1000);

  console.log('🔄 Sistema de backup automático iniciado (cada 6 horas)');
};

module.exports = { hacerBackup, iniciarBackupAutomatico };
