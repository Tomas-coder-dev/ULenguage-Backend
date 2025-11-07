const { exec } = require('child_process');

exports.deploy = async (req, res) => {
  try {
    const token = req.query.token;
    if (token !== process.env.DEPLOY_TOKEN) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    exec(
      'cd ULenguage-Backend && git pull origin main && pm2 restart all',
      (err, stdout) => {
        if (err) {
          console.error('[Deploy][ERROR]', err);
          return res.status(500).json({ message: 'Error al ejecutar despliegue. Intenta nuevamente.' });
        }

        res.json({ message: 'Despliegue ejecutado', output: stdout });
      }
    );
  } catch (error) {
    console.error('[Deploy][ERROR]', error);
    res.status(500).json({ message: 'Error al ejecutar despliegue. Intenta nuevamente.' });
  }
};
