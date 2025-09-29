interface WebhookConfig {
    attempts: number;
    backoff: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
    limiter: {
      max: number;
      duration: number;
    };
  }
  
  interface Config {
    webhook: WebhookConfig;
    // Adicione outras configurações conforme necessário
  }
  
  function configLoader(): Config {

    return {
      webhook: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        limiter: {
          max: 1,
          duration: 500,
        },
      },
      // Adicione outras configurações conforme necessário
    };
  }
  
  export default configLoader;
  