// Estende o app.json. EXPO_BASE_URL define o subcaminho do site publicado
// (ex.: "/campus" no GitHub Pages). Em desenvolvimento fica vazio: http://localhost:8081.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || '',
  },
});
