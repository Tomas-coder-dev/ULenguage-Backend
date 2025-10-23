const { exec } = require('child_process');

exports.deploy = async (req, res) => {
  const token = req.query.token;
  if (token !== process.env.DEPLOY_TOKEN) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  exec('cd C:/Users/andre/OneDrive/Desktop/tesis/ULenguage-Backend && git pull origin main && pm2 restart all', (err, stdout, stderr) => {
    if (err) return res.status(500).json({ message: 'Error al actualizar', error: stderr });
    res.json({ message: 'Despliegue ejecutado', output: stdout });
  });
};
