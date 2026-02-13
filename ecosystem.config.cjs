module.exports = {
  apps: [
    {
      name: 'webapp',
      script: 'npx',
      args: 'wrangler pages dev dist --d1=jiyushindo-gakushu-production --persist-to=.wrangler/state --local --ip 0.0.0.0 --port 3000',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        WRANGLER_SEND_METRICS: 'false',
        CLOUDFLARE_API_TOKEN: 'local-dev',
        NO_UPDATE_NOTIFIER: 'true'
      },
      watch: false,
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
